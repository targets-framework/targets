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

const filterForPromptsToggle = (prompts, soFar) =>
    prompts.filter((prompt) => {
        const promptsOnIdx = soFar.lastIndexOf(`${OP_PREFIX}optional-prompts-on`);
        const promptsOffIdx = soFar.lastIndexOf(`${OP_PREFIX}optional-prompts-off`);
        return !prompt.optional || (promptsOnIdx > promptsOffIdx);
    });

const nsWhen = (name, prompts) => prompts.map((prompt) => {
        if (typeof prompt.when === 'function') {
            const clonedFn = prompt.when.bind({});
            const when = (answers) => clonedFn(answers[name.split('.').shift()]);
            prompt.when = when;
        }
        return prompt;
    });

function Prompts(queue) {
    const bindingsTo = flattenDeep(queue).reduce((acc, { fn, name }) =>
        (fn[BINDING_FLAG])
            ? [
                  ...acc,
                  name.replace(OP_PREFIX, '').split(FN_DELIM).pop().split(ARG_DELIM).pop()
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
