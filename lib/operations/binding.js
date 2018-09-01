'use strict';

const { tag } = require('../tags');
const Unit = require('../Unit');
const { isFunction, isObject } = require('../util');
const { deepmerge:merge } = require('sugarmerge');

const bind = (fromPath, toPath, { Store: { get, set } }) => set(toPath, get(fromPath));
tag(bind, 'binding');

const bindTo = (fromPath, targetName, { targets, Store: { get }, ...restContext }) => {
    const ns = targetName.split('.').shift();
    if (!isFunction(targets[targetName])) throw new Error('bind-to can only operate on functions');
    const boundFn = (c, ...args) => {
        const fromValue = get(fromPath, {});
        if (!isObject(fromValue)) throw new Error(`bind-to target error: value at ${fromPath} must be an object but instead was ${fromValue}.`);
        const boundConfig = { [ns]: fromValue };
        return targets[targetName](merge(c, boundConfig), ...args);
    };
    return Unit({ arg: boundFn, targets, name: targetName, ...restContext });
};
tag(bindTo, 'target');

module.exports = {
    bind,
    'bind-to': bindTo
};
