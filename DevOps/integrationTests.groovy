
@Library('cicd_functions') _

import groovy.transform.Field

@Field final String EMAIL_DISTRIBUTION_LIST = "dl-XAAF_JS_SDK_Teams@intl.att.com"
@Field final String CODE_CLOUD_URL = "https://codecloud.web.att.com"
@Field final String CODE_CLOUD_JENKINS_CREDS = "xaaf-code-cloud"
@Field final String CODE_CLOUD_PROJECT_KEY = "ST_ADVERTISE"
@Field final String CODE_CLOUD_REPOSITORY_NAME = "xaaf-js-sdk"

@Field final String NVM_VERSION = "v12.13.1"

List buildParams = [
	/* add build parameters as following:
	 * [ buildParam1, condition1 ]
	 * [ buildParam2, condition2 ]
	 *
	 * buildParam: the build param (booleanParam, string, choice, etc)
	 * condition: if the condition is true, build_param will be added to the build. otherwise, it won't.
	 * skip integration tests
	 */
	//[ booleanParam(name: "EMAIL_REPORT_TO_ALL", defaultValue: cicd_general.isMasterBranch(), description: "Send email report to distribution list?"), true /* add always */ ],
    [ string(name: "BRANCH_NAME", defaultValue: "master", description: ""),true /* add always*/ ],
	[ booleanParam(name: 'INTEGRATION_FLAG',defaultValue: true, description: 'Run integration tests stage?'), true /* add always */],
    [ string(name: "CUSTOM_API_KEY", defaultValue: "", description: "Run integration tests against environment with API key"),true /* add always*/ ],
    [ string(name: "EMUSE_PROJECT_ID", defaultValue: "00000", description: ""),true /* add always*/ ],
    [ choice(name: 'E2E_ENVIRONMENT', choices: ['dev','stage','test','lal','aio'], description: "E2E environment"), true /* add always*/ ],
    [ string(name: "INTEGRATION_FLAG_NIGHTLY", defaultValue: "--testFailureExitCode 0", description: ""),true /* add always*/ ],
    [ choice(name: 'BRANCH_TAG', choices: ['MASTER','2.0.5'], description: "BRANCH TAG FOR INTEGRATION"), true /* add always*/ ],
].findAll {
	(buildParam, shouldAddBuildParam) = it
    return shouldAddBuildParam
}.collect {
	(buildParam, shouldAddBuildParam) = it
    return buildParam
}

properties([
	[$class: 'RebuildSettings', autoRebuild: false, rebuildDisabled: false],
    parameters(buildParams)
])

// Other variables

@Field String currentStage
@Field String errorMessage

blackduck_qg = false

ut_flag = params.UT_FLAG
integration_flag = params.INTEGRATION_FLAG
sast_flag = params.SAST_FLAG
sonar_flag = params.SONAR_FLAG
checkmarx_flag = params.CHECKMARX_FLAG
webserver_flag = params.WEBSERVER_FLAG
blackduck_flag = false //params.BLACKDUCK_FLAG
publish_release = params.PUBLISH_RELEASE
publish_docker = params.PUBLISH_DOCKER
mutation_flag = params.MUTATION_FLAG
publish_hadron_sdk = params.PUBLISH_HADRON_SDK
branch_tag = params.BRANCH_TAG
custom_api_key = params.CUSTOM_API_KEY
integration_flag_nightly = params.INTEGRATION_FLAG_NIGHTLY

node("Linux") {
    pipelineScript().call()
}

