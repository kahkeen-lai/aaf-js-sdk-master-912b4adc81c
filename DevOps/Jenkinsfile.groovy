@Library('cicd_functions@v1.3.0') _

import groovy.transform.Field
import org.jenkinsci.plugins.pipeline.modeldefinition.Utils
import com.att.cicd.Constants
import groovy.json.JsonOutput
import groovy.json.JsonSlurperClassic

@Field final Map<String,String> stages = [:]
@Field final  String notificationsTeamsChannel  = "https://att.webhook.office.com/webhookb2/bc37a2c2-97f5-4d67-bed1-60bff3370d43@e741d71c-c6b6-47b0-803c-0f3b32b07556/IncomingWebhook/e1328e7efd5e407a91d2f6396d23d710/f875ffe4-874b-4cae-8740-50ab56a6ac31"

/*******************************************************************
 * Hardcoded Parameters
 *******************************************************************/

@Field final String EMAIL_DISTRIBUTION_LIST =       "dl-XAAF_JS_SDK_Teams@intl.att.com"
@Field final String CODE_CLOUD_URL =                "https://codecloud.web.att.com"
@Field final String CODE_CLOUD_JENKINS_CREDS =      "xaaf-code-cloud"
@Field final String CODE_CLOUD_PROJECT_KEY =        "ST_ADVERTISE"
@Field final String CODE_CLOUD_REPOSITORY_NAME =    "xaaf-js-sdk"
@Field final String NODE_NAME =                   	"Linux"
@Field final Integer PIPELINE_TIMEOUT =           	90
@Field final String PROJECT_NAME =           		"XAAF_JS"
@Field final String PROXY_HOST =                  	"emea-chain.proxy.att.com"
@Field final String PROXY_PORT =                  	"8080"
@Field final String PROXY =                       	"http://${PROXY_HOST}:${PROXY_PORT}".toString()
@Field final String ATT_PID =                       "29542"
@Field final String PIPELINE_ID =                   "XAAF-JS"

@Field final String YOUI_SDK_DIR =                  "./packages/frameworks/aaf-rn-sdk"
@Field final String WEB_SDK_DIR =                   "./packages/frameworks/xaaf-web-sdk"
@Field final String HADRON_SDK_DIR =                "./packages/frameworks/xaaf-hadron-sdk"
@Field final String CORE_SDK_DIR =                	"./packages/core/xaaf-js-sdk"

/*******************************************************************
 * Globals
 *******************************************************************/

@Field String currentStage
@Field String errorMessage
@Field String veracodeDir

/*******************************************************************
 * Pipeline Parameters
 *******************************************************************/

ArrayList buildParams = [
		booleanParam(name: 'CLEAN_WS',                  defaultValue: false, 	description: " "),
		booleanParam(name: "EMAIL_REPORT_TO_ALL",       defaultValue: cicd_general.isMasterBranch(), description: " "),
		booleanParam(name: 'REMOVE_PREPROD_PROD_ENVS',  defaultValue: false, 	description: " "),
		booleanParam(name: 'UNIT_TESTS',                defaultValue: true, 	description: " "),
		booleanParam(name: 'LINT',                		defaultValue: true, 	description: " "),
		booleanParam(name: 'INTEGRATION_TESTS',         defaultValue: true, 	description: " "),
		booleanParam(name: 'GENERATE_DOCS',             defaultValue: cicd_general.isMasterBranch(), description: " "),
		booleanParam(name: 'VERACODE_ONLY',          	defaultValue: false, 	description: " "),
		booleanParam(name: 'VERACODE_SAST',        		defaultValue: true, 	description: " "),
		booleanParam(name: 'VERACODE_SCA',        		defaultValue: true, 	description: " "),
		booleanParam(name: 'PROMOTE_VERACODE_SCAN',  	defaultValue: cicd_general.isMasterBranch(), description: "Promote veracode scan?"),
		booleanParam(name: 'SONAR',                		defaultValue: true, 	description: " "),
		booleanParam(name: 'DEPLOY_DEMO_WEB',           defaultValue: cicd_general.isMasterBranch(), description: " "),
		booleanParam(name: 'AD_STUDIO',                 defaultValue: false, 	description: " "),
		booleanParam(name: 'CHECKMARX',            		defaultValue: false, 	description: " "),
		booleanParam(name: 'PUBLISH_RELEASE',           defaultValue: false, 	description: " "),
		booleanParam(name: 'PUBLISH_DOCKER',            defaultValue: false, 	description: " "),
		booleanParam(name: 'MUTATION_TESTS',            defaultValue: false, 	description: " "),
		booleanParam(name: 'PUBLISH_HADRON_SDK',        defaultValue: false, 	description: " "),
		string(name: "INTEGRATION_TESTS_NIGHTLY_FLAG",  defaultValue: "--testFailureExitCode 1", description: " "),
		choice(name: 'PUBLISH_VERSION',                 choices: ['patch','minor','major'], description: " ")
]

