'use strict';

module.exports = Targets;

// deps
const { get, set, uniqBy, isObject, flattenDeep } = require('lodash');
const Answers = require('answers');
const streamToPromise = require('stream-to-promise');
const inquirer = require('inquirer');
const LineWrapper = require('stream-line-wrapper');

// lib
const {
    BINDING_NS,
    BINDING_DELIM,
    OP_NS, OP_PREFIX,
    OP_DELIM
} = require('./lib/constants');

// predicates
const {
    isReservedNs,
    isOperation,
    isResultBinding,
    isConfigBinding,
    isTarget,
    isPromise,
    isReadableStream
} = require('./lib/predicates');

// config store
const {
    configStore,
    getLatestConfig
} = require('./lib/store.config');

// result store
const {
    resultStore,
    getLatestResult
} = require('./lib/store.results');

// print utils
const { ansiLabel, Print, printer } = require('./lib/print');

const handleResult = (name, namespace, result) => {
    if (isReservedNs(namespace)) return Promise.resolve('');
    if (result == null) {
        resultStore.push(set({}, name, result));
        return Promise.resolve('');
    }
    if (!isReadableStream(result.stdout || result)) {
        if (isPromise(result)) return result.then((v) => {
            resultStore.push(set({}, name, v));
            return v;
        });
        resultStore.push(set({}, name, result));
        return Promise.resolve(result);
    }
    const stream = result.stdout || result;
    const streamPromises = [ streamToPromise(stream) ];
    const prefix = `${ansiLabel(namespace)} `;
    const stdoutLineWrapper = new LineWrapper({ prefix });
    stream.pipe(stdoutLineWrapper).pipe(process.stdout);
    if (result.stderr) {
        const stderrLineWrapper = new LineWrapper({ prefix });
        result.stderr.pipe(stderrLineWrapper).pipe(process.stderr);
        streamPromises.push(streamToPromise(result.stderr));
    }
    return Promise.all(streamPromises).then(([ stdout ]) => {
        const value = stdout.toString().trim();
        const result = {
            value,
            __stream__: true
        };
        resultStore.push(set({}, name, value));
        return result;
    });
};

const NamespacedPrompts = (prompts, namespace) =>
    prompts.reduce((a, p) => {
        if (typeof p === 'string') {
            return [
                ...a,
                {
                    type: 'input',
                    name: `${namespace}.${p}`,
                    message: `${ansiLabel(`${namespace}.${p}`)} ${p}`
                }
            ];
        }
        if (isObject(p)) {
            const message = get(p, 'message', p.name);
            return [
                ...a,
                {
                    ...p,
                    name: `${namespace}.${p.name}`,
                    message: `${ansiLabel(`${namespace}.${p.name}`)} ${((typeof message === 'function')
                            ? (config) => message(config[namespace])
                            : message)}`
                }
            ];
        }
        return a;
    }, []);

const TargetChoices = (targets) => Object.entries(targets)
    .map(([ targetName, target ]) => ({
        name: target.label || targetName,
        value: targetName
    }));

const InitialPrompt = (targets) =>
    inquirer.prompt([
        {
            type: 'checkbox',
            name: 'targetNames',
            message: 'Please select your targets',
            choices: TargetChoices(targets)
        }
    ]).then(({ targetNames }) => targetNames);

const hasTargets = (argv) => !!argv
    .reduce((acc, arg, i, col) => isTarget(col[i - 1], arg)
            ? [ ...acc, arg ]
            : acc,
        []).length;

const getArgv = (targets, argv) =>
    hasTargets(argv)
        ? Promise.resolve(argv)
        : InitialPrompt(targets).then(targets =>
            [ ...targets, ...argv ]);

const QueueFn = (fn, name) => {
    const namespace = name.split('.').shift();
    const result = { fn, name, namespace };
    if (fn.prompts) {
        result.prompts = NamespacedPrompts(fn.prompts, namespace);
        delete fn.prompts;
    }
    return result;
};

const QueueBinding = (binding, useResult) => {
    const [ fromPath, toPath ] = binding.split(BINDING_DELIM);
    return {
        fn: () => {
            const nextConfig = getLatestConfig();
            if (useResult) {
                const lastResult = getLatestResult();
                configStore.push(Answers.deepSet(nextConfig, toPath, get(lastResult, fromPath)));
            } else {
                configStore.push(Answers.deepSet(nextConfig, toPath, get(nextConfig, fromPath)));
            }
        },
        name: binding,
        namespace: BINDING_NS
    };
};

