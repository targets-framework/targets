'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const inquirer = require('inquirer');
const EventEmitter = require('events').EventEmitter;
const LineWrapper = require('stream-line-wrapper');
const chalk = require('chalk');

module.exports = invokeTargets;

function handleStream(stream, target) {
    const prefix = `[${chalk.yellow(target.label || target.name)}] `;
    console.log(`${prefix}listening`);
    const lineWrapper = new LineWrapper({ prefix });
    stream.stdout.pipe(lineWrapper).pipe(process.stdout);
    stream.stderr.pipe(process.stderr);
    stream.on('error', console.error);
}

function invokeTargets(payload) {
    const targets = _.result(payload, 'targets', {});
    const targetArgs = _.assign({}, _.omit(payload, [ 'targets' ]));

    let pendingAnswers;

    if (!_.isEmpty(payload.prompts)) {
        pendingAnswers = inquirer.prompt(payload.prompts).then((answers) => _.assign(targetArgs, answers));
    } else {
        pendingAnswers = Promise.resolve(targetArgs);
    }

    return pendingAnswers.then((answers) => {
        const promiseMap = payload.options.reduce((acc, optionName) => {
            const target = targets[optionName];
            if (_.isFunction(target)) {
                let targetResponse = target(answers);
                if (targetResponse instanceof EventEmitter) {
                    handleStream(targetResponse, target);
                } else {
                    acc[optionName] = Promise.resolve(targetResponse).catch(() => 'unavailable');
                }
            } else {
                console.log('no target found');
            }
            return acc;
        }, {});
        return Promise.props(promiseMap)
            .then((results) => {
                payload.results = results;
                return payload;
            });
    });
}
