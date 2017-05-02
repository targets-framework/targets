'use strict';

const chalk = require('chalk');
const _ = require('lodash');
const requireDir = require('require-dir');

module.exports = printResults;

function printResults(payload) {
    if (!_.isEmpty(payload.results)) {
        console.log(chalk.blue("Here's the information you requested:"));
    } else {
        console.log(chalk.blue("Nothing to do."));
    }
    _.forIn(payload.results, _.partial(printResult, payload.plugins));
    return payload;
}

function printResult(plugins, result, key) {
    console.log(`[${chalk.yellow(plugins[key].label)}]`, result);
}

