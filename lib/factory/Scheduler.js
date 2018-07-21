'use strict';

module.exports = Scheduler;

const isObject = require('lodash/isObject');

const Result = require('./Result');

const {
    hasFlag
} = require('../predicates');

const { printUnit, print } = require('./Print');
const { inDebugMode } = require('../predicates');
const {
    DEBUG_TOGGLE:DEBUG
} = require('../constants');
const { inspect } = require('util');

const PackageResult = unit => value => ({
    silent: !!unit.fn.silent,
    label: unit.fn.label || unit.name,
    value,
    stream: !!(value||{}).__stream__
});

const maybePrint = unit => {
    const { stream = false, fn = {} } = unit;
    return stream || hasFlag(fn) || printUnit(unit);
};

const Loggable = (obj) => {
    return inspect(
        isObject(obj)
          ? Object.entries(obj).reduce((acc, [ key, value ]) => {
                if (typeof value === 'function') {
                    acc[key] = value.toString();
                    Object.entries(value).forEach(([ k, v ]) => {
                        acc[`${key}.${k}`] = Loggable(v);
                    });
                    return acc;
                }
                return acc;
            }, {})
          : obj,
    { depth: null, colors: true });
};

const maybeDebug = (unit = {}) => {
    const { name } = unit;
    if (inDebugMode(name)) {
        print(DEBUG, `Scheduling '${name}' as:`);
        print(DEBUG, Loggable(unit));
    }
};

function UnitOfWork(unit = {}) {
    if (Array.isArray(unit)) return Promise.all(unit.map((entry) =>
        UnitOfWork(entry)));
    maybeDebug(unit);
    if (typeof unit.fn === 'function') return Result(unit)
        .then(PackageResult(unit))
        .then(maybePrint);
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
