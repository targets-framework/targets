'use strict';

const notNil = exports.notNil = v => v != null;

exports.orObject = v => notNil(v) ? v : {};

exports.isObject = v => notNil(v) && typeof v === 'object';

exports.clone = v => JSON.parse(JSON.stringify(v));

const copyKeys = exports.copyKeys = (from, to) => {
    Object.defineProperties(to, Object.getOwnPropertyDescriptors(from));
    const symbols = Object.getOwnPropertySymbols(from);
    let i = symbols.length;
    while (i--) to[symbols[i]] = from[symbols[i]];
    return to;
};

exports.cloneFn = (fn) => copyKeys(fn, fn.bind({}));
