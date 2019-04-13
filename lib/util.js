'use strict';

const notNil = exports.notNil = v => v != null;

const isArray = exports.isArray = v => Array.isArray(v);

exports.isObject = v => notNil(v) && !isArray(v) && typeof v === 'object';

exports.isString = v => typeof v === 'string';

exports.isFunction = v => typeof v === 'function';

exports.isNumber = v => typeof v === 'function';

exports.isBoolean = v => typeof v === 'boolean';

exports.orObject = v => notNil(v) ? v : {};

const copyKeys = exports.copyKeys = (f, t) => {
    Object.defineProperties(t, Object.getOwnPropertyDescriptors(f));
    const symbols = Object.getOwnPropertySymbols(f);

    let i = symbols.length;
    while (i--) t[symbols[i]] = f[symbols[i]];

    return t;
};

exports.cloneFn = fn => copyKeys(fn, fn.bind({}));

exports.tap = fn => v => (fn(),v);
