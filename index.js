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

if (process.versions.node.split('.')[0] < 10) throw new Error('targets requires Node.js version 10 or newer.');

module.exports = Targets;

const { load, sourceExpander } = require('./lib/load');
Targets.load = load;
Targets.Spawn = require('./lib/Spawn');

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
            name,
            argv,

            givenTargets,
            givenSource,

            // here be dragons... (untested)
            customOperations,
            customLoaders,

            // dep injection for testing ... a lesser evil
            Answers = DefaultAnswers
        } = await optionsSchema.validate(options);

        process.title = name;

        const { a:prefixedArgv } = argv.reduce((acc, arg) => {
            const { done, a } = acc;
            if (/^--$/.test(arg)) return { done: true, a: [ ...a, arg ] };
            if (!done) {
                if (/^--.*/.test(arg)) arg = `--config.${arg.slice(2)}`;
            }
            return { done, a: [ ...a, arg ] };
        }, { done: false, a: [] });
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
            ? await Answers({ // it's expensive to crawl the file system again. previously solved by modification to answers to be able to add prompts to an existing instance, but trying to keep answers simpler and standalone, so just eating the time complexity for now.
                name,
                argv: prefixedArgv,
                prompts
            })
            : prePromptState;

        Store.set(initialState);
        Store.setting.set(Store.settingsFromArgv(initialState['--']));

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