const operations = {
    'prompts-on': () => {},
    'prompts-off': () => {},
    // 'fail-if-prompt': () => {} ... should this be operation? or just config? me thinks config. CI systems should fail if prompt is needed...
};

const QueueOperation = (op) => {
    const [ opName, arg ] = op.split(OP_DELIM);
    const opFn = operations[opName] || (() => 'unknown operation');
    return {
        fn: () => opFn(arg),
        name: `${OP_PREFIX}${opName}`,
        namespace: OP_NS
    };
};

const QueueGroup = (targets, arg, name) => {
    if (typeof arg === 'string' && arg.includes(',')) {
        return [ QueueGroup(targets, arg.split(',')) ];
    }
    if (Array.isArray(arg)) {
        return arg.reduce((a, n) => {
            return [ ...a, ...QueueGroup(targets, n) ];
          }, []);
    }
    if (typeof arg === 'string') {
        if (isResultBinding(arg)) return [ QueueBinding(arg, true) ];
        if (isConfigBinding(arg)) return [ QueueBinding(arg.replace(OP_PREFIX, '')) ];
        if (isOperation(arg)) return [ QueueOperation(arg.replace(OP_PREFIX, '')) ];
        return QueueGroup(targets, targets[arg], arg);
    }
    if (typeof arg === 'function') {
        return [ QueueFn(arg, name) ];
    }
    console.log('invalid target in command:', arg);
    return [];
};

const Queue = (targets, argv) => argv
    .reduce((acc, arg, i, col) => isTarget(col[i - 1], arg)
              ? [ ...acc, ...QueueGroup(targets, arg) ]
              : acc,
        []);

const Prompts = (argv, queue) => {
    // The time complexity of this function is completely insane. There must be a better way. Indicative of a design flaw and warrants further scrutiny.
    const bindingsTo = flattenDeep(queue).reduce((acc, { name, namespace }) =>
        (namespace === BINDING_NS)
            ? [ ...acc, name.replace(OP_PREFIX, '').split(BINDING_DELIM)[1] ]
            : acc,
        []);
    return uniqBy(flattenDeep(queue)
        .reduce((acc, entry, idx, arr) => {
            if (entry.prompts) {
                // wherein we peer into the future to see what we should do... but at what cost... something is rotten in Denmark.
                const prompts = entry.prompts.filter((prompt) => {
                    const namesSoFar = arr.slice(0, idx).map(({ name }) => name);
                    if (!prompt.optional || namesSoFar.lastIndexOf(`${OP_PREFIX}prompts-on`) > namesSoFar.lastIndexOf(`${OP_PREFIX}prompts-off`)) return true;
                });
                return [ ...acc, ...prompts ];
            }
            return acc;
            },
        []), 'name')
        .filter((p) => !bindingsTo.includes(p.name));
};

function UnitOfWork(unit) {
    const config = getLatestConfig();
    if (typeof unit.fn === 'function') return handleResult(unit.name, unit.namespace, unit.fn(config[unit.namespace] || {}, Print(unit.fn.label || unit.name)))
        .then(r => ({ silent: !!unit.fn.silent, label: unit.fn.label || unit.name, value: r, stream: !!(r||{}).__stream__ }))
        .then(r => r.stream || isReservedNs(unit.namespace) || printer(r));
    if (Array.isArray(unit)) return Promise.all(unit.map((entry) =>
        UnitOfWork(entry)));
    return;
}

async function* Scheduler(queue) {
    while (queue.length > 0) {
        try {
            yield UnitOfWork(queue.shift());
        } catch (e) {
            console.error('Caught promise rejection. Exiting now.', e);
            process.exit(1);
        }
    }
}

async function Targets(options = {}) {
    const {
        name,
        targets = {},
        argv:initialArgv = process.argv.slice(2)
    } = options;
    const argv = await getArgv(targets, initialArgv);
    const queue = Queue(targets, argv);
    const prompts = Prompts(argv, queue);
    const answers = Answers({ name, prompts });
    const config = await answers.get();
    configStore.push(config);
    /* eslint-disable-next-line */
    for await (const result of Scheduler(queue)) {}
}
