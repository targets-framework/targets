'use strict';

module.exports = Scheduler;

const Result = require('./Result');

const {
    hasFlag
} = require('../predicates');

const { printUnit, print } = require('./Print');
const { get:getToggle } = require('../store/Toggles');
const {
    OP_PREFIX,
    DEBUG_TOGGLE:DEBUG } = require('../constants');
const { inspect } = require('util');

function UnitOfWork(unit = {}) {
    if (getToggle(DEBUG) && unit.name !== `${OP_PREFIX}${DEBUG}/off`) {
        print(DEBUG, 'Scheduling...');
        print(DEBUG, inspect(unit, { depth: null, colors: true }));
    }
    if (typeof unit.fn === 'function') return Result(unit)
        .then(r => ({ silent: !!unit.fn.silent, label: unit.fn.label || unit.name, value: r, stream: !!(r||{}).__stream__ })) // TODO: clean up this mess
        .then(r => r.stream || hasFlag(unit.fn) || printUnit(r));
    if (Array.isArray(unit)) return Promise.all(unit.map((entry) =>
        UnitOfWork(entry)));
    return;
}

async function* Scheduler(queue) {
    while (queue.length > 0) {
        try {
            yield UnitOfWork(queue.shift());
        } catch (e) {
            console.error('Caught promise rejection. Exiting now.', e);
            process.exit(1);
        }
    }
}
