/**
 * This software is released under the MIT license:
 *
 * Copyright 2018 Mac Heller-Ogden
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

if (process.versions.node.split('.')[0] < 10) throw new Error('targets requires Node.js version 10.3.0 or newer.');

module.exports = Targets;

const { load, sourceExpander } = require('./lib/load');
const path = require('path');
const Queue = require('./lib/Queue');
const InitialPrompt = require('./lib/InitialPrompt');
const { Scheduler } = require('./lib/Scheduler');
const Prompts = require('./lib/Prompts');
const builtinOps = require('./lib/operations');
const builtinLoaders = require('./lib/loaders');
const Store = require('./lib/Store');
const callsites = require('callsites');
const DefaultAnswers = require('answers');

const {
    state:stateSchema,
    options:optionsSchema
} = require('./lib/schema');

async function Targets(options = {}) {
    try {
        const calledFrom = callsites()[1].getFileName();

        const {
            name = 'targets',
            argv = process.argv.slice(2),
            targets:givenTargets = {},
            source:givenSource,

            /**
             * Here Be Dragons:
             * Custom operations and loaders work in theory but are yet to be
             * tested.
             */
            operators:customOperations,
            loaders:customLoaders,

            /**
             * Dependency injection is used to support testing. A lesser evil,
             * however unsightly.
             */
            __Answers__:Answers = DefaultAnswers

        } = await optionsSchema.validate(options);

        process.title = name;

        /**
         * Prefix command-line options as `--config.${keypath}` so that they are
         * quaratined to `config` namespace in the global store.
         */
        const prefixedArgv = Store.prefixOptions(argv);

        let prePromptState = await Answers({
            name,
            argv: prefixedArgv,
            loaders: [ sourceExpander ]
        });

        prePromptState = await stateSchema.validate(prePromptState);

        const configSource = prePromptState.source;

        const source = [ ...givenSource, ...configSource ];

        const targets = (source.length)
            ? { ...givenTargets, ...load({ patterns: source, cwd: path.dirname(calledFrom) }) }
            : givenTargets;

        const args = await InitialPrompt({ targets, argv });
        const operations = { ...builtinOps, ...customOperations };
        const loaders = { ...builtinLoaders, ...customLoaders };
        const queue = Queue({ targets, operations, loaders, args });

        const prompts = Prompts(queue);

        const initialState = prompts.length
            /**
             * It's expensive and non-transactional to crawl the file system yet
             * again, but alas. Previously, this was solved by modifications to
             * Answers to be able to add prompts to an existing instance, but in
             * trying to keep Answers simpler and standalone, we've decided just
             * to eat the time complexity and take the hit for now.
             */
            ? await Answers({
                name,
                argv: prefixedArgv,
                prompts
            })
            : prePromptState;

        Store.set(initialState);
        Store.setting.set(Store.settingsFromArgv(initialState['--']));

        /**
         * Time to kick of the main loop! ...and it's all just side-effects.
         */
        /* eslint-disable-next-line */
        for await (const result of Scheduler(queue)) {}

    } catch (e) {
        if (e.name === 'ValidationError') {
            console.error(`Validation Errors:\n${e.details.map(d => `  • ${d.message}`).join('\n')}\n`);
            console.error(e.annotate());
        } else {
            console.error(e && e.message ? e.message : e);
        }
        process.exit(1);
    }
}

// Wherein we expose a few subsystem components for power users...
Targets.load = load;
Targets.Spawn = require('./lib/Spawn');
