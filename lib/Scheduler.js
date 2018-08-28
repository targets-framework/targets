'use strict';

module.exports = Scheduler;

const Executor = require('./Executor');
const { hasTag } = require('./tags');
const tty = require('./tty');
const SettingStore = require('./Setting');
const { inspect } = require('util');
const { isArray, isFunction, tap } = require('./util');
const { printUnit, print } = require('./print');
const { inDebugMode, DEBUG } = require('./debug');
const Store = require('./Store');

const QueuedNames = (queue) => (queue.name)
    ? queue.name
    : queue.reduce((acc, unit) => {
        if (Array.isArray(unit)) {
            return (hasTag(unit, 'parallel'))
                ? [ ...acc, QueuedNames(unit) ]
                : [ ...acc, ...QueuedNames(unit) ];
        }
        return [ ...acc, unit.name ];
    }, []);

const QueueReport = (names) => {
    if (typeof names === 'string') return names;
    if (Array.isArray(names)) return names.reduce((acc, v) => (Array.isArray(v))
            ? `${acc}[${QueueReport(v).slice(0, -1).replace(new RegExp( "\\n", "g" ), ',')}]\n`
            : `${acc}${v}\n`,
        '');
};

const updateQueueReport = (queue) => {
    const { queueReport } = tty();
    queueReport.setContent(QueueReport(QueuedNames(queue)));
};

const updateDashboard = (name, msg, tag) => {
    const { dashboard } = tty();
    dashboard.addLine(`${name} - {${tag}}${msg}{/${tag}}`);
    dashboard.scroll(1);
};

const modes = {
    tty: {
        updateQueueReport,
        updateDashboard
    },
    ci: {
        updateQueueReport: () => {},
        updateDashboard: () => {}
    },
    dev: {
        updateQueueReport: () => {},
        updateDashboard: () => {}
    }
};

const DashboardUpdate = () => modes[SettingStore.get('mode')].updateDashboard;
const QueueReportUpdate = () => modes[SettingStore.get('mode')].updateQueueReport;

const PackageResult = ({ silent, label }) => value => ({
    silent,
    label,
    value,
    stream: !!(value || {}).__stream__
});

const maybeDebug = (unit = {}, type) => {
    const { name, ns, fn } = unit;
    if (inDebugMode(name) && !hasTag(fn, 'op')) {
        print(DEBUG, `${type}["${ns}"] is:`);
        print(DEBUG, inspect(Store[type].get(ns), { depth: null, colors: true }));
    }
};

const maybePrint = unit => {
    const { stream = false, fn = {} } = unit;
    return stream || hasTag(fn, 'op') || printUnit(unit);
};

function ScheduledUnit(unit = {}) {
    if (isArray(unit)) {
        return (hasTag(unit, 'parallel'))
            ? Promise.all(unit.map(ScheduledUnit))
            : unit
                .map((u) => () => ScheduledUnit(u))
                .reduce((c, fn) => c.then(acc => fn().then(value => [ ...acc, value ])), Promise.resolve([]));
    } else {
        maybeDebug(unit, 'config');
        if (isFunction(unit.fn)) {
            DashboardUpdate()(unit.name, 'started', 'yellow-fg');
            return Executor(unit)
                .then(tap(() => DashboardUpdate()(unit.name, 'done', 'green-fg')))
                .then(PackageResult(unit))
                .then(tap(() => maybeDebug(unit, 'result')))
                .then(maybePrint);
        }
    }
}

async function* Scheduler(queue) {
    QueueReportUpdate()(queue);
    while (queue.length > 0) {
        try {
            yield ScheduledUnit(queue.shift());
        } catch (e) {
            console.error('Caught promise rejection. Exiting now.', e);
            process.exit(1);
        }
    }
}