if (cicd_general.isMasterBranch()) {
	buildParams += [
			string(name: "SB_MOTSID",           defaultValue: ATT_PID),
			string(name: "SB_TEAMSPACE",        defaultValue: "Advertise_XAAF_JS"),
			string(name: 'SB_PIPELINE_NAME',    defaultValue: PIPELINE_ID)
	]
}

properties([
		[$class: 'RebuildSettings', autoRebuild: false, rebuildDisabled: false],
		parameters(buildParams)
])

/*******************************************************************
 * Runtime
 *******************************************************************/

node(NODE_NAME) {
	// we don't want multiple nodes to build master in parallel. using lock to sync
	if (cicd_general.isMasterBranch()) {
		lock(CODE_CLOUD_REPOSITORY_NAME) {
			pipelineScript().call()
		}
	} else {
		pipelineScript().call()
	}
}

/*******************************************************************
 * Pipeline Closure
 *******************************************************************/

Closure pipelineScript() {{ ->
	timestamps {
		timeout(PIPELINE_TIMEOUT) {
			withEnv([
					"PROJECT_NAME=${PROJECT_NAME}".toString(),
					"PROJECT_PLATFORM=${NODE_NAME}".toString(),
					"PROJECT_MAJOR_VERSION=1.0.0",
					"MAJOR_VERSION=1.0.0",
					"REPO_URL=https://codecloud.web.att.com/scm/st_advertise/xaaf-js-sdk.git",

					// TODO: remove?
					"PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1",
					"PUPPETEER_EXECUTABLE_PATH=/opt/google/chrome/chrome",
					"CHROME_DEVEL_SANDBOX=/opt/google/chrome/chrome-sandbox",

					// Java
					"JAVA_HOME=/tools/third/java/jdk1.8.0_191",
					["PROXY_GRADLE_OPTS=-Dhttp.proxyHost=${PROXY_HOST}".toString(),
					 "-Dhttp.proxyPort=${PROXY_PORT}".toString(),
					 "-Dhttps.proxyHost=${PROXY_HOST}".toString(),
					 "-Dhttps.proxyPort=${PROXY_PORT}".toString(),
					 "-Dhttp.nonProxyHosts=135.76.2.18"
					].join(" "),

					// Sonar
					"SONAR_SCANNER=/tools/apps/sonar-scanner-4.6/bin/sonar-scanner",
					"SONAR_NAME=${PIPELINE_ID}".toString(),
					"SONAR_KEY=${PIPELINE_ID}".toString(),
					"SONAR_PROJECT_NAME=${PIPELINE_ID}".toString(),
					"APPIUM_SKIP_CHROMEDRIVER_INSTALL=true",

					// PROXY
					"https_proxy=${PROXY}".toString(),
					"http_proxy=${PROXY}".toString(),
					"HTTP_PROXY=${PROXY}".toString(),
					"HTTPS_PROXY=${PROXY}".toString(),

					// NEXUS
					"MODULE_NAME=packages",
					"NEXUS_HOST=http://mavencentral.it.att.com:8081/nexus",
					"NEXUS_REPO=att-repository-3rd-party",
					"ARTIFACT_GROUPID=com.att.advertise",
					"ARTIFACT_ARTIFATCID=JS",

					// Docker
					"DOCKER_ECR_REGISTRY=274857556979.dkr.ecr.us-east-1.amazonaws.com",
					"IMG_NAME=ooh",

					// Node
					"NPM_REGISTRY=http://repocentral.it.att.com:8443/nexus/repository/npm-advertise",
					"NPM_SCOPE=@advertise",
					"NPM_EMAIL=m32636@intl.att.com",
					"YARN_CACHE_FOLDER=/users/m32636/.cache/yarn",

					//Veracode
					"VERACODE_PROJECT=29542-XAAF-JS-YOUI",
					"VERACODE_SANDBOX=29542-XAAF-JS-YOUI",
			]) {
				try {
					currentBuild.result = "SUCCESS"
					if (params.CLEAN_WS) {
						cleanWs()
					}

					stage('GIT') {
						currentStage = cicd_general.stage_init()
						cicd_general.git()
					}

					if (params.VERACODE_SCA || params.VERACODE_SAST) {
					    veracodeDir = "${WORKSPACE}/veracode".toString()

                        String[] packages = [
                                'packages/frameworks/aaf-rn-sdk',
                                'packages/frameworks/xaaf-web-sdk',
                                'packages/core/xaaf-js-sdk',
                                'packages/core/common',
                                'packages/components/key-service',
                                'packages/components/jsrsasign',
                                'packages/components/http-axios'
                        ]

                        copyLernaProject(packages, veracodeDir)
					}

					stage('VERACODE SCA') {
						currentStage = cicd_general.stage_init()
						if (skipStageIfNeeded(!params.VERACODE_SCA, STAGE_NAME)) {
							return
						}
						echo "-- Going to SCA of 29542-XAAF-JS: YOUI and WEB --"
						veracodeAgentScan("29542-XAAF-JS-YOUI", veracodeDir)
						echo "-- Going to SCA QG of 29542-XAAF-JS: YOUI and WEB --"
						cicd_veracode.veracode_sca_qg(2,93,2,1,2)
					}

					stage('VERACODE SAST') {
						currentStage = cicd_general.stage_init()
						if (skipStageIfNeeded(!params.VERACODE_SAST, STAGE_NAME)) {
							return
						}

						cicd_logger.info("Veracode SAST with project: ${VERACODE_PROJECT}")
						cicd_veracode.veracode_basic(veracodeDir,"")
					}

					if (params.VERACODE_ONLY) {
						return
					}

					stage('Checkmarx') {
						currentStage = cicd_general.stage_init()
						if (skipStageIfNeeded(!params.CHECKMARX, STAGE_NAME)) {
							return
						}

                        step([$class: 'CxScanBuilder', comment: '', credentialsId: '7b2dd22a-7953-4569-9c3f-f7eb9c5f36e6',
							excludeFolders: '.git,dist,coverage,jsrsasign',
							filterPattern:'**/packages/frameworks/aaf-rn-sdk/**/*',
							excludeOpenSourceFolders: '',
							exclusionsSetting: 'job',
							failBuildOnNewResults: false,
							fullScanCycle: 10,
							generatePdfReport: true,
							groupId: '22222222-2222-448d-b029-989c9070eb23',
							includeOpenSourceFolders: '',
							osaArchiveIncludePatterns: '*.zip, *.war, *.ear, *.tgz',
							osaInstallBeforeScan: false,
							password: '{AQAAABAAAAAQPqIRqvexYtAz61kPjMoSFNZqN4l206FmcDFUhebYFac=}',
							preset: 'default',
							projectName: 'advertize-js-sdk',
							serverUrl: 'https://checkmarx.web.att.com',
							sourceEncoding: '5',
							useOwnServerCredentials: true,
							username: '',
							waitForResultsEnabled: true])
							archiveArtifacts allowEmptyArchive: true, artifacts: 'Checkmarx/Reports/CxSASTReport*.pdf,Checkmarx/Reports/ScanReport.xml', caseSensitive: false, defaultExcludes: false, onlyIfSuccessful: true

							def (high_col, medium_col, low_col) = ['', '', '']
                            (pdf,high,medium,low) = checkmarx()
                            sh """
                                echo " high : ${high} , medium : ${medium} , low : ${low} "
  								if [ "${high}" -gt 8 ] ||  [ "${medium}" -gt 0 ] ||  [ "${low}" -gt 0 ]
 								then
   									echo "No very high / Medium / Low issues are allowed over thr limits"
     								exit 1
   								fi
    						"""
                    }

					stage('BOOTSTRAP') {
						addYouiAPIKey()
						if (params.REMOVE_PREPROD_PROD_ENVS) {
							removePreProdAndProdEnvs()
						}
						sh nvmUse() + """
							yarn --cache-folder \${YARN_CACHE_FOLDER}
							npx lerna bootstrap --ignore ad-studio -- \
								--chromedriver-skip-install \
								--cache-folder \${YARN_CACHE_FOLDER}
							npx lerna link
						"""
					}

					stage('BUILD') {
						currentStage = cicd_general.stage_init()
						sh nvmUse() + "npx lerna run build"
					}

					stage('ANALYZE') {
						currentStage = cicd_general.stage_init()
						sh nvmUse() + "npx lerna run analyze"
						monitorBundleSize()
					}

					stage('LINT') {
						currentStage = cicd_general.stage_init()
						if (skipStageIfNeeded(!params.LINT, STAGE_NAME)) {
							return
						}

						sh nvmUse() + """
							npx lerna run lint --ignore @xaaf/ad-studio -- \
								--quiet \
								--cache \
								--cache-location .eslintcache
						"""
					}

					stage('UNIT TESTS') {
						currentStage = cicd_general.stage_init()
						if (skipStageIfNeeded(!params.UNIT_TESTS, STAGE_NAME)) {
							return
						}
						sh nvmUse() + """
							mkdir -p coverage
							npx lerna run test
							node ./coverage.js
						"""
					}

					stage('INTEGRATION TESTS') {
						currentStage = cicd_general.stage_init()
						if (skipStageIfNeeded(!params.INTEGRATION_TESTS, STAGE_NAME)) {
							return
						}

						addIntegrationTestFlag()
						sh nvmUse() + "npx lerna run test:integration"
						publishHTMLTestResults()
					}

					stage('GENERATE DOCS') {
						currentStage = cicd_general.stage_init()
						/**
						 * Generate Docs depends on UT and integration tests for the following files:
						 * - packages/components/key-service/coverage/tests.html
						 * - packages/e2e-tests/integration-testing/coverage/tests.html
						 *
						 * Don't execute `Generate Docs` if the `Tests` or 'Integration Tests' weren't executed
						 */
						boolean shouldExecute = params.GENERATE_DOCS && params.UNIT_TESTS && params.INTEGRATION_TESTS
						if (skipStageIfNeeded(!shouldExecute, STAGE_NAME)) {
							cicd_logger.info("Skipping `${STAGE_NAME}` because it depends on UNIT_TESTS flag which is FALSE")
							return
						}

						sh nvmUse() + "npx lerna run docs"
					}

					stage('SONAR') {
						cicd_general.stage_init()
						if (skipStageIfNeeded(!params.SONAR, STAGE_NAME)) {
							return
						}

						String inclusions = [
								'packages/core/**/*.ts',
								'packages/frameworks/**/*.ts'
						].join(',')

						String exclusions = [
								'**/node_modules/**/*',
								'packages/demos/**/*',
								'packages/e2e-tests/**/*',
								// "${WEB_SDK_DIR}/dist/**",
								'packages/mock-server/**/*',
								"${YOUI_SDK_DIR}/youi/**",
								"${YOUI_SDK_DIR}/lib/**/*",
								"${CORE_SDK_DIR}/lib/**/*",
								'coverage/*',
								'packages/**/*.spec.ts',
								'packages/**/*.d.ts',
								'packages/**/mock/*.ts'
						].join(',')

						String cov_exclusions=[
								'**/node_modules/**/*',
								'packages/demos/**',
								'packages/e2e-tests/**',
								// "${WEB_SDK_DIR}/dist/**",
								"${YOUI_SDK_DIR}/youi/**",
								"${YOUI_SDK_DIR}/lib/**/*",
								"${CORE_SDK_DIR}/lib/**/*",
								'coverage/*',
								'packages/**/*.spec.ts',
								'packages/**/*.d.ts',
								'packages/**/mock/*.ts',
								'mock'
						].join(',')

						cicd_sonar.sonar_ts(
								SONAR_PROJECT_NAME,
								inclusions,
								exclusions,
								cov_exclusions,
								"packages",
								ATT_PID)
					}

					stage('PUBLISH') {
						currentStage = cicd_general.stage_init()
						if (skipStageIfNeeded(!params.PUBLISH_RELEASE, STAGE_NAME)) {
							return
						}

						publishPackages()
					}

					stage('DEPLOY AD STUDIO') {
						currentStage = cicd_general.stage_init()
						if (skipStageIfNeeded(!params.AD_STUDIO, STAGE_NAME)) {
							return
						}

						sh nvmUse() + """
						    npx lerna bootstrap
						    npx lerna run build:ad-studio
							scp -r packages/xaaf-script/ad-studio/dist/* m32636@135.76.210.90:/usr/share/nginx/html/ad-studio
						"""
					}

					stage('DEPLOY WEB') {
						currentStage = cicd_general.stage_init()
						if (skipStageIfNeeded(!params.DEPLOY_DEMO_WEB, STAGE_NAME)) {
							return
						}

						uploadToServer()
					}

					stage('BUILD DOCKER') {
						currentStage = cicd_general.stage_init()
						if (skipStageIfNeeded(!params.PUBLISH_DOCKER, STAGE_NAME)) {
							return
						}

						buildDemoWeb()
						dockerBuildAndPush()
					}

					stage('MUTATION TESTS') {
						currentStage = cicd_general.stage_init()
						if (skipStageIfNeeded(!params.MUTATION_TESTS, STAGE_NAME)) {
							return
						}

						build(
								job: "xaaf-js-mutation",
								wait: true,
								propagate: false
						)

						String mutationResults = getMutationTestResults()
						if (mutationResults != 'SUCCESS') {
							currentBuild.result = mutationResults
							cicd_logger.error("MUTATION tests failed")
						}

						retrieveMutationTestResults()
						publishHTMLMutationTestResults()
					}

					stage('GIT TAG') {
						currentStage = cicd_general.stage_init()
						if (currentBuild.result != "SUCCESS" || !cicd_general.isMasterBranch()) {
							return
						}

						cicd_git.gitDeleteLocalTags()
						sh "git tag @xaaf/build@${BUILD_ID} && git push --tags"
					}

					stage('PRUNE REFERENCE REPO') {
						if (!cicd_general.isMasterBranch()) {
							return
						}
						sh """
							cd ~/git/xaaf-js-sdk.git
							git fetch --all --prune
						"""
					}
				} catch (Exception ex) {
					echo "******************************************************************************************"
					echo "******************************************************************************************"
					cicd_logger.error(ex.toString())
					echo "******************************************************************************************"
					echo "******************************************************************************************"
					echo ""
					echo ""
					echo ""
					currentBuild.result = 'FAILURE'
					errorMessage = ex.getMessage()
					String errorDescription = "Failed stage: ${currentStage}. Error: ${errorMessage}".toString()
					cicd_logger.error(errorDescription)
					currentBuild.description = errorDescription

				} finally {
					sendWebexNotification(currentBuild.description, currentBuild.result)
					sendEmailNotification()

					// Send Teams channel notification
                    // Flags data
                    Map<String,String> mapBuildParams = [
                        'UNIT_TESTS'                : params.UNIT_TESTS,
                        'Sonar'                     : params.SONAR,
                        'VERACODE_SCA'              : params.VERACODE_SCA
                        // "CheckMarks"             : flagRunCheckmarksScan,
                        // "Performance"            : flagRunPerformanceTests,
                    ]
                    sendTeamsNotification(notificationsTeamsChannel, stages, errorMessage,
                        mapBuildParams              : mapBuildParams,
                        //prmBuildNumber              : prmBuildNumber,
                        prmBranchName               : BRANCH_NAME,
                        flagRunSonarScan            : params.SONAR
                    )
					cleanWs(patterns: [
							[pattern: 'packages/e2e-tests/integration-testing/coverage', 	type: 'INCLUDE'],
							[pattern: "${HADRON_SDK_DIR}/coverage", 						type: 'INCLUDE'],
							// [pattern: "${WEB_SDK_DIR}/coverage", 							type: 'INCLUDE'],
							[pattern: "${YOUI_SDK_DIR}/coverage", 							type: 'INCLUDE'],
							// [pattern: 'node_modules/@youi/react-native-youi', 				type: 'INCLUDE'],
							[pattern: './coverage', 										type: 'INCLUDE'],
							[pattern: './veracode', 										type: 'INCLUDE']
					])
				}
			}
		}
	}
}}

	private void sendEmailNotification() {
	String recipients = getEmailRecipients()
	cicd_logger.info("EMAIL RECIPIENTS: ${recipients}")

	String proj_version_js_sdk = 	sh(script: "jq .version ${CORE_SDK_DIR}/package.json -r", 		returnStdout: true).trim()
	String proj_version_youi_sdk = 	sh(script: "jq .version ${YOUI_SDK_DIR}/package.json -r", 		returnStdout: true).trim()
	// String proj_version_web_sdk = 	sh(script: "jq .version ${WEB_SDK_DIR}/package.json -r", 		returnStdout: true).trim()

	LinkedHashMap<String,String> versions = [
			"Project Version sdk": 				"v${proj_version_js_sdk}",
			"Project Version aaf-rn-sdk": 	"v${proj_version_youi_sdk}",
			// "Project Version xaaf-web-sdk": 	"v${proj_version_web_sdk}",
	]

	LinkedHashMap<String,String> links = [
			"Sonar": 			"https://sonar.it.att.com/dashboard?id=${PIPELINE_ID}&branch=${cicd_general.getBranchName()}",
			"Veracode": 		"https://www.att.com/DSOVeracode",
			"Veracode SCA":		"https://sca.analysiscenter.veracode.com/workspaces/oNNU3ry/projects/260007/issues",
			"ScrumBoard": 		"https://sb.web.att.com/mots/${ATT_PID}/teamspace/Advertise_XAAF_JS?isEco=false",
			"Mutation Tests": 	"https://sdt-advertising.vci.att.com:${ATT_PID}/jenkins/view/XAAF_JS/job/xaaf-js-mutation/Mutaion_20Report/",
			"Maven repository": "https://repocentral.it.att.com:8443/nexus/#browse/browse:npm-advertise",
			"Web demo": 		"https://iltlvd-xaafadv-210-90.intl.att.com",
			"Docs": 			"https://iltlvd-xaafadv-210-90.intl.att.com:4002"
	]

	cicd_email_generic.notification(recipients, errorMessage, versions, links, currentStage)
}

