//
// hbo.groovy
//

import groovy.transform.Field
import com.att.cicd.Constants

@Field final String HBO_REPO_URL = "ssh://git@codecloud.web.att.com:7999/st_advertise/hbo.git"
@Field final String HBO_REPO_FOLDER = "hbo"

@Field final String XAAF_HADRON_SDK = "xaaf-hadron-sdk"
@Field final String JS_REPO_XAAF_HADRON_SDK_PATH = "packages/frameworks/${XAAF_HADRON_SDK}/dist"
@Field final String HBO_REPO_XAAF_HADRON_SDK_PATH = "${HBO_REPO_FOLDER}/lib/js/@xaaf/${XAAF_HADRON_SDK}/dist"

@Field final String HBO_PIPELINE_NAME = "xaaf-js-hadron"

/**
 * Update Hardon SDK in HBO repo
 * @param shouldExecute should execute stage?
 */
void stageUpdateHadronSDK(boolean shouldExecute) {
	String stageName = "Update Hadron SDK"
  
    cicd_general.measureExecution(stageName) {
        stage(stageName) {
            cicd_general.stage_init()

            if (!shouldExecute) {
                cicd_execution.postSkipStage(stageName)
                return
            }

            String branchName = "${XAAF_HADRON_SDK}/build@${BUILD_ID}"

            initHBORepo()

            // Create new branch. Delete existing from `origin` if exists
            createBranch(branchName)

          	sleep(1)
          	
          	copySDKToLocalHBORepo()

            cicd_logger.info("Check if HADRON SDK changed")
            if (isRepoClean()) {
                cicd_logger.info("HADRON SDK didn't change. Skipping.")
                return
            }
            cicd_logger.info("HADRON SDK changed. Proceeding.")

            cicd_logger.info("Commit changes to HADRON SDK branch")
            commitChangesToSDKBranch()

            cicd_logger.info("Merge & Tag & Push HADRON SDK branch to master in HBO repo")
            boolean result = mergeTagPushSDKBranchToMaster(branchName)
            if (!result) {
                cicd_execution.failCurrentStage(null, true) // fail pipeline as well
            }
        }
    }
}

/**
 * Run Hadron QG in HBO repo
 * @param shouldExecute should execute stage?
 */
void stageRunHboQG(boolean shouldExecute) {
    String stageName = "HBO QG"

    cicd_general.measureExecution(stageName) {
        stage(stageName) {
            cicd_general.stage_init()

            if (!shouldExecute) {
                cicd_execution.postSkipStage(stageName)
                return
            }

            // tmp/QG/xaaf-js-sdk_PR_ID for PRs and tmp/QG/xaaf-js-sdk_BRANCH_NAME for regular branches
            String branchName = "tmp/QG_xaaf-js-sdk_${env.BRANCH_NAME}"

            initHBORepo()

            // Create new branch. Delete existing from `origin` if exists
            createBranch(branchName)
			
          	sleep(1)
          
            copySDKToLocalHBORepo()

            cicd_logger.info("Check if HADRON SDK changed")
            if (isRepoClean()) {
                cicd_logger.info("HADRON SDK didn't change. Skipping.")
                return
            }
            cicd_logger.info("HADRON SDK changed. Proceeding.")

            commitChangesToSDKBranch()

            pushSDKBranch()

            cicd_logger.info("Trigger 'Scan Multibranch Pipeline' for `${HBO_PIPELINE_NAME}`")
            Jenkins.instance.getItemByFullName(HBO_PIPELINE_NAME).scheduleBuild()

            String jobToBuild = "${HBO_PIPELINE_NAME}/${URLEncoder.encode(branchName, 'UTF-8')}"

            cicd_logger.info("Wait for `${HBO_PIPELINE_NAME}` to discover `${branchName}`")
            int retries = 60 // ~60 seconds
            boolean jobDiscovered = false
            while (retries > 0 && !jobDiscovered) {
                sleep(1)
                retries--
                def project = Jenkins.instance.getItemByFullName(jobToBuild)
                jobDiscovered = project?.isBuildable()
            }

            if (retries == 0) {
                cicd_execution.failCurrentStage("Waiting for `${HBO_PIPELINE_NAME}` to be discovered failed", true) // fail pipeline as well
                return
            }

            cicd_logger.info("Run ${jobToBuild} job")
            def buildResult = Constants.RESULT_FAILURE
            catchError(message: "${jobToBuild} job failed", buildResult: Constants.RESULT_FAILURE, stageResult: Constants.RESULT_FAILURE) {
                buildResult = build(
                    job: jobToBuild,
                    wait: true,
                    parameters: [],
                    propagate: false
                ).result
            }

            cicd_logger.info("Delete temporary remote branch ${branchName}")
            dir(HBO_REPO_FOLDER) {
                shWithGit("git push origin --delete ${branchName}")
            }

            if (buildResult != Constants.RESULT_SUCCESS) {
                cicd_execution.failCurrentStage(null, true) // fail pipeline as well
            }
        }
    }
}

