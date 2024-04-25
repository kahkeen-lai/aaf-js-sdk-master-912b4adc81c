const createReporter = require('istanbul-api').createReporter;
const istanbulCoverage = require('istanbul-lib-coverage');

const PROJECTS = [
  'http-axios',
  'key-service',
  'xaaf-js-sdk',
  'common',
  'xaaf-web-sdk',
  'xaaf-hadron-sdk',
  'aaf-rn-sdk'
];

try {
  const istanbulReporter = createReporter();
  istanbulReporter.addAll(['json', 'lcov', 'text']);

  const istanbulCoverageMap = istanbulCoverage.createCoverageMap();
  PROJECTS.forEach((project) => {
    // for each project
    const projectCoverage = require(`./coverage/coverage-${project}.json`);
    const projectFilenames = Object.keys(projectCoverage);
    projectFilenames.forEach((filename) => {
      // for each file
          try {
            istanbulCoverageMap.addFileCoverage(projectCoverage[filename]);
          } catch (error) {
            console.error(error);
          }
        }
    );
  });

  istanbulReporter.write(istanbulCoverageMap);

  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}

