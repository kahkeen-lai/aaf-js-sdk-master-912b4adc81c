pipeline {
    agent { node { label 'Linux' } }
    stages {
        stage('Triggering the main job') {
            steps {
                build job: "ad_sdk_web/master",
                    parameters: [booleanParam(name: 'UT_FLAG', value: 'true'),
                                 booleanParam(name: 'SAST_FLAG', value: 'true'),
                                 booleanParam(name: 'PROMOTE_VERACODE_SCAN', value: 'true'),
                                 booleanParam(name: 'SONAR_FLAG', value: 'true'),
                                 booleanParam(name: 'WEBSERVER_FLAG', value: 'true'),
                                 booleanParam(name: 'CHECKMARX_FLAG', value: 'true'),
                                 booleanParam(name: 'SAST_SCA_FLAG', value: 'true'),
                                 booleanParam(name: 'MUTATION_FLAG', value: 'false'),
                                 string(name: 'INTEGRATION_FLAG_NIGHTLY', value: '--testFailureExitCode 1'),
                                 booleanParam(name: 'PUBLISH_RELEASE', value: 'true')]
            }
        }
    }
}
