#!/usr/bin/env node
'use strict';

const _ = require('lodash');
const chalk = require('chalk');
const EventEmitter = require('events').EventEmitter;
const LineWrapper = require('stream-line-wrapper');
const Promise = require('bluebird');
const Answers = require('answers');
const printResults = require('./lib/printResults');
const inquirer = require('inquirer');

function handleStream(stream, target) {
    const prefix = `[${chalk.yellow(target.label || target.name)}] `;
    console.log(`${prefix}listening`);
    const lineWrapper = new LineWrapper({ prefix });
    stream.stdout.pipe(lineWrapper).pipe(process.stdout);
    stream.stderr.pipe(process.stderr);
    stream.on('error', console.error);
}

function getChoices(config) {
    const { targets } = config;
    const getterPairs = _.toPairs(targets);
    return _.map(getterPairs, (pair) => {
        const getter = pair[1];
        const getterKey = pair[0];
        const option = {
            name: getter.label || getter.name,
            value: getterKey
        };
        return option;
    });
}

function getInitialPrompt(config) {
    if (_.isEmpty(config._)) {
        let prompts = [
            {
                type: 'checkbox',
                name: 'targetNames',
                message: 'What information would you like to see?',
                choices: getChoices(config)
            }
        ];
        return inquirer.prompt(prompts)
            .then((answers) => {
                config._ = answers.targetNames;
                return config;
            });
    } else {
        return config;
    }
}

function getConfig(options = {}) {

    const { name, targets } = options;
    const answers = Answers({ name });

    function getMissing(config) {
        const { targets } = config;
        const targetNames = config._;
        function promptReducer(acc, targetName) {
            const namespace = targetName.split('.').shift();
            const target = _.result(targets, targetName, {});
            const allTargetPrompts = _.result(target, 'prompts', []);
            const targetPrompts = _.map(allTargetPrompts, (prompt) => {
                _.set(prompt, 'name', `${namespace}.${prompt.name}`);
                return prompt;
            });
            acc = acc.concat(targetPrompts);
            return acc;
        }
        const prompts = _.uniqBy(_.reduce(targetNames, promptReducer, []), 'name');
        answers.configure('prompts', prompts);
        return answers.get().then((c) => {
            c._ = _.isEmpty(targetNames) ? c._ : targetNames;
            return c;
        });
    }

    function addTargets(config) {
        config.targets = targets;
        return config;
    }

    return answers.get()
        .then(addTargets)
        .then(getInitialPrompt)
        .then(getMissing)
        .then(addTargets);
}

function invokeTargets(config) {
    const { targets } = config;
    const targetNames = config._;
    const pendingTargets = _.reduce(targetNames, (acc, targetName) => {
        const target = targets[targetName];
        if (_.isFunction(target)) {
            let targetResponse = target(config);
            if (targetResponse instanceof EventEmitter) {
                handleStream(targetResponse, target);
                acc[targetName] = Promise.resolve(null);
            } else {
                acc[targetName] = Promise.resolve(targetResponse).catch(() => 'unavailable');
            }
        } else {
            console.log('no target found');
        }
        return acc;
    }, {});
    return Promise.props(pendingTargets)
        .then((results) => {
            config.results = results;
            return config;
        });
}

function Targets(options = {}) {
    return getConfig(options)
        .then(invokeTargets)
        .then(printResults)
        .catch(console.error);
}

module.exports = Targets;
