'use strict';

module.exports = Targets;

const Answers = require('answers');
const { push:pushConfig } = require('./lib/store/Config');
const Queue = require('./lib/factory/Queue');
const InitialPrompt = require('./lib/factory/InitialPrompt');
const Scheduler = require('./lib/factory/Scheduler');
const Prompts = require('./lib/factory/Prompts');
const Operations = require('./lib/factory/Operations');

async function Targets(options = {}) {
    const {
        name,
        targets = {},
        operations:ops = {},
        argv = process.argv.slice(2)
    } = options;
    const args = await InitialPrompt({ targets, argv });
    const operations = Operations(ops);
    const queue = Queue({ targets, operations, args });
    const prompts = Prompts(queue);
    const answers = Answers({ name, prompts });
    const config = await answers.get();
    pushConfig(config);
    /* eslint-disable-next-line */
    for await (const result of Scheduler(queue)) {}
}
