'use strict';

var level = require('level')
  , db = level('./data/toggl')
  ;

module.exports = function processTogglResponse(err, res, body) {
  console.log('request returned from Toggl API');
  if (err) {
    console.log(err);
    process.exit(1);
  }

  if (res.statusCode !== 200) {
    console.log('!!! Unexpected status code: ' + res.statusCode);
    if (res.statusCode === 403) {
      console.log('HTTP status 403: Double check your API token.');
    } else if (res.statusCode === 429) {
      console.log('HTTP status 429: Too many requests. You hit the Toggl ' +
           'rate limit. Try to fetch data in smaller batches (by using ' +
           'range.from and range.to in config.json.');
    }
    process.exit(1);
  }

  var period = processTogglResponseBody(body);
}

function processTogglResponseBody(togglResponse) {
  console.log('fetched ' + togglResponse.data.length + ' items from Toggl');
  var ws = db.createWriteStream({ valueEncoding: 'json' });
  ws.on('error', function (err) {
    console.log('error during database write', err);
    process.exit(1);
  })
  .on('close', function () {
    console.log('database write stream closed');
  });
  for (var i = 0; i < togglResponse.data.length; i++) {
    var togglItem = togglResponse.data[i];
    console.log('processing item: ' + togglItem.start + ' - ' + togglItem.end +
        ': ' + togglItem.description + ' (' + togglItem.project + ')');
    ws.write({ key: togglItem.id.toString(), value: togglItem });
  }
  ws.end();
}
