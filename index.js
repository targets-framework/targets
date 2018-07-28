'use strict';

module.exports = Targets;

const Answers = require('answers');
const { push:pushConfig } = require('./lib/store/Config');
const Queue = require('./lib/Queue');
const InitialPrompt = require('./lib/Prompts/InitialPrompt');
const Scheduler = require('./lib/Scheduler');
const Prompts = require('./lib/Prompts');
const Operations = require('./lib/Operations');

async function Targets(options = {}) {
    const {
        name,
        targets = {},
        operations:ops = {},
        argv = process.argv.slice(2)
    } = options;
    process.title = name;
    const args = await InitialPrompt({ targets, argv });
    const operations = Operations(ops);
    const queue = Queue({ targets, operations, args });
    const prompts = Prompts(queue);
    const answers = Answers({ name, prompts });
    const config = await answers.get();
    pushConfig(config);
    const targs = config['--'] || [];
    if (targs.includes('--tty')) require('./lib/tty')();
    /* eslint-disable-next-line */
    for await (const result of Scheduler(name, queue)) {}
}

Targets.load = require('./lib/load');