private void shWithGit(String commandToExecute, boolean returnStatus = false) {
	sh(script: ". /opt/rh/rh-git29/enable; ${commandToExecute}", returnStatus: returnStatus)
}

private void initHBORepo() {
    cicd_logger.info("Clone HBO repo")
    shWithGit("git clone ${HBO_REPO_URL} --no-checkout --depth 1 --reference /users/m32636/gitcache/hbo.git")

    dir(HBO_REPO_FOLDER) {
        cicd_logger.info("Set as sparse checkout repo")
        shWithGit("""
            git config core.sparsecheckout true
            echo lib/js/@xaaf > .git/info/sparse-checkout
        """)

        cicd_logger.info("Checkout `master`")
        shWithGit("git checkout master")
    }
}

/*
 * Create new branch. Delete existing from `origin` if exists
 * @param branchName branch name to create
 */
private void createBranch(String branchName) {
    dir(HBO_REPO_FOLDER) {
        cicd_logger.info("Create new branch ${branchName} (delete if already exists)")
        shWithGit("""
            git push origin --delete ${branchName} || true
            git checkout -b ${branchName}
        """)
    }
}

private void copySDKToLocalHBORepo() {
    cicd_logger.info("Copy HADRON SDK to HBO repo")
    sh("""
        rm -rf ${HBO_REPO_XAAF_HADRON_SDK_PATH}
        cp -R ${JS_REPO_XAAF_HADRON_SDK_PATH} ${HBO_REPO_XAAF_HADRON_SDK_PATH}
    """)
}

private void deleteLocalHBORepo() {
    cicd_logger.info("Delete HBO repo")
    sh("rm -rf ${HBO_REPO_FOLDER}")
}

private void commitChangesToSDKBranch() {
    dir(HBO_REPO_FOLDER) {
        cicd_logger.info("Commit changes to HBO SDK branch")
        shWithGit("""
            git add -A
            git commit -m "${XAAF_HADRON_SDK}/build@${BUILD_ID}" --no-verify
        """)
    }
}

private void pushSDKBranch() {
    dir(HBO_REPO_FOLDER) {
        cicd_logger.info("Push HBO SDK branch")
        shWithGit("git push")
    }
}

private boolean mergeTagPushSDKBranchToMaster(String branchName) {
    String tagName = "@${XAAF_HADRON_SDK}/build@${BUILD_ID}"

    boolean masterTagged = false
    boolean masterPushed = false

    dir(HBO_REPO_FOLDER) {
        int tryNumber = 1;
        while (tryNumber <= 3 && !masterPushed) {
            try {
                cicd_logger.info("[try ${tryNumber}]: Merge 'master' -> '${branchName}'")
                shWithGit("""
                    git checkout ${branchName}
                    git fetch origin master:master
                    git merge master --no-edit
                """)

                cicd_logger.info("[try ${tryNumber}]: Merge '${branchName}' -> 'master'")
                shWithGit("""
                    git checkout master
                    git merge ${branchName} --no-edit --no-ff
                """)

                if (!masterTagged) {
                    cicd_logger.info("[try ${tryNumber}]: Tag 'master' with ${tagName}")
                    masterTagged = shWithGit("git tag ${tagName}", true) == 0
                }

                cicd_logger.info("[try ${tryNumber}]: Push 'master' with new xaaf-hadron-sdk")
                masterPushed = shWithGit("git push && git push --tags", true) == 0
            } catch (Exception exception) {
                cicd_logger.warn("[try ${tryNumber}]: Failed to update xaaf-hadron-sdk. error=${exception.toString()}")
            }
          	tryNumber += 1
        } // while loop
    }

    if (masterPushed) {
        cicd_logger.info("trigger ${HBO_PIPELINE_NAME} job")
        build(
            job: "${HBO_PIPELINE_NAME}/master",
            wait: false,
            parameters: []
        )
    }

    return masterPushed
}

private boolean isRepoClean() {
    int exitCode
    dir(HBO_REPO_FOLDER) {
        exitCode = shWithGit('[ -z "$(git status --porcelain)" ]', true)
    }
    return exitCode == 0
}

return this
