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
const readPkgUp = require('read-pkg-up');
const path = require('path');
const parentModule = require('parent-module')();
const { name:pkgName = 'targets' } = readPkgUp.sync({ cwd: path.dirname(parentModule) }).pkg || {};

async function Targets(options = {}) {
    const {
        name = pkgName,
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

    processTargetArgs(config);

    /* eslint-disable-next-line */
    for await (const result of Scheduler(queue)) {}
}

Targets.load = load;
Targets.Spawn = Spawn;
