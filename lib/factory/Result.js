'use strict';

module.exports = Result; 
const { set } = require('lodash');
const streamToPromise = require('stream-to-promise');
const LineWrapper = require('stream-line-wrapper');

const {
    hasFlag,
    isReadableStream,
    isPromise
} = require('../predicates');

const Print = require('./Print');
const { ansiLabel } = Print;

const ConfigStore = require('../store/Config');
const { getLatest:getLatestConfig } = ConfigStore;
const ResultStore = require('../store/Results');
const { push:pushResult } = ResultStore;

const { inDebugMode } = require('../predicates');

const maybeTransform = (result, fn = {}) =>
    (typeof fn.transformer === 'function')
        ? fn.transformer(result, { config: ConfigStore, results: ResultStore })
        : result;

const saveResult = (name, result, fn) => {
    const value = maybeTransform(result, fn);
    pushResult(set({}, name, value));
    return Promise.resolve(value);
};

function Result({ name, namespace, fn }) {
    const result = fn(getLatestConfig()[namespace] || {}, Print(fn.label || name));
    if (hasFlag(fn)) return Promise.resolve(inDebugMode(name) ? '' : null);
    if (result == null) return saveResult(name, result, fn);
    if (!isReadableStream(result.stdout || result)) {
        if (isPromise(result)) return result.then((v) => saveResult(name, v, fn));
        return saveResult(name, result, fn);
    }
    const stream = result.stdout || result;
    const streamPromises = [ streamToPromise(stream) ];
    const prefix = `${ansiLabel(fn.label || name)} `;
    const stdoutLineWrapper = new LineWrapper({ prefix });
    stream.pipe(stdoutLineWrapper).pipe(process.stdout);
    if (result.stderr) {
        const stderrLineWrapper = new LineWrapper({ prefix });
        result.stderr.pipe(stderrLineWrapper).pipe(process.stderr);
        streamPromises.push(streamToPromise(result.stderr));
    }
    return Promise.all(streamPromises).then(([ stdout ]) => {
        const value = maybeTransform(stdout.toString().trim(), fn);
        saveResult(name, value, fn);
        return result;
    });
}
