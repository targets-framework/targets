'use strict';

module.exports = processTargetArgs;

const SettingStore = require('./store/Setting');

function processTargetArgs({ '--':targs = [] }) {
    if (targs.includes('--tty')) return SettingStore.set('mode', 'tty');
    if (targs.includes('--ci')) return SettingStore.set('mode', 'ci');
    SettingStore.set('mode', 'dev');
}