private static String nvmUse() {
	return """
		set +x
		. ~/.nvm/nvm.sh
		nvm use v14.17.0
		set -x
	  """
}

private void publishHTMLMutationTestResults() {
	publishHTML(target: [
			allowMissing: false,
			alwaysLinkToLastBuild: false,
			keepAll: true,
			reportDir: 'coverage/reports/xaaf-js-sdk/',
			reportFiles: 'index.html',
			reportName: "Mutation Report"
	])
}

private void retrieveMutationTestResults() {
	withCredentials([usernamePassword(
			credentialsId: '8aca879d-37f6-4c62-b036-2c130b03e047',
			passwordVariable: 'PASSWORD',
			usernameVariable: 'USERNAME')]) {

		String baseUrl = 'https://sdt-advertising.vci.att.com:29542/jenkins/view/XAAF_JS/job/xaaf-js-mutation'

		sh """
			curl -X GET --user "\${USERNAME}:\${PASSWORD}" ${baseUrl}/lastSuccessfulBuild/artifact/html.zip -k > html.zip
			sleep 2
			curl -X GET --user "\${USERNAME}:\${PASSWORD}" ${baseUrl}/lastBuild/consoleText -k > mutation_consol.txt
			unzip html.zip
		"""
	}
}

private String getMutationTestResults() {
	String mutationResults = 'UNSTABLE'

	withCredentials([usernamePassword(
			credentialsId: '8aca879d-37f6-4c62-b036-2c130b03e047',
			passwordVariable: 'PASSWORD',
			usernameVariable: 'USERNAME')]) {
		mutationResults = sh(script: '''
			curl -X GET --user "${USERNAME}:${PASSWORD}" https://sdt-advertising.vci.att.com:29542/jenkins/view/XAAF_JS/job/xaaf-js-mutation/lastBuild/api/json -k > mutation.txt
			sleep 5
			echo `cat mutation.txt |jq . |grep result |awk -F ":" '{print $2}' | sed 's/\"//g'| tr -d ,`
			''', returnStdout: true
		).trim()
	}

	return mutationResults
}

