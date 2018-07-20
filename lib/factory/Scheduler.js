'use strict';

module.exports = Scheduler;

const Result = require('./Result');

const {
    getLatestConfig
} = require('../store/ConfigStore');

const {
    isReservedNs
} = require('../predicates');

const Print = require('./Print');
const { printer } = Print;

function UnitOfWork(unit) {
    const config = getLatestConfig();
    if (typeof unit.fn === 'function') return Result(unit.name, unit.namespace, unit.fn(config[unit.namespace] || {}, Print(unit.fn.label || unit.name)))
        .then(r => ({ silent: !!unit.fn.silent, label: unit.fn.label || unit.name, value: r, stream: !!(r||{}).__stream__ }))
        .then(r => r.stream || isReservedNs(unit.namespace) || printer(r));
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
