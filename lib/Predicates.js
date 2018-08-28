'use strict';

const { runPredicate } = require('./evaluate');

const { get } = require('./Store');

const { isObject } = require('./util');

const Context = (ns) => {
    const { config:latestConfig, result:latestResult } = get();
    const config = ns == null
        ? latestConfig
        : latestConfig[ns];
    const result = ns == null
        ? latestResult
        : latestResult[ns];
    return { config, result };
};

const Predicates = (predicates = []) => predicates.map(p => {
    if (typeof p === 'function') return (ns) => {
        const rtn = p(Context(ns));
        if (isObject(rtn) && rtn.result != null && rtn.reason != null) return rtn;
        return { result: rtn, reason: p.toString() };
    };
    if (typeof p === 'string') return (ns) => ({ result: runPredicate(p, Context(ns)), reason: p });
    return () => ({ result: true });
});

module.exports = Predicates;
