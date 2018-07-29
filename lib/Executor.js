'use strict';

module.exports = Executor;

const { set } = require('lodash');
const streamToPromise = require('stream-to-promise');
const LineWrapper = require('stream-line-wrapper');
const byline = require('byline');
const answers = require('answers');

const {
    hasOpFlag,
    isReadableStream,
    isPromise,
    isPty
} = require('./predicates');

const { Print, print, ansiLabel } = require('./util');

const ConfigStore = require('./store/Config');
const { getLatest:getLatestConfig } = ConfigStore;
const ResultStore = require('./store/Results');
const { push:pushResult } = ResultStore;
const SystemStore = require('./store/System');

const { inDebugMode } = require('./predicates');

const maybeFilter = (result, fn = {}) =>
    (typeof fn.filter === 'function')
        ? fn.filter(result, { config: ConfigStore, results: ResultStore })
        : result;

const saveResult = (name, result, fn) => {
    const value = maybeFilter(result, fn);
    pushResult(set({}, name, value));
    return Promise.resolve(value);
};

function ttyStreamPrint(label, stream) {
    byline(stream).on('data', (buf) => print(label, buf.toString()));
}

function handlePty(pty, name, fn) {
    return new Promise(resolve => {
            let data = '';
            pty.on('data', b => {
                data += (b instanceof Buffer)
                    ? b.toString()
                    : b;
            });
            pty.on('end', () => resolve(data));
        })
        .then(v => saveResult(name, v, fn))
        .then(() => {});
}

function Executor({ fn, name, ns, config:boundConfig }) {
    const label = fn.label || name;
    const latestConfig = getLatestConfig()[ns] || {};
    const result = fn(answers.composer(boundConfig, latestConfig), Print(label));
    if (hasOpFlag(fn)) return Promise.resolve(inDebugMode(name) ? '' : null);
    if (result == null) return saveResult(name, result, fn);
    if (isPty(result)) {
        return handlePty(result, name, fn);
    }
    if (!isReadableStream(result.stdout || result)) {
        if (isPromise(result)) return result.then((v) => saveResult(name, v, fn));
        return saveResult(name, result, fn);
    }
    const stream = result.stdout || result;
    const streamPromises = [ streamToPromise(stream) ];
    const prefix = `${ansiLabel(label)} `;
    if (SystemStore.get('mode') === 'tty') {
        ttyStreamPrint(label, stream);
    } else {
        const stdoutLineWrapper = new LineWrapper({ prefix });
        stream.pipe(stdoutLineWrapper).pipe(process.stdout);
    }
    if (result.stderr) {
        if (SystemStore.get('mode') === 'tty') {
            ttyStreamPrint(label, result.stderr);
        } else {
            const stderrLineWrapper = new LineWrapper({ prefix });
            result.stderr.pipe(stderrLineWrapper).pipe(process.stderr);
        }
        streamPromises.push(streamToPromise(result.stderr));
    }
    return Promise.all(streamPromises)
        .then(([ stdout ]) => saveResult(name, stdout.toString().trim(), fn))
        .then(() => {});
}
