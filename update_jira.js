'use strict';

var nconf = require('nconf')
  , updateJira = require('./lib/update_jira')
  ;

nconf.argv()
  .env()
  .file({ file: './config.json' });

updateJira();
