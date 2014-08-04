'use strict';

var level = require('level')
  , db = level('./data/worklog')
  ;

db.createReadStream({ valueEncoding: 'json' })
.on('data', function(data) {
  console.log(data.key + ':');
  console.log(data.value);
})
.on('error', function(err) {
  console.log('read error', err)
});
