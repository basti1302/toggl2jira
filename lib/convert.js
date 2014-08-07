'use strict';

var level = require('level')
  , db = level('./data/toggl')
  , es = require('event-stream')
  , moment = require('moment')
  , fetchConf = require('./fetch_conf')
  , Period = require('./model/period')
  , WorklogItem = require('./model/worklog_item')
  ;

var from, until;

module.exports = function cumulate(callback) {
  from = moment(fetchConf('range:from'));
  until = moment(fetchConf('range:until'))

  var period = new Period();

  console.log('reading from database...');

  db.createReadStream({ valueEncoding: 'json' })
  .pipe(es.through(function write(data) {
    // fetch value from level object
    this.emit('data', data.value)
  }))
  // filter according to date range
  .pipe(es.map(isInRange))
  // convert from toggl item to worklog item
  .pipe(es.map(convert))
  // add to period
  .on('data', function(worklogItem) {
    period.addWorklogItem(worklogItem);
  })
  .on('error', function(err) {
    console.log('read error', err)
    process.exit(1);
  })
  .on('end', function() {
    console.log('...finished reading from database');
    callback(null, period);
  });
};

function isInRange(togglItem, callback) {
  if ((from.isSame(togglItem.start, 'day') ||
    from.isBefore(togglItem.start, 'day'))  &&
    (until.isSame(togglItem.start, 'day') ||
    until.isAfter(togglItem.start, 'day'))) {
    callback(null, togglItem);
  } else {
    callback();
  }
}

function convert(togglItem, callback) {
  callback(null, WorklogItem.fromTogglItem(togglItem));
}
