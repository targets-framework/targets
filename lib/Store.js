'use strict';

const { stateStore } = require('./GlobalSymbols');

const { set } = require('sugarmerge');

const {
    deepClone,
    get,
    or
} = require('needful');

const Store = global[stateStore] = [];

const defaults = {
    config: {},
    result: {},
    setting: {
        mode: 'dev',
        'label-style': 'default'
    }
};

const getPrevious = exports.getPrevious = (n = 1) => deepClone(or(Store[Store.length - n], defaults));
const getLatest = exports.getLatest = () => getPrevious();

const Set = exports.Set = (prefix) => (...args) => {
    const value = args.pop();
    return args.length
        ? Store.push(set(getLatest(), `${prefix ? `${prefix}.` : ''}${args.pop()}`, value))
        : prefix
            ? Store.push(set(getLatest(), prefix, value))
            : Store.push(set({ shim: getLatest() }, 'shim', value || {}).shim);
};

const Get = exports.Get = (prefix) => (keypath, fallback) => keypath
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

exports.setting = {
    set: Set('setting'),
    get: Get('setting')
};

function settingsFromArgv(argv = []) {
    const settings = {};
    if (require('ci-info').isCI) settings.mode = 'ci';
    if (argv.includes('--tty')) settings.mode = 'tty';
    if (argv.includes('--ci')) settings.mode = 'ci';
    if (argv.includes('--aligned')) settings['label-style'] = 'aligned';
    return settings;
}

exports.settingsFromArgv = settingsFromArgv;

exports.prefixOptions = argv => argv.reduce((acc, arg) => {
    const { done, a } = acc;

    if (/^--$/.test(arg)) return { done: true, a: [ ...a, arg ] };

    if (!done) {
        if (/^--.*/.test(arg)) arg = `--config.${arg.slice(2)}`;
    }

    return { done, a: [ ...a, arg ] };

}, { done: false, a: [] }).a;

Set()(defaults);
