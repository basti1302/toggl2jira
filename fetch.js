'use strict';

/*
 * Fetches data from Toggl.
 */

var nconf = require('nconf')
  , fetchTogglReport = require('./lib/fetch_toggl_report')
  ;

nconf.argv()
  .env()
  .file({ file: './config.json' });

fetchTogglReport();
