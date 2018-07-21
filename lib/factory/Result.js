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

const { getLatestConfig } = require('../store/Config');

const ResultStore = require('../store/Results');

function Result({ name, namespace, fn }) {
    const result = fn(getLatestConfig()[namespace] || {}, Print(fn.label || name));
    if (hasFlag(fn)) return Promise.resolve('');
    if (result == null) {
        ResultStore.push(set({}, name, result));
        return Promise.resolve('');
    }
    if (!isReadableStream(result.stdout || result)) {
        if (isPromise(result)) return result.then((v) => {
            ResultStore.push(set({}, name, v));
            return v;
        });
        ResultStore.push(set({}, name, result));
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
        ResultStore.push(set({}, name, value));
        return result;
    });
}
