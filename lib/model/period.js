'use strict';

var Day = require('./day');

/*
 * A period contains one or multiple days.
 */

function Period() {
  this.days = {};
}

Period.prototype.addWorklogItem = function(worklogItem) {
  var day = this.getDay(worklogItem.date);
  day.addWorklogItem(worklogItem.getProjectKey(), worklogItem);
};

Period.prototype.getDay = function(date) {
  var day = this.days[date];
  if (!day) {
    day = new Day(date);
    this.days[date] = day;
  }
  return day;
};

module.exports = Period;
