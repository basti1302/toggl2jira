'use strict';

module.exports = function printPeriod(period) {
  for (var d in period.days) {
    var day = period.days[d];
    console.log(day.date + ':');
    console.log('Day Total: ' + day.getHoursTotal());
    console.log(JSON.stringify(day.getHoursPerTicket(), null, 2));
  }
};
