'use strict';

module.exports = Scheduler;

const Executor = require('./Executor');

const { hasOpFlag, hasFlag } = require('./flags');
const { printUnit, print } = require('./util');
const { inDebugMode } = require('./predicates');
const { DEBUG_TOGGLE:DEBUG } = require('./constants');
const { inspect } = require('util');
const tty = require('./tty');
const { getLatest:getLatestConfig } = require('./store/Config');
const { getLatest:getLatestResult } = require('./store/Result');
const SettingStore = require('./store/Setting');

const QueueNames = (queue) => (queue.name)
    ? queue.name
    : queue.reduce((acc, u) => {
        if (Array.isArray(u)) {
            return (hasFlag(u, 'parallel'))
                ? [ ...acc, QueueNames(u) ]
                : [ ...acc, ...QueueNames(u) ];
        }
        return [ ...acc, u.name ];
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
    queueReport.setContent(QueueReport(QueueNames(queue)));
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
        print(DEBUG, `Current config is:`);
        print(DEBUG, inspect(getLatestConfig(), { depth: null, colors: true }));
        print(DEBUG, `Result config is:`);
        print(DEBUG, inspect(getLatestResult(), { depth: null, colors: true }));
    }
};

function UnitOfWork(unit = {}) {
    if (Array.isArray(unit)) {
        return (hasFlag(unit, 'parallel'))
            ? Promise.all(unit.map(UnitOfWork))
            : unit
                .map((u) => () => UnitOfWork(u))
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
            yield UnitOfWork(queue.shift());
        } catch (e) {
            console.error('Caught promise rejection. Exiting now.', e);
            process.exit(1);
        }
    }
}
