#!/usr/bin/env node
'use strict';

const _ = require('lodash');
const chalk = require('chalk');
const EventEmitter = require('events').EventEmitter;
const LineWrapper = require('stream-line-wrapper');
const Promise = require('bluebird');
const Answers = require('answers');
const inquirer = require('inquirer');

function handleStream(stream, target, targetName) {
    const prefix = `[${chalk.yellow(target.label || targetName)}] `;
    console.log(`${prefix}listening`);
    const lineWrapper = new LineWrapper({ prefix });
    stream.stdout.pipe(lineWrapper).pipe(process.stdout);
    stream.stderr.pipe(process.stderr);
    stream.on('error', console.error);
}

function getChoices(config) {
    const { _targets } = config;
    const getterPairs = _.toPairs(_targets);
    return _.map(getterPairs, (pair) => {
        const getter = pair[1];
        const getterKey = pair[0];
        const option = {
            name: getter.label || getterKey,
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
            .then((results) => {
                config._ = results.targetNames;
                return config;
            });
    } else {
        return config;
    }
}

function invokeSequentialTargets(config) {
    const { _targets } = config;
    const targetNames = config._forks.sequential;

    function targetReducer(acc, targetName) {
        const target = _targets[targetName];
        if (_.isFunction(target)) {
            let pendingResult = Promise.resolve(target(config[targetName] || {}))
                .then((result) => {
                    if (result instanceof EventEmitter) {
                        handleStream(result, target, targetName);
                        return { _targets, targetName, result: null };
                    } else {
                        return { _targets, targetName, result };
                    }
                })
                .catch(() => {
                    return { _targets, targetName, result: 'unavailable' };
                });
            acc.push(pendingResult);
        } else {
            console.log('no target found');
        }
        return acc;
    }

    const pendingTargets = _.reduce(targetNames, targetReducer, []);

    return Promise.each(pendingTargets, print);
}

function print(data) {
    const label = data._targets[data.targetName].label || data.targetName;
    if (data && data.result) console.log(`[${chalk.yellow(label)}]`, data.result.split('\n').join(`\n[${chalk.yellow(label)}] `));
    return;
}

function invokeParallelTargets(config) {
    const { _targets } = config;
    const targetNames = config._forks.parallel;

    function targetReducer(acc, targetName) {
        const target = _targets[targetName];
        if (_.isFunction(target)) {
            let pendingResult = Promise.resolve(target(config[targetName] || {}))
                .then((result) => {
                    if (result instanceof EventEmitter) {
                        handleStream(result, target, targetName);
                        return { _targets, targetName, result: null };
                    } else {
                        return { _targets, targetName, result };
                    }
                })
                .catch(() => {
                    return { _targets, targetName, result: 'unavailable' };
                })
                .then(print);
            acc.push(pendingResult);
        } else {
            console.log('no target found');
        }
        return acc;
    }

    const pendingTargets = _.reduce(targetNames, targetReducer, []);

    return Promise.all(pendingTargets);
}

function getMissing(config) {
    const { _targets, _answers } = config;
    const targetNames = flattenTargetNames(config._);
    function promptReducer(acc, targetName) {
        const namespace = targetName.split('.').shift();
        const target = _targets[targetName] || {};
        const allTargetPrompts = target.prompts || [];
        const targetPrompts = _.map(allTargetPrompts, (prompt) => {
            if (_.isObject(prompt)) {
                if (!prompt.type) prompt.type = "input";
                _.set(prompt, 'name', `${namespace}.${prompt.name}`);
            } else if (_.isString(prompt)) {
                let name = `${namespace}.${prompt}`;
                prompt = {
                    type: 'input',
                    name,
                    message: name
                };
            } else {
                throw new Error(`invalid prompt in ${targetName}`);
            }
            return prompt;
        });
        acc = acc.concat(targetPrompts);
        return acc;
    }
    const prompts = _.uniqBy(_.reduce(targetNames, promptReducer, []), 'name');
    _answers.configure('prompts', prompts);
    return _answers.get().then((c) => {
        c._ = _.isEmpty(config._) ? c._ : config._;
        return forkTargets(c);
    });
}

function flattenTargetNames(targetNames) {
    return _.reduce(targetNames, (acc, targetName) => [ ...acc, ...targetName.split(',') ], []);
}

function forkTargets(config) {
    const targets = _.reduce(config._, (acc, targetName) => {
        if (targetName.indexOf(',') >= 0) {
            acc.sequential = [ ...acc.sequential, ...targetName.split(',') ];
        } else {
            acc.parallel.push(targetName);
        }
        return acc;
    }, { sequential: [], parallel: [] });

    config._forks = {
        parallel: targets.parallel,
        sequential: targets.sequential
    };

    return config;
}

function Targets(options = {}) {
    const { name, targets } = options;
    const answers = Answers({ name });

    function augment(config = {}) {
        config._targets = targets;
        config._answers = answers;
        return config;
    }

    function invokeTargets(config) {
        const chains = [];

        if (!_.isEmpty(config._forks.parallel)) {
            chains.push(Promise.resolve(config)
                .then(invokeParallelTargets)
                .catch(console.error));
        }

        if (!_.isEmpty(config._forks.sequential)) {
            chains.push(Promise.resolve(config)
                .then(invokeSequentialTargets)
                .catch(console.error));
        }

        return Promise.all(chains);
    }

    return answers.get()
        .then(augment)
        .then(getInitialPrompt)
        .then(getMissing)
        .then(augment)
        .then(invokeTargets);

}

module.exports = Targets;
