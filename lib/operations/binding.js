'use strict';

const { tag } = require('../tags');
const Unit = require('../Unit');
const { isArray, isObject } = require('../util');
const { deepmerge:merge } = require('sugarmerge');
const { registerLabel } = require('../print');
const { ScheduledUnit } = require('../Scheduler');

const bind = (fromPath, toPath, { Store: { get, set } }) => set(toPath ? toPath : 'config', get(fromPath));
tag(bind, 'binding');

const bindTo = (fromPath, ...rest) => {
    const [ targetName, { targets, Store: { get }, ...restContext } ] = rest;
    const ns = targetName.split('.').shift();
    const boundFn = (fromValue) => (c) => {
        fromValue = fromValue || get(fromPath, {});
        if (isArray(fromValue)) {
            const composition = fromValue.map(fv => boundFn(fv)(c));
            tag(composition, 'parallel');
            return ScheduledUnit(composition);
        } else if (!isObject(fromValue)) {
            throw new Error(`bind-to target error: value at ${fromPath} must be an object but instead was ${fromValue}.`);
        } else {
            const boundConfig = {
                [ns]: merge(c, fromValue)
            };
            const unit = Unit({
                arg: targets[targetName],
                name: targetName,
                targets,
                ...restContext,
                config: boundConfig
            });
            registerLabel(unit.label || unit.name);
            return ScheduledUnit(unit);
        }
    };
    const unit = Unit({ arg: boundFn(), targets, silent: true, name: targetName, ...restContext });
    registerLabel(unit.label || unit.name);
    return unit;
};
tag(bindTo, 'target');

module.exports = {
    bind,
    'bind-to': bindTo
};
