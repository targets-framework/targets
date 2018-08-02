'use strict';

module.exports = Executor;

const { get, set } = require('lodash');
const streamToPromise = require('stream-to-promise');
const LineWrapper = require('stream-line-wrapper');
const byline = require('byline');
const { merge } = require('sugarmerge');

const {
    hasOpFlag,
    isReadableStream,
    isPromise,
    isPty
} = require('./predicates');

const { Print, print, ansiLabel } = require('./util');

const ConfigStore = require('./store/Config');
const { getLatest:getLatestConfig, unset:unsetConfig } = ConfigStore;
const ResultStore = require('./store/Result');
const { push:pushResult } = ResultStore;
const SettingStore = require('./store/Setting');

const { inDebugMode } = require('./predicates');

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

function Executor({ fn, name, ns, config:boundConfig }) {
    if (!get(getLatestConfig(), `__when__.${name}`, true)) return Promise.resolve();
    if (!get(getLatestConfig(), `__when_next__.${name}`, true)) {
        unsetConfig(`__when_next__.${name}`);
        return Promise.resolve();
    }
    const label = fn.label || name;
    const latestConfig = getLatestConfig()[ns] || {};
    const result = fn(merge(boundConfig, latestConfig), Print(label));
    if (hasOpFlag(fn)) return Promise.resolve(inDebugMode(name) ? '' : null);
    if (result == null) return saveResult(name, result, fn);
    if (isPty(result)) return handlePty(result, name, fn);
    if (!isReadableStream(result.stdout || result)) return (isPromise(result))
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
