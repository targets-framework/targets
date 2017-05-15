'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const inquirer = require('inquirer');

module.exports = invokeTargets;

function invokeTargets(payload) {
    const promises = payload.options.map((optionName) => {
        const wrapper = {};
        const target = payload.targets[optionName];
        const targetArgs = _.assign({}, _.omit(payload, [ 'targets' ]));

        if (_.isFunction(target)) {
            let missingOptionPrompts = [];

            if (_.isArray(target.prompts)) {

                missingOptionPrompts = _.compact(_.map(target.prompts, (prompt) => {
                    if (_.has(targetArgs, [ optionName, prompt.name ])) {
                        _.set(targetArgs, prompt.name, targetArgs[optionName][prompt.name]);
                        return null;
                    } else {
                        return prompt;
                    }
                }));
            }

            if (!_.isEmpty(missingOptionPrompts)) {
                wrapper[optionName] = inquirer.prompt(missingOptionPrompts)
                    .then((answers) => {
                        return target(_.assign(targetArgs, answers));
                    });
            } else {
                wrapper[optionName] = Promise.resolve(target(targetArgs)).catch(() => 'unavailable');
            }

        } else {
            console.log('no target found');
        }
        return wrapper;
    });
    return Promise.reduce(promises, Object.assign, {})
        .props()
        .then((results) => {
            payload.results = results;
            return payload;
        });
}
