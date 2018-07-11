#!/usr/bin/env node
'use strict';

const os = require('os');
const _ = require('lodash');
const chalk = require('chalk');
const EventEmitter = require('events').EventEmitter;
const { ChildProcess } = require('child_process');
const LineWrapper = require('stream-line-wrapper');
const Promise = require('bluebird');
const Answers = require('answers');
const inquirer = require('inquirer');
const cloneDeep = require('clone-deep');

const ansiLabel = (label) => `${chalk.reset.white('[')}${chalk.reset.yellow(label)}${chalk.reset.white(']')}`;

const Printer = (label) => (value) => {
    console.log(ansiLabel(label),
        ((_.isString(value))
            ? value
            : JSON.stringify(value, null, 4))
            .replace(new RegExp(`^${os.EOL}*`), '')
            .replace(new RegExp(`${os.EOL}*$`), '')
            .split(os.EOL)
            .join(`\n${ansiLabel(label)} `));
};

function handleStream(stream, target, targetName) {
    const label = ansiLabel(target.label || targetName);
    console.log(label, 'listening');
    const lineWrapper = new LineWrapper({ prefix: `${label} ` });
    stream.stdout.pipe(lineWrapper).pipe(process.stdout);
    stream.stderr.pipe(process.stderr);
    return stream.then
        ? stream
        : new Promise((resolve, reject) => {
            stream.on('error', (e) => { console.log('something bad happened', e); reject(e); });
            stream.on('end', resolve);
        });
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
                message: 'Please select your targets',
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

function TargetProxyHandler(config) {
    return  {
        get: (obj, prop) => {
            return obj[prop] || config[prop];
        },
        has: (obj, prop) => {
            return !!(obj[prop] || config[prop]);
        },
        ownKeys: (obj) => {
            return [ ...new Set([ ...Object.keys(obj), ...Object.keys(config) ]) ];
        },
        getOwnPropertyDescriptor: () => {
            return { enumerable: true, configurable: true };
        }
    };
}

function invokeSequentialTargets(config) {
    const { _targets } = config;
    const targetNames = config._forks.sequential;

    function targetReducer(acc, targetName) {
        const target = _targets[targetName];
        if (_.isFunction(target)) {
            let namespace = targetName.split('.').shift();
            let targetConfig = config[namespace] || {};
            let targetConfigProxy = new Proxy(targetConfig, TargetProxyHandler(config));
            let targetOptions = { _targets, target, targetName, targetConfigProxy };
            acc.push(targetOptions);
        } else {
            console.log(ansiLabel('Target Not Found'), targetName);
        }
        return acc;
    }

    const targetOptions = _.reduce(targetNames, targetReducer, []);

    return Promise.reduce(targetOptions, (acc, { _targets, target, targetName, targetConfigProxy }) => {
        let returnValue = target(targetConfigProxy, Printer(target.label || targetName), acc);
        if (returnValue instanceof EventEmitter || returnValue instanceof ChildProcess) {
            returnValue = handleStream(returnValue, target, targetName);
        }
        return Promise.resolve(returnValue)
            .then((result) => {
                if (returnValue instanceof EventEmitter || returnValue instanceof ChildProcess) {
                    return { _targets, targetName, result: null };
                } else {
                    return { _targets, targetName, result };
                }
            }).catch((e) => {
                if (process.env.DEBUG) console.error(e);
                return { _targets, targetName, result: 'unavailable' };
            }).then((result) => {
                acc = { targetName, result: result.result };
                print(result);
                return acc;
            });
    }, null);
}

function print(data) {
    const label = data._targets[data.targetName].label || data.targetName;
    if (data && data.result) Printer(label)(data.result);
    return;
}

function invokeParallelTargets(config) {
    const { _targets } = config;
    const targetNames = config._forks.parallel;

    function targetReducer(acc, targetName) {
        const target = _targets[targetName];
        if (_.isFunction(target)) {
            let namespace = targetName.split('.').shift();
            let targetConfig = config[namespace] || {};
            let targetConfigProxy = new Proxy(targetConfig, TargetProxyHandler(config));
            let returnValue = target(targetConfigProxy, Printer(target.label || targetName));
            if (returnValue instanceof EventEmitter || returnValue instanceof ChildProcess) {
                returnValue = handleStream(returnValue, target, targetName);
            }
            let pendingResult = Promise.resolve(returnValue)
                .then((result) => {
                    if (returnValue instanceof EventEmitter || returnValue instanceof ChildProcess) {
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
        const targetConfig = config[namespace] || {};
        const targetConfigProxy = new Proxy(targetConfig, TargetProxyHandler(config));
        let allTargetPrompts = cloneDeep(target.prompts) || [];
        if (_.isFunction(allTargetPrompts)) {
            allTargetPrompts = allTargetPrompts(targetConfig);
        }
        const targetPrompts = _.reduce(allTargetPrompts, (remainingPrompts, prompt) => {
            let originalPromptName;
            if (_.isObject(prompt)) {
                if (!prompt.type) prompt.type = "input";
                originalPromptName = prompt.name;
                _.set(prompt, 'name', `${namespace}.${prompt.name}`);
                const prefix = ansiLabel(`${namespace}.${originalPromptName}`);
                const message = _.get(prompt, 'message');
                _.set(prompt,
                    'message',
                    ((typeof message === 'function')
                        ? (answers) => (`${prefix} ${message(answers[namespace])}`)
                        : `${prefix} ${message}`));
            } else if (_.isString(prompt)) {
                originalPromptName = prompt;
                let name = `${namespace}.${prompt}`;
                prompt = {
                    type: 'input',
                    name,
                    message: name
                };
            } else {
                throw new Error(`invalid prompt in ${targetName}`);
            }
            return (prompt.optional || targetConfigProxy[originalPromptName])
                ? remainingPrompts
                : [ ...remainingPrompts, prompt ];
        }, []);
        return [ ...acc, ...targetPrompts ];
    }
    const allPrompts = _.reduce(targetNames, promptReducer, []);
    const prompts = _.uniqBy(allPrompts, 'name');
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

    function processGroups(config = {}) {
        if (_.isEmpty(config._)) {
            _.each(targets, (target, prop) => {
                if (_.isArray(target) || _.isString(target)) {
                    delete targets[prop];
                }
            });
        } else {
            config._ = _.reduce(config._, (acc, targetName) => {
                const target = targets[targetName]; 
                if (_.isArray(target)) {
                    const result = [ ...acc, ...target ];
                    return result;
                } else if (_.isString(target)) {
                    const result = [ ...acc, target ];
                    return result;
                } else {
                    return [ ...acc, targetName ];
                }
            }, []);
        }
        return config;
    }

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
        .then(processGroups)
        .then(augment)
        .then(getInitialPrompt)
        .then(getMissing)
        .then(augment)
        .then(invokeTargets);

}

module.exports = Targets;
