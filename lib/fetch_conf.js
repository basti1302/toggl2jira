'use strict';

var nconf = require('nconf');

function fetchConf(key) {
  var value = nconf.get(key);
  if (typeof value === 'undefined' || value === null) {
    console.log('Missing mandatory configuration value: ' + key);
    process.exit(1);
  }
  return value;
}

fetchConf.optional = function(key, defaultValue) {
  var value = nconf.get(key);
  if (typeof value === 'undefined' || value === null) {
    if (typeof defaultValue !== 'undefined' && defaultValue !== null) {
      return defaultValue;
    } else {
      return null;
    }
  }
  return value;
}

module.exports = fetchConf;
