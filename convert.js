'use strict';

/*
 * Converts Toggl items to worklog items.
 */

var nconf = require('nconf')
  , convert = require('./lib/convert')
  , printPeriod = require('./lib/print_period')
  , writePeriod = require('./lib/write_period')
  ;

nconf.argv()
  .env()
  .file({ file: './config.json' });

convert(writePeriod);
