#!/usr/bin/env node

const path = require('path');
const { readAll }  = require('sota');
const { Trajectory } = require('trajectory');
const DefaultAnswers = require('answers');
const callsites = require('callsites');
const builtinLoaders = require('./lib/loaders');
const { inspect } = require('util');
const debug = v => process.env.DEBUG && console.log(inspect(v, { colors: true, depth: null }));

const { load, sourceExpander } = require('./lib/load');
const { stateSchema, optionsSchema } = require('./lib/schema');
const streamToPromise = require('stream-to-promise');
const { prefixOptions } = require('./lib/util');
const { resolveTarget, loadResource } = require('./lib/resolve');

async function Targets(options = {}) {
    try {
        const calledFrom = callsites()[1].getFileName();

        const {
            name = 'targets',
            argv = process.argv.slice(2),
            targets:givenTargets = {},
            source:givenSource,
            loaders:customLoaders,
            __Answers__:Answers = DefaultAnswers
        } = await optionsSchema.validate(options);

        process.title = name;

        const prefixedArgv = prefixOptions(argv);
        const rawConfig = await Answers({
            name,
            argv: prefixedArgv,
            loaders: [ sourceExpander ]
        });
        const config = await stateSchema.validate(rawConfig);
        const source = [ ...givenSource, ...config.source ];
        const loadedTargets = await load({ patterns: source, cwd: path.dirname(calledFrom) });
        const targets = source.length
            ? { ...givenTargets, ...loadedTargets }
            : givenTargets;
        const loaders = { ...builtinLoaders, ...customLoaders };

        const definition = config._;
        const resourceCache = new WeakMap();
        const resources = new Proxy({}, {
            get(_, name) {
                return resourceCache[name] || loadResource(name, resolveTarget(targets, name), loaders);
            }
        });
        const machine = await readAll(definition);
        debug(machine);
        const t = new Trajectory({ resources, debug: !!process.env.DEBUG });

        const input = config.input;
        return t.execute(machine, input);

    } catch (e) {
        if (e.name === 'ValidationError') {
            console.error(`Validation Errors:\n${e.details.map(d => `  • ${d.message}`).join('\n')}\n`);
            console.error(e.annotate());
        } else {
            console.error(e && e.message ? e.message : e);
            e && e.stack && console.error(e.stack);
        }
        process.exit(1);
    }
}

if (require.main === module) {
    Targets();
}