private String getEmailRecipients() {
	String distributionList = ''
	String prAuthorEmail = ''

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
			distributionList: 	distributionList,
			prAuthorEmail: 		prAuthorEmail
	)
}

private String getPrAuthorEmail() {
	return cicd_codecloud.getPullRequestAuthorEmail(
			CODE_CLOUD_URL,
			CODE_CLOUD_JENKINS_CREDS,
			CODE_CLOUD_PROJECT_KEY,
			CODE_CLOUD_REPOSITORY_NAME,
			env.CHANGE_ID)
}

private void sendWebexNotification(String _currentStage, String _result) {
	if (cicd_general.isMasterBranch()) {
		// 'withCredentials' cannot be refactored into one function, as 'credentialsId' cannot be set with a variable
		withCredentials([usernamePassword(credentialsId: 'xaaf-webex-notification', passwordVariable: 'BEARER', usernameVariable: 'ROOM_ID')]) {
			notifyWebex(
					"${ROOM_ID}",
					"${BEARER}",
					"${WORKSPACE}",
					_currentStage,
					_result,
					"${BRANCH_NAME}",
					false
			)
		}
	} else if (cicd_general.isPullRequest()) {
		withCredentials([usernamePassword(credentialsId: 'xaaf-webex-notification-general', passwordVariable: 'BEARER', usernameVariable: 'ROOM_ID')]) {
			notifyWebex(
					"${ROOM_ID}",
					"${BEARER}",
					"${WORKSPACE}",
					_currentStage,
					_result,
					"${BRANCH_NAME}",
					true,
					getPrAuthorEmail()
			)
		}
	}
}

