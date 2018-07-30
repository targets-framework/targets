'use strict';

module.exports = Prompts;

const {
    uniqBy,
    flattenDeep
} = require('lodash');

const {
    BINDING_FLAG,
    FN_DELIM,
    ARG_DELIM,
    OP_PREFIX
} = require('./constants');

function Prompts(queue) {
    // The time complexity of this function is completely insane. There must be a better way. Indicative of a design flaw and warrants further scrutiny.
    const bindingsTo = flattenDeep(queue).reduce((acc, { fn, name }) =>
        (fn[BINDING_FLAG])
            ? [ ...acc, name.replace(OP_PREFIX, '').split(FN_DELIM).pop().split(ARG_DELIM).pop() ]
            : acc,
        []);
    return uniqBy(flattenDeep(queue)
        .reduce((acc, entry, idx, arr) => {
            if (entry.prompts) {
                const filteredPrompts = entry.prompts.filter((prompt) => {
                    const namesSoFar = arr.slice(0, idx).map(({ name }) => name);
                    if (!prompt.optional || namesSoFar.lastIndexOf(`${OP_PREFIX}prompts-on`) > namesSoFar.lastIndexOf(`${OP_PREFIX}prompts-off`)) return true;
                });
                const prompts = filteredPrompts.map((prompt) => {
                    if (typeof prompt.when === 'function') {
                        const clonedFn = prompt.when.bind({});
                        const when = (answers) => clonedFn(answers[entry.name.split('.').shift()]);
                        prompt.when = when;
                    }
                    return prompt;
                });
                return [ ...acc, ...prompts ];
            }
            return acc;
            },
        []), 'name')
        .filter((p) => !bindingsTo.includes(p.name));
}
