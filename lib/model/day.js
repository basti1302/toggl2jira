'use strict';

/*
 * A day contains all worklog items for a single day.
 * Multiple days are accumulated in a period.
 */

function Day(date) {
  this.date = date;
  this.items = [];
  this.itemsPerProject = {};
  this.projects = {};
}

Day.prototype.addWorklogItem = function(projectKey, worklogItem) {
  this.items.push(worklogItem);
  var itemsForOneProject = this.itemsPerProject[projectKey];
  if (!itemsForOneProject) {
    itemsForOneProject = [];
    this.itemsPerProject[projectKey] = itemsForOneProject;
  }
  itemsForOneProject.push(worklogItem);
  this.projects[projectKey] = worklogItem.project;
};

Day.prototype.getWorklogItems = function() {
  return this.items;
};

Day.prototype.getProjectKeys = function() {
  return Object.keys(this.itemsPerProject);
};

Day.prototype.getHoursPerTicket = function() {
  var hoursPerTicket = {};
  for (var key in this.itemsPerProject) {
    var entry = {};
    entry.project = this.projects[key];

    var items = this.itemsPerProject[key];

    entry.worklogItems = items;

    entry.hours = items.reduce(function(prev, item) {
      return prev + item.duration;
    }, 0);

    if (items.length === 1) {
      entry.description = items[0].description;
    } else {
      entry.description = items.reduce(function(prev, item) {
        return prev + '\n- ' + item.description + ' (' + item.duration + ' h)';
      }, '');
    }

    hoursPerTicket[key] = entry;
  }
  return hoursPerTicket;
};

Day.prototype.getHoursTotal = function() {
  var hoursPerTicket = this.getHoursPerTicket();
  return Object.keys(hoursPerTicket).reduce(function(prev, key) {
    return prev + hoursPerTicket[key].hours;
  }, 0);
}

module.exports = Day;