private void notifyWebex(
		GString roomId,
		GString bearer,
		GString workingDir,
		String stages,
		String errorMessage,
		GString branchName = null,
		Boolean isPrivateBuild = false,
		String email = '') {
	try {
		dir(workingDir) {

			GString markdown = webexNotificationMarkdown(stages, errorMessage, branchName)
			webexPayload = isPrivateBuild ?
					cicd_notifications.createWebexPayloadForPersonalEmail(bearer, email, markdown) :
					cicd_notifications.createWebexPayloadWithRoomId(roomId, markdown)

			cicd_notifications.sendMessageWebex(bearer, webexPayload)
		}

	} catch(Exception ex) {
		echo "Failed to build webex notification, Error: ${ex.toString()}"
	}
}

private GString webexNotificationMarkdown(String stages, String errorMessage, GString branchName) {
	GString markdown = cicd_notifications.markdownMessageTitle(errorMessage)
	markdown += cicd_notifications.markdownBranchName(branchName)
	markdown += cicd_notifications.markdownBuildServer()
	markdown += cicd_notifications.markdownDuration()
	markdown += cicd_notifications.markdownFailedStages(stages, errorMessage)
	markdown += cicd_notifications.markdownCommitDetails()

	return markdown
}

private boolean skipStageIfNeeded(boolean shouldSkipCondition, String stageName) {
	if (shouldSkipCondition) {
		cicd_logger.info("Skipping '${stageName}' stage")
		Utils.markStageSkippedForConditional(stageName)
	}
	return shouldSkipCondition
}

