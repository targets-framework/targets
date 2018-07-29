'use strict';

module.exports = processTargetArgs;

const SystemStore = require('./store/System');

function processTargetArgs(targs = []) {
    if (targs.includes('--tty')) return SystemStore.set('mode', 'tty');
    if (targs.includes('--ci')) return SystemStore.set('mode', 'ci');
    SystemStore.set('mode', 'dev');
}
