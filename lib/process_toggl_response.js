'use strict';

var level = require('level')
  , db = level('./data/toggl')
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
}

function processTogglResponseBody(togglResponse) {
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
    ws.write({ key: togglItem.id.toString(), value: togglItem });
  }
  ws.end();
}