def checkmarx() {

   withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: 'RUNNING_JOBS_FROM_REMOTE', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD']]) {

    branch = BRANCH_NAME.replace("/", "%252F")



   pdf = sh (returnStdout: true, script: """cat console_output.txt | grep "CxSASTReport" | head -1 | cut -d '/' -f9""").trim()
   high = sh (returnStdout: true, script: """cat console_output.txt | grep "High severity results:" | head -1 | cut -d" " -f6""").trim()
   medium = sh (returnStdout: true, script: """cat console_output.txt | grep "Medium severity results:" | head -1 | cut -d" " -f6""").trim()
   low = sh (returnStdout: true, script: """cat console_output.txt | grep "Low severity results:" |  head -1 | cut -d" " -f6""").trim()
   return [pdf, high, medium, low]

    }
}

private void publishHTMLTestResults() {
	[
			['general lal-tests-report', 	'general-lal-tests.html'],
			['general dev-tests-report', 	'general-dev-tests.html'],
			['dev-tests-report', 			'dev-tests.html'],
			['lal-tests-report', 			'lal-tests.html'],
			['integration-tests-report', 	'tests.html'],
	].each {
		publishHTML(target: [
				allowMissing: false,
				alwaysLinkToLastBuild: false,
				keepAll: true,
				reportDir: 'packages/e2e-tests/integration-testing/coverage',
				reportFiles: it[1],
				reportName: it[0]])
	}
}

void addYouiAPIKey() {
	sh nvmUse() + """
		jq '.config.YDotIApiKey = "AKCp5budJjGF2LusjcU9cfja7ZZF74dwbzSFWYhfBNksZZcht8GywNLZBtzi4xwCSuHv3tSCA"' build-config.json > build-config_1.json
		mv build-config_1.json build-config.json
		node run-command.js
	"""
}

