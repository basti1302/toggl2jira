'use strict';

function Project(togglPid, jiraTicket, description) {
  this.togglPid = togglPid;
  this.jiraTicket = jiraTicket;
  this.description = description;
}

module.exports = Project;
