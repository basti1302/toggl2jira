'use strict';

/**
 * Deletes worklog items from Jira. Only for testing purposes. Do not use with a
 * production Jira instance!!!
 */

require('./lib/init_nconf');

var nconf = require('nconf')
  , prompt = require('prompt')
  , request = require('request')
  , url = require('url')
  , fetchConf = require('./lib/fetch_conf')
  , getProjects = require('./lib/read_projects')
  ;

var jiraBaseUrl = fetchConf('jira:baseUrl')
  , jiraApiUrl = url.resolve(jiraBaseUrl, 'rest/api/2/')
  , username = fetchConf('jira:username')
  , password = fetchConf('jira:password')
  ;

prompt.message = 'WAIT!'.red;
prompt.delimiter = ' ';
prompt.start();
var description = 'Do you really want to delete worklog items from the Jira ' + 'instance at ' + jiraBaseUrl + '? (yes/no)'
var promptConfig = {
  properties: {
    really: {
      description: description.red,
      pattern: /^yes|no$/i,
      message: 'Please answer with yes or no.',
      default: 'no',
    },
  }
};
prompt.get(promptConfig, function(err, result) {
  if (err) { return console.log(err); }
  if (result.really && result.really.toLowerCase() !== 'yes') {
    console.log('Aborting');
    process.exit(0);
  } else {
    deleteStuff();
  }
});

function deleteStuff() {
  var projects = getProjects();
  for (var p in projects) {
    var jiraTicket = projects[p].jiraTicket;
    if (jiraTicket) {
      console.log('Deleting all worklog items for ticket ' + jiraTicket);
      var ticketUrl = url.resolve(jiraApiUrl, 'issue/' + jiraTicket);
      var worklogUrl = url.resolve(ticketUrl + '/', 'worklog');
      console.log(worklogUrl);
      var options = {
        json: true,
        auth: {
          username: username,
          password: password,
          sendImmediately: true,
        },
      };
      request.get(worklogUrl, options, function(err, res, body) {
        if (err) {
          console.log(worklogUrl + ': ');
          console.log(err);
          return;
        }
        if (res.statusCode != 200) {
          console.log(worklogUrl + ': ' + res.statusCode);
          return;
        }
        var worklogs = body.worklogs;
        if (worklogs) {
          for (var i = 0; i < worklogs.length; i++) {
            var worklogItemUrl = worklogs[i].self;
            request.del(worklogItemUrl, options, function(err, res, body) {
              if (err) {
                console.log(worklogItemUrl + ': ');
                console.log(err);
                return;
              }
              if (res.statusCode != 204) {
                console.log(worklogItemUrl + ': ' + res.statusCode);
                return;
              }
              console.log(worklogItemUrl + ': deleted');
            });
          }
        }
      });
    }
  }
}
