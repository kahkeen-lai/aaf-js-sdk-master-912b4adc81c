@Library('cicd_functions') _

node("Js-Ios") {
    
    timestamps {
		timeout(1000) {
		    withEnv([
              	"PROJECT_NAME=XAAF-Ios-E2E",
				"PROJECT_PLATFORM=Linux",
				"PROJECT_MAJOR_VERSION=1.0.0",
				"MAJOR_VERSION=1.0.0",
				"PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1",
				"PUPPETEER_EXECUTABLE_PATH=/opt/google/chrome/chrome",
				"CHROME_DEVEL_SANDBOX=/opt/google/chrome/chrome-sandbox",
				"JAVA_HOME=/tools/third/java/jdk1.8.0_191",
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
                           http_proxy=http://emea-auto.proxy.att.com:8001
						   https_proxy=http://emea-auto.proxy.att.com:8001
						   yarn global add lerna
                           #npm --userconfig=./.npmrc install
						   node run-command.js
						   #yarn add package.json
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
							cd packages/demos/demo-youitv/youi/
							sudo ./generate.rb -p tvos --remote 192.168.1.24 --you-version 5.17.0 -d YI_CODE_SIGN_IDENTITY="Apple Development:  Eran Shturem (CC8X3237A9)"  -d YI_DEVELOPMENT_TEAM="Interwise LTD" && rm -rf /tmp/haste-map-react-native-packager
                            # sudo xcodebuild -project /Users/m23546/Jenkins/workspace/xaaf-js-AppelTv-2e2/packages/demos/demo-youitv/youi/build/tvos/YiDemo.xcodeproj  -scheme YiDemo -destination 'platform=tvOS Simulator,OS=13.4,name=Apple TV 4K (at 1080p)'
							sudo xcodebuild -project /Users/m23546/Jenkins/workspace/xaaf-js-AppelTv-2e2/packages/demos/demo-youitv/youi/build/tvos/YiDemo.xcodeproj  -scheme YiDemo -destination 'platform=tvOS Simulator,OS=13.4,name=Apple TV 4K (at 1080p)' DSTROOT="/Users/m23546/Jenkins/workspace/IosApp" archive

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
