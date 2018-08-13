'use strict';

module.exports = Executor;

const { set } = require('lodash');
const streamToPromise = require('stream-to-promise');
const LineWrapper = require('stream-line-wrapper');
const byline = require('byline');
const { merge } = require('sugarmerge');

const { hasOperationTag } = require('./tags');

const {
    Print,
    print,
    ansiLabel
} = require('./print');

const { inDebugMode } = require('./debug');

const ConfigStore = require('./store/Config');
const { getLatest:getLatestConfig } = ConfigStore;

const ResultStore = require('./store/Result');
const { push:pushResult } = ResultStore;

const SettingStore = require('./store/Setting');

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
    const prefix = `${ansiLabel(label)} `;
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

const StreamPrint = () => modes[SettingStore.get('mode')].streamPrint;

const maybeFilter = (result, fn = {}) =>
    (typeof fn.filter === 'function')
        ? fn.filter(result, { config: ConfigStore, result: ResultStore })
        : result;

const saveResult = (name, result, fn) => {
    const value = maybeFilter(result, fn);
    pushResult(set({}, name, value));
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

const skip = (predicates, config) => !(predicates.reduce((acc, p) => acc && p(config), true));

function Executor({ fn, name, ns, config, parentPredicates = [], fnPredicates = [] }) {
    const latestConfig = getLatestConfig();
    const latestFnConfig = latestConfig[ns] || {};
    if (skip(parentPredicates, latestConfig) || skip(fnPredicates, latestFnConfig)) return Promise.resolve(`skipping ${name}`);
    const label = fn.label || name;
    const result = fn(merge(config, latestFnConfig), Print(label));
    if (hasOperationTag(fn)) return Promise.resolve(inDebugMode(name) ? '' : null);
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
