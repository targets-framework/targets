'use strict';

const { settingStore } = require('./GlobalSymbols');
const SettingStore = global[settingStore] = {};
const set = exports.set = (prop, value) => SettingStore[prop] = value;
exports.get = (prop) => SettingStore[prop];

function loadFromOptions({ '--':targs = [] }) {
    if (targs.includes('--tty')) return set('mode', 'tty');
    if (targs.includes('--ci')) return set('mode', 'ci');
    set('mode', 'dev');
}

exports.loadFromOptions = loadFromOptions;
