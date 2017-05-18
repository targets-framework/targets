'use strict';

const _ = require('lodash');

module.exports = getPrompts;

function getPrompts(payload) {
    const prompts = payload.options.map((optionName) => {
        const target = payload.targets[optionName];
        const targetArgs = _.assign({}, _.omit(payload, [ 'targets' ]));
        let missingOptionPrompts = [];
        if (_.isFunction(target) && _.isArray(target.prompts)) {
            missingOptionPrompts = _.compact(_.map(target.prompts, (prompt) => {
                const namespace = optionName.split('.').shift();
                if (!_.has(targetArgs, [ optionName, prompt.name ]) && !_.has(targetArgs, [ namespace, prompt.name])) {
                    _.set(prompt, 'name', `${namespace}.${prompt.name}`);
                    return prompt;
                }
            }));
        }
        return missingOptionPrompts;
    });
    return _.uniqBy(_.flatten(prompts), 'name');
}
