'use strict';

module.exports = Scheduler;

const Result = require('./Result');
const { hasOpFlag } = require('../predicates');
const { printUnit, print } = require('./Print');
const { inDebugMode } = require('../predicates');
const { DEBUG_TOGGLE:DEBUG, PARALLEL_FLAG } = require('../constants');
const { inspect } = require('util');

const PackageResult = unit => value => ({
    silent: !!unit.fn.silent,
    label: unit.fn.label || unit.name,
    value,
    stream: !!(value||{}).__stream__
});

const maybePrint = unit => {
    const { stream = false, fn = {} } = unit;
    return stream || hasOpFlag(fn) || printUnit(unit);
};

const Pretty = v => {
    if (typeof v !== 'object' || v == null) return `${v}`;
    return Object.entries(v)
        .reduce((acc, [ key, value ]) => {
            if (typeof value !== 'function') return acc;
            acc[key] = value.toString();
            return Object.entries(value)
                .reduce((a, [ k, v ]) => (a[`${key}.${k}`] = Pretty(v), a), acc);
        }, {});
};

const maybeDebug = (unit = {}) => {
    const { name } = unit;
    if (inDebugMode(name)) {
        print(DEBUG, `Scheduling '${name}' as:`);
        print(DEBUG, inspect(Pretty(unit), { depth: null, colors: true }));
    }
};

function UnitOfWork(unit = {}) {
    if (Array.isArray(unit)) {
        if (unit[PARALLEL_FLAG]) return Promise.all(unit.map(UnitOfWork));
        return unit
            .map((u) => () => UnitOfWork(u))
            .reduce((c, fn) => c.then(acc => fn().then(value => [ ...acc, value ])), Promise.resolve([]));
    } else {
        maybeDebug(unit);
        if (typeof unit.fn === 'function') return Result(unit)
            .then(PackageResult(unit))
            .then(maybePrint);
    }
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
