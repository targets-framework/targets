'use strict';

module.exports = Prompts;

/**
 * NB:
 * This file makes "Big O" very very sad. The time complexity is shameful.
 *
 * What's worse, this implementation fails to solve the problems it's set out
 * to solve. It mostly works, as a stop gap, but the approach should be deeply
 * reconsidered.
 *
 * The goal is to present the user with all the appropriate compile-time prompts
 * up front before execution begins. The approach taken herein attempts to
 * scrutinize the existing queue and figure out all future transitional states
 * of the machine and what those states imply about the need to prompt the
 * user. It's an exercise in futility. And an expensive one at that.
 *
 * Wouldn't it be nice if we could generate some sort of "queue comprehension"
 * during the initial queue construction which could replace this nonsense?
 *
 * There are two known reasons why targets start up time isn't as snappy as it
 * could be. This isn't the worst offender, but it's one of the two.
 */

const {
    uniqBy,
    // TODO: once we're on Node 11+ exclusively we can use `.flat(Infinity)`
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

/**
 * A filter which inspects everything up to this point in the queue and
 * determines if a prompt toggle operation has indicated that we should filter
 * a given prompt.
 *
 * Nonsense which should be deeply re-considered. See note at top of file.
 *
 * TODO: There are be cases when this approach is too aggressive because we
 * make prompts unique by name before we reach this step in processing.
 */
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

    /**
     * Reduces to an array of names which have been bound via the `@bind`
     * operator.
     *
     * TODO:
     * Major issues here which should be addressed...
     *
     *   - Bindings order is not considered! If a prompt's config path is
     *     referenced before a related binding occurs we will have a false
     *     positive and the user will not be prompted.
     *
     *   - Base merges are considered by inspecting the keypaths of the value
     *     found at fromPath. Bindings which affect fromPath's value however,
     *     are not considered. In this case, we will have a false negative and
     *     the user will be prompted.
     *
     *  What a mess. See note at top of file.
     */
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

    /**
     * Processes prompts as follow:
     *
     *   - Makes unique by name. This is necessary but given some of the other
     *     processing that happens in this file, this first step is premature.
     *     Alternative approachs will require some fundamental re-architecting.
     *
     *   - Amends all `when` functions to consider namespace.
     *
     *   - Considers any declared prompt toggle operations and attempts to
     *     filters prompts accordingly. And fails in some cases because we're
     *     trying to solve the problem in the wrong place... this should be
     *     modeled and understood at the level of the work queue.
     *
     *   - Filters prompts which are declared as fulfilled by `@bind`. And,
     *     again, fails in some cases. See all the other notes of frustration
     *     above. I hate this file.
     */
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
