@Library('cicd_functions') _

node("Js-Ios") {
    
    timestamps {
		timeout(6000) {
		    withEnv([
              	"PROJECT_NAME=XAAF-FireTv-E2E",
				"PROJECT_PLATFORM=Linux",
				"PROJECT_MAJOR_VERSION=1.0.0",
				"MAJOR_VERSION=1.0.0",
				"PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1",
				"PUPPETEER_EXECUTABLE_PATH=/opt/google/chrome/chrome",
				"CHROME_DEVEL_SANDBOX=/opt/google/chrome/chrome-sandbox",
				"JAVA_HOME=/Library/Java/JavaVirtualMachines/adoptopenjdk-8.jdk/Contents/Home",
				"REPO_URL=https://m32636@codecloud.web.att.com/scm/st_advertise/xaaf-js-sdk.git",
				"SONAR_SCANNER=/tools/apps/sonar-scanner-2.7/bin/sonar-scanner",
				"SONAR_NAME=XAAF-JS",
				"SONAR_KEY=XAAF-JS",
				"SONAR_PROJECT_NAME=XAAF-JS",
                "APPIUM_SKIP_CHROMEDRIVER_INSTALL=true",
				"https_proxy=http://emea-auto.proxy.att.com:8001",
				"http_proxy=http://emea-auto.proxy.att.com:8001",
				"EMAIL_DL=il732p@intl.att.com",
				"MODULE_NAME=packages",
				"PROXY_GRADLE_OPTS=-Dhttp.proxyHost=emea-chain.proxy.att.com -Dhttp.proxyPort=8080 -Dhttps.proxyHost=emea-chain.proxy.att.com -Dhttps.proxyPort=8080 -Dhttp.nonProxyHosts=135.76.2.18",
				"NEXUS_HOST=http://mavencentral.it.att.com:8081/nexus",
				"NEXUS_REPO=att-repository-3rd-party",
				"ARTIFACT_GROUPID=com.att.advertise",
				"ARTIFACT_ARTIFATCID=JS",
				"VERACODE_PROJECT=29542-XAAF-JS",
				"VERACODE_SANDBOX=29542-XAAF-JS",
				"ANDROID_NDK_HOME=/Users/m23546/Library/Android/sdk/ndk/17.2.4988734",
				"ANDROID_NDK=/Users/m23546/Library/Android/sdk/ndk/17.2.4988734",
				"NDK_ROOT=/Users/m23546/Library/Android/sdk/ndk/17.2.4988734",
				"ANDROID_SDK_ROOT=/Users/m23546/Library/Android/sdk/",
                "NPM_REGISTRY=http://mavencentral.it.att.com:8081/nexus/repository/npm-advertise",
                "NPM_SCOPE=@advertise",
                "NPM_EMAIL=m32636@intl.att.com"
				]) { 
					
					monitorPipeline {
						try{
                            cleanWs()
							stage ("GIT") {
								//cicd_general.stage_init()
                                checkout([$class: 'GitSCM', branches: [[name: "*/${BRANCH_NAME}"]], doGenerateSubmoduleConfigurations: false, extensions: [[$class: 'CleanBeforeCheckout'], [$class: 'CheckoutOption', timeout: 60], [$class: 'CloneOption', depth: 0, noTags: false, reference: '', shallow: false, timeout: 60], [$class: 'LocalBranch', localBranch: "${BRANCH_NAME}"]], gitTool: 'IosGit', submoduleCfg: [], userRemoteConfigs: [[credentialsId: '597b63f2-bd70-4301-a0c5-ae6f51fec33f', url: "${REPO_URL}"]]])
								//cicd_general.git()
							}
					
                    stage("Build") {
						cicd_general.stage_init()
						sh """
						   jq '.config.YDotIApiKey = "AKCp5budJjGF2LusjcU9cfja7ZZF74dwbzSFWYhfBNksZZcht8GywNLZBtzi4xwCSuHv3tSCA"' build-config.json > build-config_1.json
						   mv build-config_1.json build-config.json
						   . ~/.nvm/nvm.sh
                           nvm use v12.13.1
                           http=http://emea-auto.proxy.att.com:8001
                           https=http://emea-auto.proxy.att.com:8001
                           proxy=http://emea-auto.proxy.att.com:8001
                           http_proxy=http://emea-auto.proxy.att.com:8001
						   https_proxy=http://emea-auto.proxy.att.com:8001
						   yarn global add lerna
                           #npm --userconfig=./.npmrc install
						   node run-command.js
						   #yarn add package.json
                           #./../NpmLocalReact.sh
                           yarn
                           yarn bootstrap
                           yarn build
                           yarn lint
                        """
					}
                  stage("Test") {
						cicd_general.stage_init()
						sh """
                            . ~/.nvm/nvm.sh
                            nvm use v12.13.1
                            java -version
                            export PATH=$PATH:~/Library/Android/sdk/platform-tools/
                            cd packages/demos/demo-youitv
                            yarn build:android:debug
                            yarn install:android:debug
                            yarn start &
                            cd ../../e2e-tests/youi-ui
                            yarn appium &
                            yarn prepare-test && environment=$environment scenarios=$scenarios framework=$framework npx wdio config/wdio.android.conf.js
                        """
					}
						}
						finally{
							sh """
								echo "done"
							"""
						}
				} // end monitorPipeline
			}
		}
	}
}
