'use strict';

require('./lib/init_nconf');

var level = require('level')
  , dbToggl = level('./data/toggl')
  , dbWorklog = level('./data/worklog')
  ;


function printToggl() {
  console.log('>>>> printing Toggl items');
  printDb(dbToggl, printWorklog);
}

function printWorklog() {
  console.log('>>>> printing worklog items');
  printDb(dbWorklog, done);
}

function done() {
  console.log('>>>> done');
}

function printDb(db, next) {
  db.createReadStream({ valueEncoding: 'json' })
  .on('data', function(data) {
    console.log(data.key + ':');
    console.log(data.value);
  })
  .on('error', function(err) {
    console.log('read error', err)
  })
  .on('end', function() {
    if (typeof next === 'function') {
      next();
    }
  });
}

printToggl();
