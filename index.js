#!/usr/bin/env node
'use strict';

// packages
const inquirer = require('inquirer');
const _ = require('lodash');
const argv = require('minimist')(process.argv.slice(2));

// file modules
const Prompts = require('./prompts');
const invokeTargets = require('./lib/invokeTargets');
const printResults = require('./lib/printResults');

function applyOptions(targets) {
    let resultsPromise;
    if (argv._.length) {
        let payload = _.omit(argv, '_');
        payload.options = argv._;
        payload.targets = targets;
        resultsPromise = invokeTargets(payload);
    } else {
        resultsPromise = inquirer.prompt(Prompts(targets))
            .then((payload) => {
                payload.targets = targets;
                return invokeTargets(payload);
            });
    }
    return resultsPromise;
}

function Targets(targets){
    return applyOptions(targets)
        .then(printResults)
        .catch(console.error);
}

module.exports = Targets;
