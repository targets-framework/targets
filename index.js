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

const { load, expandPatterns } = require('./lib/load');
Targets.load = load;
Targets.Spawn = require('./lib/Spawn');

const path = require('path');
const DefaultAnswers = require('answers');
const Queue = require('./lib/Queue');
const InitialPrompt = require('./lib/InitialPrompt');
const { Scheduler } = require('./lib/Scheduler');
const Prompts = require('./lib/Prompts');
const builtinOps = require('./lib/operations');
const builtinLoaders = require('./lib/loaders');
const Store = require('./lib/Store');
const { isString } = require('./lib/util');

function sourceExpander(config, filename) {
    if (config.source == null) return config;
    return { ...config, source: expandPatterns(config.source, path.dirname(filename)) };
}

async function Targets(options = {}) {

    const {
        name = 'targets',
        targets:givenTargets = {},
        source:givenSource = [],

        // here be dragons... (untested)
        operations:customOperations = {},
        loaders:customLoaders = {},
        // for testing we make Answers an option
        Answers = DefaultAnswers,

        argv = process.argv.slice(2)
    } = options;

    process.title = name;

    const prePromptState = await Answers({ name, loaders: [ sourceExpander ] });

    const configSource = isString(prePromptState.source)
      ? [ prePromptState.source ]
      : prePromptState.source || [];

    const source = isString(givenSource)
      ? [ givenSource, ...configSource ]
      : [ ...givenSource, ...configSource ];

    const targets = (source.length)
        ? { ...givenTargets, ...load({ patterns: source }) }
        : givenTargets;

    const args = await InitialPrompt({ targets, argv });
    const operations = { ...builtinOps, ...customOperations };
    const loaders = { ...builtinLoaders, ...customLoaders };
    const queue = Queue({ targets, operations, loaders, args });

    const prompts = Prompts(queue);
    const initialState = await Answers({ name, prompts });

    Store.Set()(initialState);
    Store.setting.set(Store.settingsFromArgv(initialState['--']));

    /* eslint-disable-next-line */
    for await (const result of Scheduler(queue)) {}
}
