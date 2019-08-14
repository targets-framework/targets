'use strict';

function isPromise(obj) {
    return !!obj &&
        (typeof obj === 'object' || typeof obj === 'function') &&
        typeof obj.then === 'function';
}

function isReadableStream(stream) {
    return stream !== null &&
        typeof stream === 'object' &&
        typeof stream.pipe === 'function' &&
        stream.readable !== false &&
        typeof stream._read === 'function' &&
        typeof stream._readableState === 'object';
}

function prefixOptions(argv) {
    return argv.reduce((acc, arg) => {
        const { done, a } = acc;
        if (/^--$/.test(arg)) return { done: true, a: [ ...a, arg ] };
        if (!done && /^--.*/.test(arg)) arg = `--input.${arg.slice(2)}`;
        return { done, a: [ ...a, arg ] };
    }, { done: false, a: [] }).a;
}

module.exports = {
    isPromise,
    isReadableStream,
    prefixOptions
};
