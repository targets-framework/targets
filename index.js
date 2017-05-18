#!/usr/bin/env node
'use strict';

// packages
const inquirer = require('inquirer');
const _ = require('lodash');
const argv = require('minimist')(process.argv.slice(2));

// file modules
const Prompts = require('./prompts');
const getPrompts = require('./lib/getPrompts');
const invokeTargets = require('./lib/invokeTargets');
const printResults = require('./lib/printResults');
const config = _.assign({}, require('./lib/config'), argv);

function applyOptions(options) {
    let { targets } = options;
    let resultsPromise;
    if (config._.length) {
        let payload = _.omit(config, '_');
        payload.options = config._;
        payload.targets = targets;
        payload.prompts = getPrompts(payload);
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

function Targets(options){
    return applyOptions(options)
        .then(printResults)
        .catch(console.error);
}

module.exports = Targets;
