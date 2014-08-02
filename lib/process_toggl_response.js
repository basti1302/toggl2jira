'use strict';

var Period = require('./model/period')
  , printAsJson = require('./print_as_json')
  , WorklogItem = require('./model/worklog_item')
  ;

module.exports = function processTogglResponse(err, res, body) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  if (res.statusCode !== 200) {
    console.log('Unexpected status code: ' + res.statusCode);
    if (res.statusCode === 403) {
      console.log('Double check your API token.');
    }
    process.exit(1);
  }

  var period = processTogglResponseBody(body);
  printAsJson(period);
}

function processTogglResponseBody(togglResponse) {
  var period = new Period();
  for (var i = 0; i < togglResponse.data.length; i++) {
    var togglItem = togglResponse.data[i];
    var worklogItem = WorklogItem.fromTogglItem(togglItem);
    period.addWorklogItem(worklogItem);
  }
  return period;
}
