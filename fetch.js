'use strict';

/*
 * Fetches data from Toggl.
 */

require('./lib/init_nconf');

var fetchTogglReport = require('./lib/fetch_toggl_report');

fetchTogglReport();
