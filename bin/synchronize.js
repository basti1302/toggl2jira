#!/usr/bin/env bash

bin_path=`dirname $0`
pushd $bin_path/.. > /dev/null

node fetch && node convert && node update_jira
