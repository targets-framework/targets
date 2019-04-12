'use strict';

module.exports = Prompts;

// Notes:
// This file makes "Big O" very very sad. The time complexity is
// shameful. Wouldn't it be nice if we were about generate some sort of
// "queue comprehension" for this, and for other places in the code base
// where we need to know what is going to happen before it happens?

const {
    uniqBy,
    flattenDeep
} = require('lodash');

const {
    OP_DELIM,
    OP_ARG_DELIM,
    OP_PREFIX
} = require('./Operation');

const Store = require('./Store');

const { hasTag } = require('./tags');

const { cloneFn } = require('./util');

const flatten = require('flat');
 
// filter which inspects everything up to this point in the queue and determines
// if a prompt toggle operation indicates that we should filter a given prompt
// TODO: I believe there may be cases where this is too aggressive since we
// making prompts unique name before this step in processing.
const filterPrompts = ({ prompts = [], config = {} }, soFar) =>
    prompts.filter((prompt) => {
        const name = (typeof prompt === 'string'
            ? prompt
            : prompt.name).split('.').pop();
        const hasConfig = Object.keys(config).reduce((acc, ck) => acc || ck == name, false);
        const optionalPromptsOnIdx = soFar.lastIndexOf(`${OP_PREFIX}optional-prompts/on`);
        const optionalPromptsOffIdx = soFar.lastIndexOf(`${OP_PREFIX}optional-prompts/off`);
        const promptsOnIdx = soFar.lastIndexOf(`${OP_PREFIX}prompts/on`);
        const promptsOffIdx = soFar.lastIndexOf(`${OP_PREFIX}prompts/off`);
        return !hasConfig && (!(promptsOnIdx < promptsOffIdx) && (!prompt.optional || (optionalPromptsOnIdx > optionalPromptsOffIdx)));
    });

const Namespace = (name, prompts) => prompts.map((prompt) => {
        if (typeof prompt.when === 'function') {
            const clonedWhen = cloneFn(prompt.when);
            const ns = name.split('.').shift();
            const when = (answers) => clonedWhen(answers[ns]);
            prompt.when = when;
        }
        return prompt;
    });

function Prompts(queue) {

    // reduces to an array of names which have been bound via the `@bind` operator.
    //
    // TODO:
    // issues here which should be addressed..
    //   - bindings order is not considered. if a prompt's config path is referenced before a related binding occurs we will have a false positive and the user will not be prompted.
    //   - base merges are considered by inspecting the keypaths of the value found at fromPath. bindings which affect fromPath's value however, are not considered. in this case, we will have a false negative and the user will be prompted.
    //
    const bindingsTo = flattenDeep(queue).reduce((acc, { fn, name }) => {
        if (hasTag(fn, 'binding')) {
            const [ fromPath, toPath = '' ] = name.replace(OP_PREFIX, '').split(OP_DELIM).pop().split(OP_ARG_DELIM);
            if (toPath === '' || toPath.startsWith('config')) {
                if ([ '', 'config' ].includes(toPath)) {
                    const fromValue = Store.Get()(fromPath, {});
                    const fromKeypaths = Object.keys(flatten(fromValue));
                    return [
                        ...acc,
                        ...fromKeypaths
                    ];
                } else {
                    const boundTo = toPath.split('.').slice(1).join('.');
                    return [
                        ...acc,
                        boundTo
                    ];
                }
            }
        }
        return acc;
    }, []);

    // processes prompts as follow:
    //   - makes unique by name
    //   - amends all `when` functions to consider namespace
    //   - considers any delcared prompt toggle operations and filters prompts accordingly
    //   - filters prompts which are declared as fulfilled by `@bind`
    return uniqBy(flattenDeep(queue)
        .reduce((acc, entry, idx, col) => {
            const soFar = col.slice(0, idx).map(({ name }) => name);
            const filtered = (entry.prompts)
                ? filterPrompts(entry, soFar)
                : [];
            const namespaced = Namespace(entry.name, filtered);
            return [
                ...acc,
                ...namespaced
            ];
        }, []), 'name')
        .filter((p) => !bindingsTo.includes(p.name))
        .map((p) => ({ ...p, name: `config.${p.name}` }));
}
