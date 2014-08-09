'use strict';

/*
 * Converts Toggl items to worklog items.
 */

require('./lib/init_nconf');

var convert = require('./lib/convert')
  , writePeriod = require('./lib/write_period')
  ;

convert(writePeriod);
