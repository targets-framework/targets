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

// filter which inspects everything up to this point in the queue and determines
// if a prompt toggle operation indicates that we should filter a given prompt
// TODO: I believe there may be cases where this is too aggressive since we
// making prompts unique name before this step in processing.
const filterForPromptsToggle = (prompts, soFar) =>
    prompts.filter((prompt) => {
        const optionalPromptsOnIdx = soFar.lastIndexOf(`${OP_PREFIX}optional-prompts/on`);
        const optionalPromptsOffIdx = soFar.lastIndexOf(`${OP_PREFIX}optional-prompts/off`);
        const promptsOnIdx = soFar.lastIndexOf(`${OP_PREFIX}prompts/on`);
        const promptsOffIdx = soFar.lastIndexOf(`${OP_PREFIX}prompts/off`);
        return !(promptsOnIdx < promptsOffIdx) && (!prompt.optional || (optionalPromptsOnIdx > optionalPromptsOffIdx));
    });

const Namespace = (name, prompts) => prompts.map((prompt) => {
        if (typeof prompt.when === 'function') {
            const clonedWhen = cloneFn(prompt.when);
            const ns = name.split('.').shift();
            const when = (answers) => clonedWhen(answers.config[ns]);
            prompt.when = when;
        }
        return prompt;
    });

function Prompts(queue) {

    // reduces to an array of names which have been bound via the `@bind-to` operator
    const bindingsTo = flattenDeep(queue).reduce((acc, { fn, name }) =>
        (hasTag(fn, 'binding')) // TODO: create a specific bind-to tag to avoid collisions
            ? [
                  ...acc,
                  name.replace(OP_PREFIX, '').split(OP_DELIM).pop().split(OP_ARG_DELIM).pop().split('.').slice(1).join('.')
              ]
            : acc,
        []);

    // processes prompts as follow:
    //   - makes unique by name
    //   - amends all `when` functions to consider namespace
    //   - considers any delcared prompt toggle operations and filters prompts accordingly
    //   - filters prompts which are declared as fulfilled by `bind-to`
    return uniqBy(flattenDeep(queue)
        .reduce((acc, entry, idx, col) => {
            const soFar = col.slice(0, idx).map(({ name }) => name);
            const filtered = (entry.prompts)
                ? filterForPromptsToggle(entry.prompts, soFar)
                : [];
            const namespaced = Namespace(entry.name, filtered);
            return [
                ...acc,
                ...namespaced
            ];
        }, []), 'name')
        .filter((p) => !bindingsTo.includes(p.name));
}
