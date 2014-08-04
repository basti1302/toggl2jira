'use strict';

var moment = require('moment')
  , Project = require('./project')
  , oneMinute = 60 * 1000
  , oneHour = 60 * oneMinute
  ;

var projects = {
  5169275: new Project(5169275, null, 'Provi misc'),
  5169305: new Project(5169305, 'TIMXIII-1233',
    '2014-0484-A: Implementierung Makler-Portal'),
  5169336: new Project(5169336, 'TIMXIII-1216',
    '2014-0431-B: Architekturberatung ProMakler'),
  5169353: new Project(5169353, 'TIMXIII-1218',
    '2014-0433-B: Beratung Funkoptimierung'),
  5169364: new Project(5169364, 'TIMXIII-1220',
    '2014-0434-B: Auswahl neues Buildverfahren'),
  5169856: new Project(5169856, 'TIMXIII-269', '20%'),
  5311696: new Project(5311696, 'TIMXIII-765', 'Recruiting'),

  // ProApp - TIMXIII-1217
  // CI - TIMXIII-1219
  // TIMXIII-163 Admin Zeiten
  // TIMXIII-272 Vacation/Urlaub
};

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
  return new WorklogItem(date, start, parseTime(togglItem.end),
    roundToHours(togglItem.dur), getProject(togglItem.pid, togglItem.project),
    togglItem.description, togglItem);
};

WorklogItem.prototype.getProjectKey = function() {
  return this.project.togglPid;
};

/**
 * Converts milliseconds to hours, rounding to 2 digits behind decimal
 * separator.
 */
function roundToHours(millis) {
  // TODO Maybe replace with moment.js, but works as is
  var hours = millis / oneHour;
  return Math.round(hours * 100) / 100;
}

function parseTime(timestamp) {
  return moment(timestamp, moment.ISO_8601); // 'YYYY-MM-DDTHH:mm:ss+Z')
}

function getProject(togglPid, togglProject) {
  var projectId = togglPid.toString();
  var project = projects[projectId];
  if (!project) {
    console.log('Unknown Toggl project id: ' + togglPid + '(' + togglProject + ')');
    // add an entry with this Toggl project id on the fly
    project = new Project(togglPid, null, null);
    projects[projectId] = project;
  }
  return project;
}

module.exports = WorklogItem;
