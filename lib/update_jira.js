'use strict';

var level = require('level')
  , db = level('./data/worklog', { valueEncoding: 'json' })
  , es = require('event-stream')
  , moment = require('moment')
  , request = require('request')
  , url = require('url')
  , fetchConf = require('./fetch_conf')
  , roundHours = require('./hours').roundHoursToHours
  , WorklogItem = require('./model/worklog_item')
  , Period = require('./model/period')
  ;

var jiraBaseUrl
  , jiraApiUrl
  , username
  , password
  , cumulated
  , dryRun
  ;

var from, until;

module.exports = function updateJira() {
  from = moment(fetchConf('range:from'));
  until = moment(fetchConf('range:until'))

  jiraBaseUrl = fetchConf('jira:baseUrl');
  jiraApiUrl = url.resolve(jiraBaseUrl, 'rest/api/2/');
  username = fetchConf('jira:username');
  password = fetchConf('jira:password');
  cumulated = fetchConf.optional('jira:cumulated', true);
  dryRun = fetchConf.optional('jira:dryRun', false);

  var period = new Period();

  db.createReadStream()
  // filter according to date range
  .pipe(es.map(isInRange))
  // add to period
  .on('data', function(data) {
    period.addWorklogItem(createWorklogItem(data));
  })
  .on('error', function(err) {
    console.log('read error', err)
  })
  .on('end', function() {
    syncPeriodToJira(period);
  });
};

// TODO Duplication with lib/convert#isInRange
function isInRange(levelObject, callback) {
  var worklogItem = levelObject.value;
  if ((from.isSame(worklogItem.start, 'day') ||
    from.isBefore(worklogItem.start, 'day'))  &&
    (until.isSame(worklogItem.start, 'day') ||
    until.isAfter(worklogItem.start, 'day'))) {
    callback(null, levelObject);
  } else {
    callback();
  }
}

function createWorklogItem(levelObject) {
  return WorklogItem.fromLevelObject(levelObject);
}

function syncPeriodToJira(period) {
  for (var d in period.getDays()) {
    var day = period.days[d];
    if (cumulated) {
      syncDayCumulated(day);
    } else {
      syncDayNonCumulated(day);
    }
  }
}

function syncDayCumulated(day) {
  var hoursPerTicket = day.getHoursPerTicket();
  for (var h in hoursPerTicket) {
    var log = hoursPerTicket[h];
    var ticket = log.project.jiraTicket;
    var hours = roundHours(log.hours);
    var description = log.description;
    if (haveCumulatedItemsBeenSynced(log)) {
      console.log(day.date + ', ' + ticket + ': already synced.');
      // TODO Maybe later check if source data has been modified after syncing
      // and if we need to update the Jira worklog item.
    } else {
      doHttpPost(day.date, ticket, hours, description, log);
    }
  }
}

function syncDayNonCumulated(day) {
  var items = day.getWorklogItems();
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var ticket = item.project.jiraTicket;
    var hours = roundHours(item.duration);
    var description = item.description;
    if (hasWorklogItemBeenSynced(item)) {
      console.log(day.date + ', ' + ticket + ': already synced.');
      // TODO Maybe later check if source data has been modified after syncing
      // and if we need to update the Jira worklog item.
    } else {
      doHttpPost(day.date, ticket, hours, description, item);
    }
  }}

function haveCumulatedItemsBeenSynced(log) {
  for (var i = 0; i < log.worklogItems.length; i++) {
    var worklogItem = log.worklogItems[i];
    if (hasWorklogItemBeenSynced(worklogItem)) {
      return true;
    }
  }
  return false;
}

function hasWorklogItemBeenSynced(worklogItem) {
  return worklogItem.syncedTo && worklogItem.syncedAt;
}

function doHttpPost(date, ticket, hours, description, logOrItem) {
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
    if (dryRun) {
      console.log('----------------------------------------------------------');
      console.log('(dry run) ' + date + ', ' + ticket + ': ' + hours +
        ' hours\n' + description);
    } else {
      console.log('----------------------------------------------------------');
      console.log(date + ', ' + ticket + ': ' + hours + ' hours\n' +
        description);
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
        markAsSynced(logOrItem, jiraWorklogItemId);
      });
    }
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

function markAsSynced(logOrItem, jiraWorklogItemId) {
  if (typeof logOrItem.worklogItems !== 'undefined') {
    // cumulated
    for (var i = 0; i < logOrItem.worklogItems.length; i++) {
      var worklogItem = logOrItem.worklogItems[i];
      markSingleItemAsSynced(worklogItem, jiraWorklogItemId);
    }
  } else if (typeof logOrItem.id !== 'undefined') {
    // non cumulated
    markSingleItemAsSynced(logOrItem, jiraWorklogItemId);
  }
}

function markSingleItemAsSynced(worklogItem, jiraWorklogItemId) {
  if (!worklogItem.levelKey) {
    console.log('ERROR: A worklog item that has been synchronized to ' +
      'Jira has no LevelDB key');
    return;
  }
  var levelKey = worklogItem.levelKey;
  delete worklogItem.levelKey;
  worklogItem.syncedTo = jiraWorklogItemId;
  worklogItem.syncedAt = moment().toISOString();
  db.put(levelKey, worklogItem);
}

function jiraUrl(path) {
  return url.resolve(jiraApiUrl, path);
}
