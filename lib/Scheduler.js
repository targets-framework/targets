'use strict';

module.exports = Scheduler;

const Executor = require('./Executor');
const { hasOperationTag, hasTag } = require('./tags');
const tty = require('./tty');
const SettingStore = require('./Setting');
const printUtil = require('./print');
const { printUnit } = printUtil;
const debug = require('./debug');

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

const maybePrint = unit => {
    const { stream = false, fn = {} } = unit;
    return stream || hasOperationTag(fn) || printUnit(unit);
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
    if (debug.inDebugMode(name)) {
        //const { inspect } = require('util');
        //const { print } = printUtil;
        //const { DEBUG } = debug;
        //print(DEBUG, `Scheduling '${name}' as:`);
        //print(DEBUG, inspect(Pretty(unit), { depth: null, colors: true }));
        //print(DEBUG, `Current config is:`);
        //print(DEBUG, inspect(getLatestConfig(), { depth: null, colors: true }));
        //print(DEBUG, `Current result is:`);
        //print(DEBUG, inspect(getLatestResult(), { depth: null, colors: true }));
    }
};

function ScheduledUnit(unit = {}) {
    if (Array.isArray(unit)) {
        return (hasTag(unit, 'parallel'))
            ? Promise.all(unit.map(ScheduledUnit))
            : unit
                .map((u) => () => ScheduledUnit(u))
                .reduce((c, fn) => c.then(acc => fn().then(value => [ ...acc, value ])), Promise.resolve([]));
    } else {
        maybeDebug(unit);
        if (typeof unit.fn === 'function') {
            DashboardUpdate()(unit.name, 'started', 'yellow-fg');
            return Executor(unit)
                .then((r) => (DashboardUpdate()(unit.name, 'done', 'green-fg'),r))
                .then(PackageResult(unit))
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
