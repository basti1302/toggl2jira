'use strict';

var nconf = require('nconf')
  , cumulate = require('./lib/cumulate')
  ;

nconf.argv()
  .env()
  .file({ file: './config.json' });

cumulate();
