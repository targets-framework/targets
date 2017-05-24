'use strict';

const chalk = require('chalk');
const _ = require('lodash');

module.exports = printResults;

function printResults(payload) {
    if (_.isEmpty(payload.results)) {
        console.log(chalk.blue("Nothing to do."));
    }
    _.forIn(payload.results, _.partial(printResult, payload.targets));
    return payload;
}

function printResult(targets, result, key) {
    if (result) console.log(`[${chalk.yellow(targets[key].label || targets[key].name)}]`, result);
}

