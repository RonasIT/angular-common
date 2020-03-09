function build() {
  const fs = require('fs');
  const $ = require('lodash');
  const { execSync } = require('child_process');

  const obj = JSON.parse(fs.readFileSync('angular.json', 'utf8'));
  $.keys(obj.projects).map((item) => {
    execSync(`ng build ${item}`, { stdio: 'inherit' })
  })
}

module.exports = build();
