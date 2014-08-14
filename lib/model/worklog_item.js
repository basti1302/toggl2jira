'use strict';

var moment = require('moment')
  , Project = require('./project')
  , getProjects = require('../read_projects')
  , roundToHours = require('../hours').roundMillisToHours
  ;

function WorklogItem(date, start, end, duration, project, description,
    togglItem) {
  this.date = date;
  this.start = start;
  this.end = end;
  this.duration = duration;
  this.project = project;
  this.description = description;
  this.togglItem = togglItem;
  this.setId();
}

WorklogItem.prototype.setId = function() {
  if (this.togglItem) {
    this.id = this.start + ':' + this.togglItem.id;
  }
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
  var levelValue = levelObject.value;
  var worklogItem = new WorklogItem();
  for (var key in levelValue) {
    if (levelValue.hasOwnProperty(key)) {
      worklogItem[key] = levelValue[key];
    }
  }
  worklogItem.setId();
  worklogItem.levelKey = levelObject.key;
  return worklogItem;
};

WorklogItem.prototype.getProjectKey = function() {
  return this.project.togglPid;
};

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
