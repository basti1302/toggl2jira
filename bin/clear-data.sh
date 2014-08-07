#!/usr/bin/env bash

bin_path=`dirname $0`
pushd $bin_path/.. > /dev/null

rm -rf data/toggl
rm -rf data/worklog
