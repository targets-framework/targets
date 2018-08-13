'use strict';

module.exports = Prompts;

const {
    uniqBy,
    flattenDeep
} = require('lodash');

const {
    OP_DELIM,
    OP_ARG_DELIM,
    OP_PREFIX
} = require('./Operation');

const { hasTag } = require('./tags');

const { cloneFn } = require('./util');

const filterForPromptsToggle = (prompts, soFar) =>
    prompts.filter((prompt) => {
        const optionalPromptsOnIdx = soFar.lastIndexOf(`${OP_PREFIX}optional-prompts/on`);
        const optionalPromptsOffIdx = soFar.lastIndexOf(`${OP_PREFIX}optional-prompts/off`);
        const promptsOnIdx = soFar.lastIndexOf(`${OP_PREFIX}prompts/on`);
        const promptsOffIdx = soFar.lastIndexOf(`${OP_PREFIX}prompts/off`);
        return !(promptsOnIdx < promptsOffIdx) && (!prompt.optional || (optionalPromptsOnIdx > optionalPromptsOffIdx));
    });

const nsWhen = (name, prompts) => prompts.map((prompt) => {
        if (typeof prompt.when === 'function') {
            const clonedFn = cloneFn(prompt.when);
            const when = (answers) => clonedFn(answers[name.split('.').shift()]);
            prompt.when = when;
        }
        return prompt;
    });

function Prompts(queue) {
    const bindingsTo = flattenDeep(queue).reduce((acc, { fn, name }) =>
        (hasTag(fn, 'binding'))
            ? [
                  ...acc,
                  name.replace(OP_PREFIX, '').split(OP_DELIM).pop().split(OP_ARG_DELIM).pop()
              ]
            : acc,
        []);
    return uniqBy(flattenDeep(queue)
        .reduce((acc, entry, idx, col) => {
            const soFar = col.slice(0, idx).map(({ name }) => name);
            const filtered = (entry.prompts)
                ? filterForPromptsToggle(entry.prompts, soFar)
                : [];
            const namespaced = nsWhen(entry.name, filtered);
            return [
                ...acc,
                ...namespaced
            ];
        }, []), 'name')
        .filter((p) => !bindingsTo.includes(p.name));
}
