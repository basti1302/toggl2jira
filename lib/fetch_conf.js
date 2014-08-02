'use strict';

var nconf = require('nconf');

module.exports = function fetchConf(key) {
  var value = nconf.get(key);
  if (typeof value === 'undefined' || value === null) {
    console.log('Missing mandatory configuration value: ' + key);
    process.exit(1);
  }
  return value;
};
