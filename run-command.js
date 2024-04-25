const metadata = require('./build-config');
const { exec } = require('child_process');

(async () => {
  await new Promise((resolve, reject) => {
    exec('yarn global add youi-cli', (error, stdout, stderr) => {
      if (error) {
        console.log(`error yarn global add youi-cli: ${error.message} ${stderr}`);
        reject();
        return;
      }
      console.log(`stdout: yarn global add youi-cli works`);
      resolve();
    });
  });

  await new Promise((resolve, reject) => {
    exec('yarn global upgrade youi-cli', (error, stdout, stderr) => {
      if (error) {
        console.log(`error yarn global upgrade youi-cli: ${error.message} ${stderr}`);
        reject();
        return;
      }
      console.log(`stdout: yarn global upgrade youi-cli works`);
      resolve();
    });
  });

  await new Promise((resolve, reject) => {
    exec( // NOSONAR
      `youi-tv login --set  ${metadata.config.YDotIApiKey}`,
      (error, stdout, stderr) => {
        if (error) {
          console.log(`error youi-tv login --set : ${error.message} ${stderr}`);
          reject();
          return;
        }
        console.log(`stdout:  youi-tv login --set works`);
        resolve();
      }
    );
  });
})();