void publishPackages() {
	withCredentials([usernamePassword(
			credentialsId: 'm32636-itservices',
			passwordVariable: 'NPM_PASS',
			usernameVariable: 'NPM_USER'
	)]) {
		sh nvmUse() + """
			. /opt/rh/rh-git29/enable
			git checkout -f
			git clean -f -d
			npx lerna publish ${PUBLISH_VERSION} --no-verify-access --yes
		"""
	}
}

void addIntegrationTestFlag() {
	sh """ sed -i"" "s/STRING_TO_REPLACE/${params.INTEGRATION_TESTS_NIGHTLY_FLAG}/g" packages/e2e-tests/integration-testing/package.json """
}

void monitorBundleSize() {
	if (cicd_general.isPullRequest()) {
		String diffSize = getBundleSize()
		if (diffSize) {
			postBundleSize(diffSize)
		}
	} else if (cicd_general.isMasterBranch()) {
		updateBundleSize()
	}
}

String getBundleSize() {
	return sh(returnStdout: true, script: "node ./DevOps/bundlesize-monitor r /users/m32636/bundle_size.json").trim()
}

void postBundleSize(String diffSize) {
	// post updated bundle sizes into CodeCloud PR comments
	withCredentials([usernamePassword(
			credentialsId: 'm32636-itservices',
			passwordVariable: 'NPM_PASS',
			usernameVariable: 'NPM_USER')]) {
		sh """
			curl -q -s -u "\${NPM_USER}:\${NPM_PASS}" \
				-X POST -H "Content-Type: application/json" \
				-d '{ "text": "${diffSize}" }' \
				${CODE_CLOUD_URL}/rest/api/1.0/projects/${CODE_CLOUD_PROJECT_KEY}/repos/${CODE_CLOUD_REPOSITORY_NAME}/pull-requests/${env.CHANGE_ID}/comments
		"""
	}
}

void updateBundleSize() {
	sh nvmUse() + "node ./DevOps/bundlesize-monitor w /users/m32636/bundle_size.json"
}

void removePreProdAndProdEnvs() {
	cicd_logger.info("Remove `xandr-preprod-*` and `xandr-prod-* keys from demo-web Sample App")
	String sedDeleteRegex = '/^.*\\[\'xandr-.*prod-.*\',.*\\],\\s*$/d'
	sh("sed -i \"${sedDeleteRegex}\" packages/demos/demo-web/src/config/api-key-config.ts || true")
}

void buildDemoWeb() {
	sh nvmUse() + """
		cd packages/demos/demo-web
		yarn build
		cd ../../..
	"""
}

void dockerBuildAndPush() {
	sh """
		docker build . -t ${DOCKER_ECR_REGISTRY}/xaaf/${IMG_NAME}
		aws ecr get-login --registry-ids 274857556979 --no-include-email
		docker push ${DOCKER_ECR_REGISTRY}/xaaf/${IMG_NAME}
	"""
}

void uploadToServer() {
	sh """
		scp -r packages/demos/demo-web/build/*  m32636@135.76.210.90:/usr/share/nginx/html/demo-web
		scp -r docs/*                           m32636@135.76.210.90:/usr/share/nginx/html/docs
	"""
}

String copyTypeScriptProject(String projectName, String projectDir) {
	cicd_logger.info("copyTypeScriptProject: ${projectName}, ${projectDir}")
	String projectAssetsDir = "${WORKSPACE}/veracode/${projectName}".toString()
	cicd_logger.info("projectAssetsDir: ${projectAssetsDir}")

	sh """
    mkdir -p ${projectAssetsDir}

	cd ${projectDir}

	# find and copy ts+tsx files, respecting the folder structure
    find . -name \\*.ts  -exec cp --parents '{}' '${projectAssetsDir}' ';'
    find . -name \\*.tsx -exec cp --parents '{}' '${projectAssetsDir}' ';'

	# copy third-party manifests
    cp ./package.json ./yarn.lock ${projectAssetsDir}

	# delete unnecessary assets
	cd ${projectAssetsDir}
    rm -rf ./node_modules
    rm -rf ./mock
    rm -rf ./dist
    find . -name \\*.spec.ts 		-exec rm -f {} \\;
    find . -name \\*.e2e-spec.ts 	-exec rm -f {} \\;
    find . -name \\*.d.ts 			-exec rm -f {} \\;
  	"""

	return projectAssetsDir
}

String zipProject(String projectAssetsDir) {
	cicd_logger.info("zipProject: ${projectAssetsDir}")
	String zipFile = "for_veracode.zip"
	sh """
	cd ${projectAssetsDir}
	rm -f ${zipFile}
	zip -r ${zipFile} .
	ls -hal ${zipFile}
	"""
	return "${projectAssetsDir}/${zipFile}".toString()
}

