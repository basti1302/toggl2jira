'use strict';

var fs = require('fs')
  , nconf = require('nconf')
  ;

var fetchTogglReport = require('./lib/fetch_toggl_report')
  , processTogglResponse = require('./lib/process_toggl_response')
  ;

nconf.argv()
  .env()
  .file({ file: './config.json' });

fetchTogglReport(processTogglResponse);


