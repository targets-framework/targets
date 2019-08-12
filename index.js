#!/usr/bin/env node

const path = require('path');
const { readAll }  = require('sota');
const { Trajectory } = require('trajectory');
const DefaultAnswers = require('answers');
const callsites = require('callsites');
const builtinLoaders = require('./lib/loaders');
const { inspect } = require('util');
const debug = v => console.log(inspect(v, { colors: true, depth: null }));

const { load, sourceExpander } = require('./lib/load');
const { stateSchema, optionsSchema } = require('./lib/schema');

function processLoaders(targets, loaders) {
    return Object.entries(targets).reduce((acc, [name, target]) => {
        if (target != null && target.kind) {
            const { kind } = target;
            if (typeof loaders[kind] != 'function') throw new Error(`${kind} is not a valid loader`);
            return { ...acc, [name]: loaders[kind](target) };
        }
        return acc;
    }, targets);
}

function prefixOptions(argv) {
    return argv.reduce((acc, arg) => {
        const { done, a } = acc;
        if (/^--$/.test(arg)) return { done: true, a: [ ...a, arg ] };
        if (!done && /^--.*/.test(arg)) arg = `--input.${arg.slice(2)}`;
        return { done, a: [ ...a, arg ] };
    }, { done: false, a: [] }).a;
}

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
        const config = await stateSchema.validate(await Answers({
            name,
            argv: prefixedArgv,
            loaders: [ sourceExpander ]
        }));
        const source = [ ...givenSource, ...config.source ];
        const targets = source.length
            ? { ...givenTargets, ...load({ patterns: source, cwd: path.dirname(calledFrom) }) }
            : givenTargets;
        const loaders = { ...builtinLoaders, ...customLoaders };
        const resources = processLoaders(targets, loaders);

        const definition = config._;
        const machine = await readAll(definition);
        debug(machine);
        const t = new Trajectory({ resources });

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