void veracodeAgentScan(String applicationName, String veracodeDir) {
	withCredentials([string(
			credentialsId: "SRCCLR_API_TOKEN",
			variable: "SRCCLR_API_TOKEN")]) {
		sh nvmUse() + """
			export _JAVA_OPTIONS="-Xms8g -Xmx20g"
            export SCAN_DIR=${veracodeDir}
            export CACHE_DIR=${WORKSPACE}/veracode_cache
            export VERBOSE=1
            curl -sSL https://download.sourceclear.com/ci.sh | bash \
            	-s scan									\
                --allow-dirty							\
                --skip-vms								\
                --recursive								\
                --scm-uri https://${applicationName} 	\
                --scm-rev ${BUILD_ID} 					\
                --scm-ref ${BRANCH_NAME} 				\
                --scm-ref-type branch 					\
                --scan-analyzers=npm					\
                --scan-collectors=yarn
		"""
	}
}

void copyLernaProject(String[] packages, String rootAssetsDir) {
	cicd_logger.info("copyLernaProject: ${packages}, ${rootAssetsDir}")

	sh """
	rm -rf ${rootAssetsDir}
	mkdir -p ${rootAssetsDir}
	cp ./srcclr.yml ./package.json ./yarn.lock ${rootAssetsDir}
	"""

	packages.each {
		String assetDir = "${rootAssetsDir}/${it}".toString()
		cicd_logger.debug("copying ${it} typescript files into ${assetDir}")
		sh """
			set +x
			mkdir -p ${assetDir}
			cd ${it}

			# find and copy ts+tsx files, respecting the folder structure
			find . -name \\*.ts  -exec cp --parents '{}' '${assetDir}' ';'
			find . -name \\*.tsx -exec cp --parents '{}' '${assetDir}' ';'
			cp ./package.json ./yarn.lock ${assetDir}

			# delete unnecessary assets
			cd ${assetDir}
			rm -rf ./node_modules
			rm -rf ./mock
			rm -rf ./src/mock
			rm -rf ./dist
			find . -name \\*.spec.ts 		-exec rm -f {} \\;
			find . -name \\*.e2e-spec.ts 	-exec rm -f {} \\;
			find . -name \\*.d.ts 			-exec rm -f {} \\;
			set -x
			"""
	}
}
void sendTeamsNotification(Map namedParams = null, String webHookUrl, Map<String,String> stages, String errorMessage) {
        println "enter sendTeamsNotification"
        Map<String,String>  mapBuildParams              = namedParams?.mapBuildParams
        Boolean             flagRunSonarScan            = namedParams?.flagRunSonarScan
        //String              prmBuildNumber              = namedParams?.prmBuildNumber
        String              prmBranchName               = namedParams?.prmBranchName
        String              workingDir                  = namedParams?.workingDir             ?: '.'
// Build Info section

Map<String,String> mapBuildInfo = [:]
        println "mapBuildInfo"
        String keyColor = 'Default'
        def failedStage = stages.find { it.value == Constants.RESULT_FAILURE } ?: stages.find { it.value == Constants.RESULT_RUNNING }
        mapBuildInfo["Build Server"] = NODE_NAME.toString()
        mapBuildInfo["Duration"] = currentBuild.durationString.minus(' and counting').toString()
     println  "mapBuildInfo = " + mapBuildInfo
    // Add data when build failed
if ( currentBuild.result == Constants.RESULT_FAILURE && errorMessage != null ) {
        keyColor = 'Attention'
        mapBuildInfo["Failed Stage"] = failedStage?.key.toString()
        mapBuildInfo["Error Message"] = errorMessage.toString()
    }
println "end of mapBuildInfo"
    // Create the final main body array
    def bodyArray = [
        cicd_notifications.createTeamsGenerallTitle(errorMessage),
        cicd_notifications.createTeamsCollapseContainerTitle("\ud83c\udfd7\ufe0f Build Info", "build-info", true),
        cicd_notifications.createTeamsCollapseContainer("build-info", mapBuildInfo, true, keyColor),
        cicd_notifications.createTeamsCollapseContainerTitle("\ud83c\udfc1 Flags", "flags-data", false),
        cicd_notifications.createTeamsCollapseContainer("flags-data", mapBuildParams, false, 'default')
    ]
    // Create workflow body array
    def bodyWorkflowArray = [
        cicd_notifications.createTeamsCollapseContainerTitle("\u267b\ufe0f Pipeline Stages Workflow", "workflow", false),
        cicd_notifications.createTeamsCollapseWorkflowContainer("workflow", stages, false)
    ]

    // Send the message
    lock("Teams-Jenkins-Pipeline-Builds") {
        println"Teams-Jenkins-Pipeline-Builds"
        cicd_notifications.sendTeamsChannelMessage(webHookUrl, bodyArray)
        // if (flagRunSonarScan && flagSonarResults) { // if SonarQube run and there are results
        //     cicd_notifications.sendTeamsChannelMessage(webHookUrl, sonarArray)
        // } Will be enable in the next PR (Eran)
        cicd_notifications.sendTeamsChannelMessage(webHookUrl, bodyWorkflowArray)
    }
    } //sendTeamsNotification
