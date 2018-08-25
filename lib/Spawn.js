'use strict';

module.exports = Spawn;

const tty = require('./tty');
const SettingStore = require('./Setting');

const spawnProcess = (cmd, args) => require('child_process').spawn(cmd, args);
const spawnTty = (cmd, args) => tty().spawnTerminal(cmd, args);

const spawnMode = {
    tty: spawnTty,
    ci: spawnProcess,
    dev: spawnProcess
};

function Spawn() {
    return spawnMode[SettingStore.get('mode')];
}
