#!/usr/bin/env node
'use strict';

// packages
const inquirer = require('inquirer');
const _ = require('lodash');
const requireDir = require('require-dir');
const argv = require('minimist')(process.argv.slice(2))

// file modules
const prompts = require('./prompts');
const invokePlugins = require('./lib/invokePlugins');
const printResults = require('./lib/printResults');

function applyOptions(plugins) {
    let resultsPromise;
    if (argv._.length) {
        let payload = _.omit(argv, '_');
        payload.options = argv._;
        payload.plugins = plugins;
        resultsPromise = invokePlugins(payload);
    } else {
        resultsPromise = inquirer.prompt(prompts)
            .then((payload) => {
                payload.plugins = plugins;
                return invokePlugins(payload);
            });
    }
    return resultsPromise;
}

function Gnost(plugins){
    return applyOptions(plugins).then(printResults);
}

module.exports = Gnost;
