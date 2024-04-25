@Library('cicd_functions') _


properties([[$class: 'RebuildSettings', autoRebuild: false, rebuildDisabled: false],
    parameters([

[$class: 'hudson.model.StringParameterDefinition', name: 'DL_LIST', defaultValue: "es320v@intl.att.com"],
        [$class: 'hudson.model.StringParameterDefinition', name: 'BRANCH_NAME', defaultValue: "master"],
        [$class: 'hudson.model.StringParameterDefinition', name: 'environment', defaultValue: "tlv-test-firetv"],
        [$class: 'hudson.model.StringParameterDefinition', name: 'MOTSID', defaultValue: "29542"],
        [$class: 'hudson.model.StringParameterDefinition', name: 'ECO_TEAMSPACE_ACRONYM', defaultValue: "Advertise_XAAF_JS"],
        [$class: 'hudson.model.StringParameterDefinition', name: 'ECO_PIPELINE_NAME', defaultValue: "XAAF-JS-WEB-E2E"],
        [$class: 'hudson.model.StringParameterDefinition', name: 'SB_MOTSID', defaultValue: "29542"],
        [$class: 'hudson.model.StringParameterDefinition', name: 'SB_TEAMSPACE', defaultValue: "Advertise_XAAF_JS"],
        [$class: 'hudson.model.StringParameterDefinition', name: 'SB_PIPELINE_NAME', defaultValue: "XAAF-JS-WEB-E2E"]
    ])
])

def current_stage
def errorMessage
covResult = 0

node("Js-Ios") {
    
    timestamps {
		timeout(1000) {
		    withEnv([
              	"PROJECT_NAME=XAAF-Web-E2E",
				"PROJECT_PLATFORM=Linux",
				"PROJECT_MAJOR_VERSION=1.0.0",
				"MAJOR_VERSION=1.0.0",
				"PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1",
				"PUPPETEER_EXECUTABLE_PATH=/opt/google/chrome/chrome",
				"CHROME_DEVEL_SANDBOX=/opt/google/chrome/chrome-sandbox",
				"JAVA_HOME=/tools/third/java/jdk1.8.0_191",
				"REPO_URL=ssh://git@codecloud.web.att.com:7999/st_advertise/xaaf-js-sdk.git",
				"SONAR_SCANNER=/tools/apps/sonar-scanner-2.7/bin/sonar-scanner",
				"SONAR_NAME=XAAF-JS",
				"SONAR_KEY=XAAF-JS",
				"SONAR_PROJECT_NAME=XAAF-JS",
                "APPIUM_SKIP_CHROMEDRIVER_INSTALL=true",
				"https_proxy=http://emea-chain.proxy.att.com:8080",
				"http_proxy=http://emea-chain.proxy.att.com:8080",
				"EMAIL_DL=il732p@intl.att.com",
				"MODULE_NAME=packages",
				"PROXY_GRADLE_OPTS=-Dhttp.proxyHost=emea-chain.proxy.att.com -Dhttp.proxyPort=8080 -Dhttps.proxyHost=emea-chain.proxy.att.com -Dhttps.proxyPort=8080 -Dhttp.nonProxyHosts=135.76.2.18",
				"NEXUS_HOST=http://mavencentral.it.att.com:8081/nexus",
				"NEXUS_REPO=att-repository-3rd-party",
				"ARTIFACT_GROUPID=com.att.advertise",
				"ARTIFACT_ARTIFATCID=JS",
				"VERACODE_PROJECT=29542-XAAF-JS",
				"VERACODE_SANDBOX=29542-XAAF-JS",
                "NPM_REGISTRY=http://mavencentral.it.att.com:8081/nexus/repository/npm-advertise",
                "NPM_SCOPE=@advertise",
                "NPM_EMAIL=m32636@intl.att.com"
				]) { 
					
					monitorPipeline {
						try{
                          cleanWs()
							stage ("GIT") {
								current_stage=cicd_general.stage_init()
                                checkout([$class: 'GitSCM', branches: [[name: "*/${BRANCH_NAME}"]], doGenerateSubmoduleConfigurations: false, extensions: [[$class: 'CleanBeforeCheckout'], [$class: 'CheckoutOption', timeout: 60], [$class: 'CloneOption', depth: 0, noTags: false, reference: '', shallow: false, timeout: 60], [$class: 'LocalBranch', localBranch: "${BRANCH_NAME}"]], gitTool: 'IosGit', submoduleCfg: [], userRemoteConfigs: [[credentialsId: 'm32636_ssh', url: "${REPO_URL}"]]])
								//cicd_general.git()
							}
					
                    stage("Build") {
						current_stage=cicd_general.stage_init()
						sh """
						   jq '.config.YDotIApiKey = "AKCp5budJjGF2LusjcU9cfja7ZZF74dwbzSFWYhfBNksZZcht8GywNLZBtzi4xwCSuHv3tSCA"' build-config.json > build-config_1.json
						   mv build-config_1.json build-config.json
                           http=http://emea-auto.proxy.att.com:8001
                           https=http://emea-auto.proxy.att.com:8001
                           proxy=http://emea-auto.proxy.att.com:8001
                           http_proxy=http://emea-auto.proxy.att.com:8001
						   https_proxy=http://emea-auto.proxy.att.com:8001
						   yarn global add lerna
						   node run-command.js
                           yarn
                           yarn bootstrap
                           yarn build
                           yarn lint
                        """
					}
                  	stage("Test") {
						current_stage=cicd_general.stage_init()
						sh """
							cd packages/demos/demo-web/
							pm2 start node_modules/react-scripts/scripts/start.js --name react-app
							sleep 30
							cd ../../e2e-tests/web-ui
                            npx cypress run --env environment=$environment
                            pm2 stop react-app
                            cd ../../../../
                        """
					}
						}
						finally{
							sh """
								echo "done"
							"""
						cicd_email.typescript_Js_Web(
							"dl-XAAF_JS_SDK_Teams@intl.att.com",
							current_stage,errorMessage,
							"st_advertise","xaaf-js-sdk"
					)
						}
				} // end monitorPipeline
			}
		}
	}
}

