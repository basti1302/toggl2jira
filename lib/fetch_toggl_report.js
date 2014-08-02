'use strict';

var nconf = require('nconf')
  , request = require('request')
  , report = 'details' // details, summary, weekly
  , togglReportUrl = 'https://toggl.com/reports/api/v2/' + report
  , display_hours = 'decimal' // decimal, minutes
  ;

module.exports = function fetchTogglReport(callback) {

  var apiToken = fetchConf('toggl:apiToken');
  var userAgent = fetchConf('toggl:userAgent');
  var workspaceId = fetchConf('toggl:workspaceId');
  var since = fetchConf('toggl:since');
  var until = fetchConf('toggl:until');

  /* prepare Toggl API request */
  var authOptions = {
    user: apiToken,
    pass: 'api_token',
    sendImmediately: true,
  };
  var queryParams = {
    user_agent: userAgent,
    workspace_id: workspaceId,
    since: since,
    until: until,
    display_hours: display_hours,
  };
  var options = {
    auth: authOptions,
    json: true,
    qs: queryParams,
  };

  /* execute Toggl API request */
  request.get(togglReportUrl, options, callback);
};

function fetchConf(key) {
  var value = nconf.get(key);
  if (typeof value === 'undefined' || value === null) {
    console.log('Missing mandatory configuration value: ' + key);
    process.exit(1);
  }
  return value;
}
