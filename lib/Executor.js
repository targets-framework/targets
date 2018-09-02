'use strict';

module.exports = Executor;

const streamToPromise = require('stream-to-promise');
const LineWrapper = require('stream-line-wrapper');
const byline = require('byline');
const { merge } = require('sugarmerge');

const { hasTag } = require('./tags');

const { inDebugMode } = require('./debug');

const {
    Print,
    print,
    ansiLabel,
    paddedAnsiLabel
} = require('./print');

const labelStyle = {
    'default': ansiLabel,
    'aligned': paddedAnsiLabel
};

const Store = require('./Store');
const { config: { get:getConfig }, result: { set:setResult }, setting: { get:getSetting } } = Store;

const isPromise = (obj) => !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function';

const isReadableStream = stream =>
    stream !== null &&
    typeof stream === 'object' &&
    typeof stream.pipe === 'function' &&
    stream.readable !== false &&
    typeof stream._read === 'function' &&
    typeof stream._readableState === 'object';

const isPty = obj =>
    obj !== null &&
    typeof obj._pty === 'string';

const ttyStreamPrint = (label, stream) =>
    byline(stream).on('data', (buf) => print(label, buf.toString()));

const streamPrint = (label, stream) => {
    const prefix = `${labelStyle[getSetting('label-style') || 'default'](label)} `;
    const stdoutLineWrapper = new LineWrapper({ prefix });
    stream.pipe(stdoutLineWrapper).pipe(process.stdout);
};

const modes = {
    tty: {
        streamPrint: ttyStreamPrint
    },
    ci: {
        streamPrint
    },
    dev: {
        streamPrint
    }
};

const StreamPrint = () => modes[getSetting('mode')].streamPrint;

const maybeFilter = (result, fn = {}) =>
    (typeof fn.filter === 'function')
        ? fn.filter(result, { Store })
        : result;

const saveResult = (name, result, fn) => {
    const value = maybeFilter(result, fn);
    setResult(name, value);
    return Promise.resolve(value);
};

function handlePty(pty, name, fn) {
    return new Promise(resolve => {
            let data = '';
            pty.on('data', b => data += (b instanceof Buffer) ? b.toString() : b);
            pty.on('end', () => resolve(data));
        })
        .then(v => (saveResult(name, v, fn), null));
}

const shouldRun = (predicates, ns) => predicates.reduce((a, p) => !a.result ? a : p(ns), { result: true });

function Executor({ fn, name, label, ns, config, parentPredicates = [], fnPredicates = [] }) {
    const fnConfig = getConfig(ns, {});
    const runCheck = shouldRun(parentPredicates) || shouldRun(fnPredicates, ns);
    if (!runCheck.result) return Promise.resolve(`Skipping. Reason: ${runCheck.reason}`);
    const result = fn(merge(config, fnConfig), Print(label));
    if (hasTag(fn, 'op')) return Promise.resolve(inDebugMode(name) ? '' : null);
    if (result == null) return saveResult(name, result, fn);
    if (isPty(result)) return handlePty(result, name, fn);
    if (!isReadableStream(result.stdout || result)) return isPromise(result)
        ? result.then((v) => saveResult(name, v, fn))
        : saveResult(name, result, fn);
    const stdout = result.stdout || result;
    const streamPromises = [ streamToPromise(stdout) ];
    StreamPrint()(label, stdout);
    if (result.stderr) {
        const { stderr } = result;
        StreamPrint()(label, stderr);
        streamPromises.push(streamToPromise(stderr));
    }
    return Promise.all(streamPromises)
        .then(([ stdout ]) => saveResult(name, stdout.toString().trim(), fn))
        .then(() => {});
}
