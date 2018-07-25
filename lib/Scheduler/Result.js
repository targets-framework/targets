'use strict';

module.exports = Result; 
const { set } = require('lodash');
const streamToPromise = require('stream-to-promise');
const LineWrapper = require('stream-line-wrapper');
const byline = require('byline');

const {
    hasOpFlag,
    isReadableStream,
    isPromise
} = require('../predicates');

const { Print, print, ansiLabel } = require('../util');

const ConfigStore = require('../store/Config');
const { getLatest:getLatestConfig } = ConfigStore;
const ResultStore = require('../store/Results');
const { push:pushResult } = ResultStore;

const { inDebugMode } = require('../predicates');
const tty = require('../tty');

const maybeTransform = (result, fn = {}) =>
    (typeof fn.transformer === 'function')
        ? fn.transformer(result, { config: ConfigStore, results: ResultStore })
        : result;

const saveResult = (name, result, fn) => {
    const value = maybeTransform(result, fn);
    pushResult(set({}, name, value));
    return Promise.resolve(value);
};

function ttyStreamPrint(label, stream) {
    byline(stream).on('data', (buf) => print(label, buf.toString()));
}

function Result({ name, namespace, fn }) {
    const label = fn.label || name;
    const result = fn(getLatestConfig()[namespace] || {}, Print(label));
    if (hasOpFlag(fn)) return Promise.resolve(inDebugMode(name) ? '' : null);
    if (result == null) return saveResult(name, result, fn);
    if (!isReadableStream(result.stdout || result)) {
        if (isPromise(result)) return result.then((v) => saveResult(name, v, fn));
        return saveResult(name, result, fn);
    }
    const stream = result.stdout || result;
    const streamPromises = [ streamToPromise(stream) ];
    const prefix = `${ansiLabel(label)} `;
    if (tty.isTTY) {
        ttyStreamPrint(label, stream);
    } else {
        const stdoutLineWrapper = new LineWrapper({ prefix });
        stream.pipe(stdoutLineWrapper).pipe(process.stdout);
    }
    if (result.stderr) {
        if (tty.isTTY) {
            ttyStreamPrint(label, result.stderr);
        } else {
            const stderrLineWrapper = new LineWrapper({ prefix });
            result.stderr.pipe(stderrLineWrapper).pipe(process.stderr);
        }
        streamPromises.push(streamToPromise(result.stderr));
    }
    return Promise.all(streamPromises).then(([ stdout ]) => {
        const value = maybeTransform(stdout.toString().trim(), fn);
        saveResult(name, value, fn);
        return;
    });
}