Closure pipelineScript() {{ ->
	timestamps {
		timeout(650) {
			withEnv([
				"PROJECT_NAME=XAAF-JS",
				"PROJECT_PLATFORM=Linux",
				"PROJECT_MAJOR_VERSION=1.0.0",
				"MAJOR_VERSION=1.0.0",
				"PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1",
				"PUPPETEER_EXECUTABLE_PATH=/opt/google/chrome/chrome",
				"CHROME_DEVEL_SANDBOX=/opt/google/chrome/chrome-sandbox",
				"JAVA_HOME=/tools/third/java/jdk1.8.0_191",
				"REPO_URL=https://codecloud.web.att.com/scm/st_advertise/xaaf-js-sdk.git",
				"SONAR_SCANNER=/tools/apps/sonar-scanner-2.7/bin/sonar-scanner",
				"SONAR_NAME=XAAF-JS",
				"SONAR_KEY=XAAF-JS",
				"SONAR_PROJECT_NAME=XAAF-JS",
				"APPIUM_SKIP_CHROMEDRIVER_INSTALL=true",
				"https_proxy=http://emea-chain.proxy.att.com:8080",
				"http_proxy=http://emea-chain.proxy.att.com:8080",
				"HTTP_PROXY=http://emea-chain.proxy.att.com:8080",
				"HTTPS_PROXY=http://emea-chain.proxy.att.com:8080",
				"MODULE_NAME=packages",
				"PROXY_GRADLE_OPTS=-Dhttp.proxyHost=emea-chain.proxy.att.com -Dhttp.proxyPort=8080 -Dhttps.proxyHost=emea-chain.proxy.att.com -Dhttps.proxyPort=8080 -Dhttp.nonProxyHosts=135.76.2.18",
				"NEXUS_HOST=http://mavencentral.it.att.com:8081/nexus",
				"NEXUS_REPO=att-repository-3rd-party",
				"ARTIFACT_GROUPID=com.att.advertise",
				"ARTIFACT_ARTIFATCID=JS",
				"VERACODE_PROJECT=29542-XAAF-JS",
				"DOCKER_ECR_REGISTRY=274857556979.dkr.ecr.us-east-1.amazonaws.com",
				"IMG_NAME=ooh",
				"VERACODE_SANDBOX=29542-XAAF-JS",
                "NPM_REGISTRY=http://repocentral.it.att.com:8443/nexus/repository/npm-advertise",
                "NPM_SCOPE=@advertise",
                "EMUSE_PROJECT_ID=${EMUSE_PROJECT_ID}",
                "E2E_ENVIRONMENT=${E2E_ENVIRONMENT}",
                "INTEGRATION_FLAG_NIGHTLY=${INTEGRATION_FLAG_NIGHTLY}",
                "NPM_EMAIL=m32636@intl.att.com",
                "CUSTOM_API_KEY=${CUSTOM_API_KEY}"
			]) {
				try {
					cleanWs()

					stage("GIT + Pre-requisite") {
						currentStage=cicd_general.stage_init()
                        if (branch_tag == "MASTER"){
							cicd_general.git()
                        }
                      	else{
                            checkout([$class: 'GitSCM',
                                branches: [[name: "refs/tags/@xaaf/aaf-rn-sdk@2.0.5"]],
                                userRemoteConfigs: [[url: "${REPO_URL}"]]
                            ])
                        }
					}

					stage("Build") {
						currentStage = cicd_general.stage_init()

						shWithNVM("""
							jq '.config.YDotIApiKey = "AKCp5budJjGF2LusjcU9cfja7ZZF74dwbzSFWYhfBNksZZcht8GywNLZBtzi4xwCSuHv3tSCA"' build-config.json > build-config_1.json
							mv build-config_1.json build-config.json
							node run-command.js
							yarn ci:build
						""")
					}

                  	stage("Integration Test") {
						current_stage = cicd_general.stage_init()
						if (skipStageIfNeeded(!integration_flag, STAGE_NAME)) { return }
                        sh """ sed -i"" "s/STRING_TO_REPLACE/${INTEGRATION_FLAG_NIGHTLY}/g" packages/e2e-tests/integration-testing/package.json """

                        if (custom_api_key != "") {
                            cicd_logger.info("API KEY was supplied - ${custom_api_key}")
                            shWithNVM("yarn test:integration:custom_api_key")
                        } else {
                            cicd_logger.info("API KEY was not supplied")
                            shWithNVM("yarn test:integration")
                        }

                        archiveArtifacts allowEmptyArchive: true, artifacts: 'packages/e2e-tests/integration-testing/coverage/measurement.log', caseSensitive: false, defaultExcludes: false, onlyIfSuccessful: true

						publishHTML (target: [
									allowMissing: false,
									alwaysLinkToLastBuild: false,
									keepAll: true,
									reportDir: 'packages/e2e-tests/integration-testing/coverage',
									reportFiles: 'tests.html',
									reportName: "integration-tests-report"
								])
						publishHTML (target: [
									allowMissing: false,
									alwaysLinkToLastBuild: false,
									keepAll: true,
									reportDir: 'packages/e2e-tests/integration-testing/coverage',
									reportFiles: 'lal-tests.html',
									reportName: "lal-tests-report"
								])
						publishHTML (target: [
									allowMissing: false,
									alwaysLinkToLastBuild: false,
									keepAll: true,
									reportDir: 'packages/e2e-tests/integration-testing/coverage',
									reportFiles: 'dev-tests.html',
									reportName: "dev-tests-report"
								])
					}

				} catch (Exception ex) {
					errorMessage = ex.getMessage()
					currentBuild.result = 'FAILURE'
					errorMessage = ex.getMessage()
					cicd_logger.error("errorMessage=${errorMessage}, currentStage=${currentStage}")
					currentBuild.description = "Failed stage: ${currentStage}. Error: ${errorMessage}"
				}
				finally {
					String recipients = getEmailRecipients()
					cicd_logger.info("EMAIL RECIPIENTS: ${recipients}")
                    def correct_branch = cicd_general.getBranchName()
					def proj_version_sdk = sh(script: """jq .version packages/core/xaaf-js-sdk/package.json -r""", returnStdout: true).trim()
   					def proj_version_xaaf_youi_sdk = sh(script: """jq .version packages/frameworks/aaf-rn-sdk/package.json -r""", returnStdout: true).trim()
   					def proj_version_xaaf_web_sdk = sh(script: """jq .version packages/frameworks/xaaf-web-sdk/package.json -r""", returnStdout: true).trim()

					Map<String,String> version = [:]

					Map<String,String> links = [:]

                    //cicd_email_generic.notification(recipients, errorMessage, version, links, currentStage)
				} // finally
			} //withEnv
		} //timeout
	} //timestamps
}} //pipelineScript


private void shWithNVM(String commandsToExecute) {
	sh(""". ~/.nvm/nvm.sh && nvm use ${NVM_VERSION} && ${commandsToExecute}""")
}

private String getEmailRecipients() {
	String distributionList
	String prAuthorEmail

	if (params.EMAIL_REPORT_TO_ALL) {
		distributionList = EMAIL_DISTRIBUTION_LIST
	}

	if (cicd_general.isPullRequest()) {
		prAuthorEmail = cicd_codecloud.getPullRequestAuthorEmail(
			CODE_CLOUD_URL,
			CODE_CLOUD_JENKINS_CREDS,
			CODE_CLOUD_PROJECT_KEY,
			CODE_CLOUD_REPOSITORY_NAME,
			env.CHANGE_ID
		)
	}

	return cicd_email.getEmailRecipients(
		distributionList: distributionList,
		prAuthorEmail: prAuthorEmail
	)
}

private boolean skipStageIfNeeded(boolean shouldSkipCondition, String stageName) {
	if (shouldSkipCondition) {
		cicd_logger.info("Skipping '${stageName}' stage")
		cicd_execution.postSkipStage(stageName)
		currentBuild.result = "SUCCESS"
	}
	return shouldSkipCondition
}
