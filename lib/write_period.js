'use strict';

var level = require('level')
  , db = level('./data/worklog')

module.exports = function writePeriod(err, period) {
  if (err) { return console.log(err); }
  var ws = db.createWriteStream({ valueEncoding: 'json' });
  ws.on('error', function (err) {
    console.log('error during database write', err);
    process.exit(1);
  })
  .on('close', function () {
    console.log('database write stream closed');
  });

  for (var d in period.days) {
    var day = period.days[d];
    var items = day.getWorklogItems();
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      ws.write({ key: item.id, value: item });
    }
  }
};
