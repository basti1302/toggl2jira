'use strict';

function Project(togglPid, jiraTicket, description) {
  this.togglPid = togglPid;
  this.jiraTicket = jiraTicket;
  this.description = description;
}

// TODO Use parsed JSON object directly!

module.exports = Project;
