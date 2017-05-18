'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const inquirer = require('inquirer');

module.exports = invokeTargets;

function invokeTargets(payload) {
    const targetArgs = _.assign({}, _.omit(payload, [ 'targets' ]));

    let pendingAnswers;

    if (!_.isEmpty(payload.prompts)) {
        pendingAnswers = inquirer.prompt(payload.prompts).then((answers) => _.assign(targetArgs, answers));
    } else {
        pendingAnswers = Promise.resolve(targetArgs);
    }

    return pendingAnswers.then((answers) => {
        const promiseMap = payload.options.reduce((acc, optionName) => {
            const target = payload.targets[optionName];
            if (_.isFunction(target)) {
                acc[optionName] = Promise.resolve(target(answers)).catch(() => 'unavailable');
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
