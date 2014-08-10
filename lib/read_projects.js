'use strict';

var nconf = require('nconf')
  , Project = require('./model/project')
  ;

var projects;

module.exports = function getProjects() {
  if (!projects) {
    projects = {};
    var projectArray = nconf.get('projects');
    for (var i = 0; i < projectArray.length; i++) {
      var confProject = projectArray[i];
      if (!confProject.togglProjectId) {
        console.log('WARNING: Ignoring project in configuration without attribute togglProjectId: ');
        continue;
      }
      var togglPid = confProject.togglProjectId.toString();
      var project = new Project(
        togglPid,
        confProject.jiraTicket,
        confProject.description
      );
      projects[togglPid] = project;
    }
  }
  return projects;
};
