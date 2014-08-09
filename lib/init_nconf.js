'use strict';

require('nconf')
  .argv()
  .env()
  .file({ file: './config.json' });
