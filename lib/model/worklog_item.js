'use strict';

var moment = require('moment')
  , Project = require('./project')
  , getProjects = require('../read_projects')
  , oneMinute = 60 * 1000
  , oneHour = 60 * oneMinute
  ;

function WorklogItem(date, start, end, duration, project, description,
    togglItem) {
  this.id = start + ':' + togglItem.id;
  this.date = date;
  this.start = start;
  this.end = end;
  this.duration = duration;
  this.project = project;
  this.description = description;
  this.togglItem = togglItem;
};

WorklogItem.fromTogglItem = function(togglItem) {
  var start = parseTime(togglItem.start);
  var date = start.format('YYYY-MM-DD');
  if (togglItem.pid) {
    return new WorklogItem(date, start, parseTime(togglItem.end),
      roundToHours(togglItem.dur), getProject(togglItem.pid, togglItem.project),
      togglItem.description, togglItem);
  } else {
    console.log('>>>> Found Toggl item without project: ');
    console.log('Description: ' + togglItem.description);
    console.log('Started:  ' + togglItem.start);
    console.log('Finished: ' + togglItem.end);
    console.log('Duration: ' + roundToHours(togglItem.dur));
    console.log('<<<<');
  }
};

WorklogItem.fromLevelObject = function(levelObject) {
  var worklogItem = new WorklogItem(
    levelObject.date,
    levelObject.start,
    levelObject.end,
    levelObject.duration,
    levelObject.project,
    levelObject.description,
    levelObject.togglItem
  );
  worklogItem.id = levelObject.id;
  return worklogItem;
};

WorklogItem.prototype.getProjectKey = function() {
  return this.project.togglPid;
};

/**
 * Converts milliseconds to hours, rounding to 2 digits behind decimal
 * separator.
 */
function roundToHours(millis) {
  var hours = millis / oneHour;
  return Math.round(hours * 100) / 100;
}

function parseTime(timestamp) {
  return moment(timestamp, moment.ISO_8601);
}

function getProject(togglPid, togglProject) {
  var projects = getProjects();
  var project = projects[togglPid];
  if (!project) {
    console.log('Unknown Toggl project id: ' + togglPid + ' (' + togglProject +
      ')');
    // add an entry with this Toggl project id on the fly
    project = new Project(togglPid, null, null);
    projects[togglPid] = project;
  }
  return project;
}

module.exports = WorklogItem;
