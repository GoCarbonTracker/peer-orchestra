const fs = require('fs');
const path = require('path');

function getVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf-8'));
  return pkg.version;
}

module.exports = { getVersion };
