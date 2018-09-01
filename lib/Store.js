'use strict';

const { stateStore } = require('./GlobalSymbols');

const { clone, or } = require('./util');

const { set } = require('sugarmerge');
const get = require('lodash/get');

const Store = global[stateStore] = [];

const initialState = { config: {}, result: {} };
const getPrevious = exports.getPrevious = (n = 1) => clone(or(Store[Store.length - n], initialState));
const getLatest = exports.getLatest = () => getPrevious();

const Set = (prefix) => (...args) => {
    const value = args.pop();
    return args.length
        ? Store.push(set(getLatest(), `${prefix ? `${prefix}.` : ''}${args.pop()}`, value))
        : prefix
            ? Store.push(set(getLatest(), prefix, value))
            : Store.push(set({ shim: getLatest() }, 'shim', value || {}).shim);
};

const Get = (prefix) => (keypath, fallback) => keypath
    ? get(getLatest(), `${prefix ? `${prefix}.` : ''}${keypath}`, fallback)
    : getLatest();

exports.set = Set();
exports.get = Get();

exports.config = {
    set: Set('config'),
    get: Get('config')
};

exports.result = {
    set: Set('result'),
    get: Get('result')
};

