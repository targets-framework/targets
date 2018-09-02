'use strict';

const tty = require('./tty');
const { setting: { get:getSetting } } = require('./Store');

const spawnProcess = (cmd, args) => require('child_process').spawn(cmd, args);
const spawnTty = (cmd, args) => tty().spawnTerminal(cmd, args);

const spawnMode = {
    tty: spawnTty,
    ci: spawnProcess,
    dev: spawnProcess
};

const Spawn = () => spawnMode[getSetting('mode')];

module.exports = Spawn;
