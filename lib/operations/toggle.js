'use strict';

const { on, off, SILENT_TOGGLE:SILENT } = require('../Toggle');
const { DEBUG } = require('../debug');

const Toggle = (name) => (v) => {
    const fns = {
        'on': () => on(name),
        'off': () => off(name)
    };
    if (fns[v]) fns[v]();
    return;
};

const silent = Toggle(SILENT);
const debug = Toggle(DEBUG);

module.exports = {
    silent,
    debug
};
