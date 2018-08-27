'use strict';

const notNil = exports.notNil = v => v != null;

const or = exports.or = (v, f) => notNil(v) ? v : f;

exports.orObject = v => or(v, {});

exports.isObject = v => notNil(v) && !Array.isArray(v) && typeof v === 'object';

exports.clone = v => JSON.parse(JSON.stringify(v));

const copyKeys = exports.copyKeys = (from, to) => {
    Object.defineProperties(to, Object.getOwnPropertyDescriptors(from));
    const symbols = Object.getOwnPropertySymbols(from);
    let i = symbols.length;
    while (i--) to[symbols[i]] = from[symbols[i]];
    return to;
};

exports.cloneFn = (fn) => copyKeys(fn, fn.bind({}));
