'use strict';

require('./lib/init_nconf');

var es = require('event-stream')
  , level = require('level')
  , moment = require('moment')
  , dbToggl = level('./data/toggl')
  , dbWorklog = level('./data/worklog')
  , fetchConf = require('./lib/fetch_conf')
  ;

var from;
var until;

function printToggl() {
  console.log('>>>> PRINTING TOGGL ITEMS');
  printDb(dbToggl, printWorklog);
}

function printWorklog() {
  console.log('\n\n\n>>>> PRINTING CONVERTED WORKLOG ITEMS');
  printDb(dbWorklog, done);
}

function done() {
  console.log('>>>> done');
}

function printDb(db, next) {

  from = moment(fetchConf('range:from'));
  until = moment(fetchConf('range:until'))

  db.createReadStream({ valueEncoding: 'json' })
  .pipe(es.through(function write(data) {
    // fetch value from level object
    this.emit('data', data.value)
  }))
  // filter according to date range
  .pipe(es.map(isInRange))
  // print data
  .on('data', function(item) {
    print(item);
  })
  .on('error', function(err) {
    console.log('error', err)
  })
  .on('end', function() {
    if (typeof next === 'function') {
      next();
    }
  });
}

function isInRange(item, callback) {
  if ((from.isSame(item.start, 'day') ||
    from.isBefore(item.start, 'day'))  &&
    (until.isSame(item.start, 'day') ||
    until.isAfter(item.start, 'day'))) {
    callback(null, item);
  } else {
    callback();
  }
}

function print(item) {
  if (item.uid) {
    // Toggl item
    console.log(f(item.start) + ' - ' + f(item.end));
    console.log(item.client + '/' + item.project + ': ' + item.description);
    console.log('----------------');
  } else {
    // worklog item
    console.log(f(item.start) + ': ' + item.duration + ' h');
    console.log(item.togglItem.client + '/' + item.togglItem.project + ': ' +
        item.description);
    console.log('----------------');
  }
}

function f(date) {
  return moment(date).format('DD.MM.YYYY HH:mm');
}

printToggl();
