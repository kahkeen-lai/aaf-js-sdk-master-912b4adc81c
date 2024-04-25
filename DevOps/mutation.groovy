@Library('cicd_functions') _
  

node("MT") {
	env.gBuildCmd = ""

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
				"APPIUM_SKIP_CHROMEDRIVER_INSTALL=true",
				"https_proxy=http://emea-chain.proxy.att.com:8080",
				"http_proxy=http://emea-chain.proxy.att.com:8080",
				"HTTP_PROXY=http://emea-chain.proxy.att.com:8080",
				"HTTPS_PROXY=http://emea-chain.proxy.att.com:8080",						   
				"PROXY_GRADLE_OPTS=-Dhttp.proxyHost=emea-chain.proxy.att.com -Dhttp.proxyPort=8080 -Dhttps.proxyHost=emea-chain.proxy.att.com -Dhttps.proxyPort=8080 -Dhttp.nonProxyHosts=135.76.2.18",
			]) {
          	try {
				cleanWs()
              
              
              	stage("GIT") {
					cicd_general.stage_init()
					cicd_general.git()
				}

				stage("mutation tests") {
					cicd_general.stage_init()
           		    sh """
       			         . ~/.nvm/nvm.sh
       			         nvm use v12.13.1
						 yarn
						 yarn bootstrap:ci    	
                         yarn build
                         cd packages/core/xaaf-js-sdk
						 yarn mutation
                         cd ../../../
                         zip html.zip -r coverage/reports/xaaf-js-sdk
       			     """
        		    publishHTML (target: [
    					allowMissing: false,
  						alwaysLinkToLastBuild: false,
    					keepAll: true,
					    reportDir: 'coverage/reports/xaaf-js-sdk',
     					reportFiles: 'index.html',
    					reportName: "Mutaion Report"
   					])
                  archiveArtifacts artifacts: 'html.zip', allowEmptyArchive: true
				}
            }
            finally {
				sh """ echo mutation tests done """
			} // finally  
            }//withEnv
        }
    }
}
