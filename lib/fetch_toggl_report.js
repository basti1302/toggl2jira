'use strict';

var request = require('request')
  , moment = require('moment')
  , fetchConf = require('./fetch_conf')
  , processTogglResponse = require('./process_toggl_response')
  , report = 'details' // details, summary, weekly
  , togglReportUrl = 'https://toggl.com/reports/api/v2/' + report
  , display_hours = 'decimal' // decimal, minutes
  ;

module.exports = function fetchTogglReport() {

  var apiToken = fetchConf('toggl:apiToken');
  var userAgent = fetchConf('toggl:userAgent');
  var workspaceId = fetchConf('toggl:workspaceId');
  var from = fetchConf('range:from');
  var until = fetchConf('range:until');

  var untilDay = moment(until);
  var day = moment(from);
  while (!day.isAfter(untilDay, 'day')) {
    fetchOneDay(apiToken, userAgent, workspaceId, day.format('YYYY-MM-DD'));
    day.add('days', 1);
  }
};

function fetchOneDay(apiToken, userAgent, workspaceId, day) {
  console.log(day);

  /* prepare Toggl API request */
  var authOptions = {
    user: apiToken,
    pass: 'api_token',
    sendImmediately: true,
  };
  var queryParams = {
    user_agent: userAgent,
    workspace_id: workspaceId,
    since: day,
    until: day,
    display_hours: display_hours,
  };
  var options = {
    auth: authOptions,
    json: true,
    qs: queryParams,
  };

  /* execute Toggl API request */
  console.log('sending request to Toggl API for date ' + day);
  request.get(togglReportUrl, options, processTogglResponse);
};
