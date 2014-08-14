Toggl2Jira Sync
===============

Makeshift synchronization from Toggl to Jira.

Current status: 

* Fetches worklog items from Toggl
* Optionally cumulates/aggregates entries per Jira issue per day
* Creates worklog items in Jira

Known issues:

* User experience is still pretty rough. It is a command line tool. You will need to fiddle with a config file. Also, a full synchronization currently requires you to execute three separate commands. 
* Updating Jira worklog items if you change an item in Toggl after it has alread been synchronized to Jira. If you do not use cumulated synchronization, new Toggl items will be synchronized to Jira and items that have already been synchronized are ignored, even if they have changed in the meantime. If you synchronize with cumulation per Jira issue per day turned on, you probably should not synchronize a date again, once it has been synchronized.

Usage
-----

* Install Node.js. Toggl2Jira is a command line tool based on Node.js. Any 0.10 version should do. I did not test 0.11.
* Clone https://github.com/basti1302/toggl2jira.git
* Open a shell and cd to the directory you cloned to.
* `npm install`
    * This will install all dependencies. Since Toggl2Jira uses LevelDB to store data, this will also install LevelDB, which has binary depencies. This means that some LevelDB stuff will be compiled during the install using node-gyp. This can sometimes cause problems on troll OSes like CentOS. Windows should work, but you might have to have a look at https://github.com/TooTallNate/node-gyp#installation. YMMV, good luck. Debian based systems and OS X should have no trouble.
* Copy config.json.template to config.json
* Edit config.json
    * `range` provides a date filter for most operations (fetching data from Toggl for example). You probably want to change that each time you run a synchronization. The date range is inclusice. Choose the same date for `from` and `until` to just synchronize one day. The format is `YYYY-MM-DD`.
    * `toggl` is where your settings for calling the Toggl API go. 
        * `apiToken`: Go to https://www.toggl.com/app/profile while logged in to Toggl, the API token is at the bottom of the page
        * `userAgent`: Should be the e-mail address you registered at Toggl
        * `workspaceId`: While logged in at Toggl, click on the hamburger menu, then "Workspace Settings". Your workspace id is the last part of the URL. (It should be numeric and probably have six digits.)
    * `jira` is where your settings for accessing Jira go.
        * `baseUrl`: The URL for Jira
        * `username`: Your Jira username
        * `password`: Your Jira password
        * `cumulated`: Optional, defaults to `true`. If turned on, Toggl items will be cumulated per day, per Jira issue. Otherwise each Toggl item will create a single worklog item in Jira.
        * `dryRun`: Optional, defaults to false. If turned on, Toggl2Jira will not create Jira worklog items at all but only print what it would create.
    * `projects`: This is where you tell Toggl2Jira which Toggl projects belong to which Jira issues. `projects` is an array and each object should have three properties:
        * `togglProjectId`: The toggl project id. You need to use projects when logging your work in Toggl and each Toggl project should correspond to one Jira issue. Only Toggl worklog items with a project will be synchronized to Jira. You can find the Toggl project ID by clicking on Projects while being logged in to Toggl and then on an individual project. The URL should look like this: `https://www.toggl.com/app/projects/615471/edit/5169336`. The last part of the URL (5169336) is the Toggl project ID. (The numeric part in the middle of the URL is your workspace ID.)
        * `jiraTicket`: The issue ID in Jira that corresponds to this project.
        * `description`: Some free text. I mostly use the title of the Toggl project or the title of the Jira issue here, but it's up to you.
* Remark: Toggl2Jira uses nconf to handle configuration values. This means that you can override any setting in config.json with command line switches like this `--range:from 2014-08-15 --jira:cumulate false --jira:dryRun` or with environment variables. Command line switches take precedence over environment variables and environment variables take precedence over settings in config.json. See https://github.com/flatiron/nconf for details.

To actually run a synchronization, you need to execute three steps:

* `node fetch`: Fetches all items in the configured date range from Toggl. If they have been fetched before, old items will be overwritten. But: If items have been deleted in Toggl and you fetch the corresponding date range again, Toggl2Jira will not delete the old items in its internal storage. You can delete everything ever fetched from Toggl by deleting the directory `data/toggl` and do a fresh fetch, if needed.
* `node convert`: Converts all items fetched from Toggl to a format more suitable to synchronize it to Jira. (I know, it sucks to have to do this as a seperate steps. I think we can get rid of that soonish.)
* `node update_jira`: Creates worklog items in Jira for everything that has been converted. Also marks the corresponding items as synchronized. If you run `node update_jira` again, they won't be synchronized again.