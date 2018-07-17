'use strict';

module.exports = Targets;

const os = require('os');
const chalk = require('chalk');
const { get, set, uniqBy, isObject, flattenDeep } = require('lodash');
const Answers = require('answers');
const streamToPromise = require('stream-to-promise');
const inquirer = require('inquirer');
const LineWrapper = require('stream-line-wrapper');

const bindingNamespace = '__binding__';
const bindingDelimiter = '::';
const clone = (v) => JSON.parse(JSON.stringify(v));
const orObject = (v) => v == null ? {} : v;
const rKey = Symbol.for('targets-result-store');
const cKey = Symbol.for('targets-config-store');
const resultStore = global[rKey] = [];
const configStore = global[cKey] = [];
const getPreviousConfig = (n = 1) => clone(orObject(configStore[configStore.length - n]));
const getLatestConfig = () => getPreviousConfig(1);
const getPreviousResult = (n = 1) => clone(orObject(resultStore[resultStore.length - n]));
const getLatestResult = () => getPreviousResult(1);
//const restorePreviousConfig = (n = 1) => configStore.push(getPreviousConfig(n));
//const restoreInitialConfig = () => configStore.push(clone(configStore[0]));

const isReadableStream = stream =>
    stream !== null &&
    typeof stream === 'object' &&
    typeof stream.pipe === 'function' &&
    stream.readable !== false &&
    typeof stream._read === 'function' &&
    typeof stream._readableState === 'object';

const isTarget = (last, v) => !/^--?/.test(last || '') && !/^--?/.test(v);

const isBinding = (v) => new RegExp(`.+${bindingDelimiter}.+`).test(v);

const isPromise = (obj) => !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';

const handleResult = (name, namespace, result) => {
    if (namespace === bindingNamespace) return Promise.resolve('');
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

const ansiLabel = label =>
    `${chalk.reset.white('[')}${chalk.reset.yellow(label)}${chalk.reset.white(']')}`;

const maybeStringify = value => {
    try {
        return JSON.stringify(value, null, 4);
    } catch (e) {
        return value;
    }
};

const print = (label, value, silent) => {
    value != null && !silent && label != bindingNamespace
        && console.log(ansiLabel(label),
            (`${typeof value === 'string'
                ? value
                : maybeStringify(value)}`
            .replace(new RegExp(`^${os.EOL}*`), '')
            .replace(new RegExp(`${os.EOL}*$`), '')
            .split(os.EOL)
            .join(`\n${ansiLabel(label)} `)));
};

const Print = (label) => (value) => print(label, value);

const printer = (value) =>
    Array.isArray(value)
        ? value.map(printer)
        : print(value.label, value.value, value.silent);

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

const QueueBinding = (arg) => {
    const [ fromPath, toPath ] = arg.split(bindingDelimiter);
    return {
        fn: () => {
            const nextConfig = getLatestConfig();
            const lastResult = getLatestResult();
            configStore.push(Answers.deepSet(nextConfig, toPath, get(lastResult, fromPath)));
            return;
        },
        name: bindingNamespace,
        namespace: bindingNamespace
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
    if (typeof arg === 'string' && isBinding(arg)) {
        return [ QueueBinding(arg) ];
    }
    if (typeof arg === 'string') {
        return QueueGroup(targets, targets[arg], arg);
    }
    if (typeof arg === 'function') {
        return [ QueueFn(arg, name) ];
    }
    console.log('invalid target name in command');
    return [];
};

const Queue = (targets, argv) => argv
    .reduce((acc, arg, i, col) => isTarget(col[i - 1], arg)
              ? [ ...acc, ...QueueGroup(targets, arg) ]
              : acc,
        []);

const Prompts = (argv, queue) => {
    const bindingsTo = argv.reduce((acc, v) =>
        (new RegExp(`.+${bindingDelimiter}.+`).test(v))
            ? [ ...acc, v.split(bindingDelimiter)[1] ]
            : acc,
        []);
    return uniqBy(flattenDeep(queue)
        .reduce((acc, entry) => entry.prompts
                ? [ ...acc, ...entry.prompts ]
                : acc,
            []), 'name')
        .filter((p) => !bindingsTo.includes(p.name));
};

function UnitOfWork(unit) {
    const config = getLatestConfig();
    if (typeof unit.fn === 'function') return handleResult(unit.name, unit.namespace, unit.fn(config[unit.namespace] || {}, Print(unit.fn.label || unit.name)))
        .then(r => ({ silent: !!unit.fn.silent, label: unit.fn.label || unit.name, value: r, stream: !!(r||{}).__stream__ }))
        .then(r => r.stream || printer(r));
    if (Array.isArray(unit)) return Promise.all(unit.map((entry) =>
        UnitOfWork(entry, config)));
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
