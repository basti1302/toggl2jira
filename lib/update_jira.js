'use strict';

var level = require('level')
  , db = level('./data/worklog', { valueEncoding: 'json' })
  , moment = require('moment')
  , request = require('request')
  , url = require('url')
  , fetchConf = require('./fetch_conf')
  , WorklogItem = require('./model/worklog_item')
  , Period = require('./model/period')
  ;

var jiraBaseUrl
  , jiraApiUrl
  , username
  , password
  ;

module.exports = function updateJira() {

  jiraBaseUrl = fetchConf('jira:baseUrl');
  jiraApiUrl = url.resolve(jiraBaseUrl, 'rest/api/2/');
  username = fetchConf('jira:username');
  password = fetchConf('jira:password');

  var period = new Period();

  db.createReadStream()
  .on('data', function(data) {
    period.addWorklogItem(createWorklogItem(data));
  })
  .on('error', function(err) {
    console.log('read error', err)
  })
  .on('end', function() {
    // TODO Stream every day to jira instead of gathering the whole period in
    // memory
    postToJira(period);
  });
};

function createWorklogItem(levelObject) {
  return WorklogItem.fromLevelObject(levelObject);
}

function postToJira(period) {
  for (var d in period.getDays()) {
    var day = period.days[d];
    // TODO Make it configurable if hours are booked cumulated per ticket/day or
    // individually per Toggl item
    var hoursPerTicket = day.getHoursPerTicket();
    for (var h in hoursPerTicket) {
      var log = hoursPerTicket[h];
      var ticket = log.project.jiraTicket;
      var hours = log.hours;
      var description = log.description;
      if (hasBeenSynced(log)) {
        console.log(day.date + ', ' + ticket + ': already synced.');
        // TODO Maybe later check if source data has been modified after syncing
        // and if we need to update the Jira worklog item.
      } else {
        doHttpPost(day.date, ticket, hours, description, log);
      }
    }
  }
}

function hasBeenSynced(log) {
  for (var i = 0; i < log.worklogItems.length; i++) {
    var worklogItem = log.worklogItems[i];
    if (worklogItem.syncedTo && worklogItem.syncedAt) {
      return true;
    }
  }
  return false;
}

function doHttpPost(date, ticket, hours, description, log) {
  if (ticket && hours > 0) {
    var options = {
      json: true,
      body: createPostBody(date, ticket, hours, description),
      auth: {
        username: username,
        password: password,
        sendImmediately: true,
      },
    };
    var url = jiraUrl('issue/' + ticket + '/worklog');
    console.log(date + ', ' + ticket + ': creating Jira worklog item, ' +
      'booking ' + hours + ' hours.');
    request.post(url, options,
      function(err, res, body) {
      if (err) {
        console.log(date + ', ' + ticket + ': error while creating Jira ' +
          'worklog item: ');
        console.log(err);
        return;
      }
      if (res.statusCode === 404) {
        console.log(date + ', ' + ticket + ': Jira returned HTTP status 404. ' +
          'In most cases, this indicates that you used a Jira issue ID in ' +
          'your configuration that does not exist in Jira. Double check if ' +
          ticket + ' is an existing Jira issue. HTTP body returned by Jira:');
        console.log(JSON.stringify(body, null, 2));
        return;
      } else if (res.statusCode !== 201) {
        console.log(date + ', ' + ticket + ': unexpected HTTP status ' +
          res.statusCode + ' while creating Jira worklog item. Body: ');
        console.log(JSON.stringify(body, null, 2));
        return;
      }
      var jiraWorklogItemId = body.id;
      console.log(date + ', ' + ticket + ': succesfully created JIRA worklog ' +
        'item with id: ' + jiraWorklogItemId);
      // TODO Update level object in data/worklog with Jira id
      // When cumulating, one Jira id is related to multiple data/worklog items.
      for (var i = 0; i < log.worklogItems.length; i++) {
        var worklogItem = log.worklogItems[i];
        if (!worklogItem.levelKey) {
          console.log('ERROR: A worklog item that has been synchronized to ' +
            'Jira has no LevelDB key');
          continue;
        }
        var levelKey = worklogItem.levelKey;
        delete worklogItem.levelKey;
        worklogItem.syncedTo = jiraWorklogItemId;
        worklogItem.syncedAt = moment().toISOString();
        db.put(levelKey, worklogItem);
      }
    });
  }
}

function createPostBody(date, ticket, hours, description) {
  // TODO Use timestamp from the Toggl item as started time, not only the date.
  // If multiple Toggl items have been cumulated to one Jira worklog item, use
  // the timestamp from the first worklog item.
  return {
    comment: description,
    started: moment(date).format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
    timeSpentSeconds: Math.round(hours * 3600),
  };
}

function jiraUrl(path) {
  return url.resolve(jiraApiUrl, path);
}
