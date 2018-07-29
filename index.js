'use strict';

module.exports = Targets;

const Answers = require('answers');
const { push:pushConfig } = require('./lib/store/Config');
const Queue = require('./lib/Queue');
const InitialPrompt = require('./lib/InitialPrompt');
const Scheduler = require('./lib/Scheduler');
const Prompts = require('./lib/Prompts');
const builtinOps = require('./lib/operations');
const processTargetArgs = require('./lib/processTargetArgs');
const load = require('./lib/load');
const Spawn = require('./lib/Spawn');

async function Targets(options = {}) {
    const {
        name,
        targets = {},
        operations:ops = {}, // here be dragons...
        argv = process.argv.slice(2)
    } = options;

    process.title = name;
    const args = await InitialPrompt({ targets, argv });
    const operations = { ...builtinOps, ...ops };
    const queue = Queue({ targets, operations, args });
    const prompts = Prompts(queue);
    const answers = Answers({ name, prompts });
    const config = await answers.get();

    pushConfig(config);

    processTargetArgs(config['--']);

    /* eslint-disable-next-line */
    for await (const result of Scheduler(name, queue)) {}
}

Targets.load = load;
Targets.Spawn = Spawn;
