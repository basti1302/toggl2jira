'use strict';

module.exports = function printPeriod(err, period) {
  if (err) { return console.log(err); }
  for (var d in period.days) {
    var day = period.days[d];
    console.log(day.date + ':');
    console.log('Day Total: ' + day.getHoursTotal());
    console.log(JSON.stringify(day, null, 2));
    // console.log(JSON.stringify(day.getHoursPerTicket(), null, 2));
  }
};
