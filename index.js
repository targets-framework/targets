'use strict';

module.exports = Targets;

const Answers = require('answers');
const ConfigStore = require('./lib/store/ConfigStore');
const Queue = require('./lib/factory/Queue');
const InitialPrompt = require('./lib/factory/InitialPrompt');
const Scheduler = require('./lib/factory/Scheduler');
const Prompts = require('./lib/factory/Prompts');

async function Targets(options = {}) {
    const {
        name,
        targets = {},
        argv = process.argv.slice(2)
    } = options;
    const args = await InitialPrompt(targets, argv);
    const queue = Queue(targets, args);
    const prompts = Prompts(args, queue);
    const answers = Answers({ name, prompts });
    const config = await answers.get();
    ConfigStore.push(config);
    /* eslint-disable-next-line */
    for await (const result of Scheduler(queue)) {}
}
