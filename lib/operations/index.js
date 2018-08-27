'use strict';

const { on, off, SILENT_TOGGLE:SILENT } = require('../Toggle');
const { DEBUG } = require('../debug');
const { tag } = require('../tags');
const Target = require('../Target');
const Unit = require('../Unit');

const bind = (fromPath, toPath, { Store: { get, set } }) => set(toPath, get(fromPath));
tag(bind, 'binding');

const Exit = (name, toggle = false) => (fromPath, ...rest) => {
    const { Store: { get } } = rest.pop();
    const toPath = rest.pop();
    const value = get(fromPath, toggle);
    const compare = toPath
        ? get(toPath, toPath)
        : toggle;
    const test = typeof compare === 'boolean'
        ? value && ![ '0', 'false' ].includes(value)
        : compare == value;
    const result = toggle
        ? !test
        : test;
    if (result) {
        console.log(`Exiting. Reason: @${name} - ${fromPath}:${value} ${toPath ? `${toggle ? '!=' : '=='} ${toPath}:${compare}` : `is ${toggle ? 'falsy' : 'truthy'}`}`);
        process.exit();
    }
};

const exitWhen = Exit('exit-when');
tag(exitWhen, 'binding');

const proceedWhen = Exit('proceed-when', true);
tag(proceedWhen, 'binding');

const When = (name, toggle = false) => (fromPath, ...rest) => {
    const { targets, config, predicates = [], Store: { get }, ...restContext } = rest.pop();
    const targetName = rest.pop();
    const predicate = () => {
        const value = get(fromPath, toggle);
        const toPath = rest.pop();
        const compare = toPath
            ? get(toPath, toPath)
            : toggle;
        const test = typeof compare === 'boolean'
            ? value && ![ '0', 'false' ].includes(value)
            : compare == value;
        const result = toggle
            ? !test
            : test;
        return { result, reason: `${fromPath}:${value} ${toPath ? `${toggle ? '!=' : '=='} ${toPath}:${compare}` : `is ${toggle ? 'falsy' : 'truthy'}`}` };
    };
    return Unit({ arg: targets[targetName], targets, config, predicates: [ ...predicates, predicate ], name: targetName, ...restContext });
};

const when = When('when');
tag(when, 'target');

const whenNot = When('when-not', true);
tag(whenNot, 'target');

const log = (fromPath, { Store: { get } }) => Target({ fn: () => get(fromPath, fromPath), name: '@log' });
tag(log, 'target');

const binding = {
    bind,
    when,
    'when-not': whenNot,
    'exit-when': exitWhen,
    'proceed-when': proceedWhen,
    log
};

const ToggleOp = (name) => (v) => {
    const fns = {
        'on': () => on(name),
        'off': () => off(name)
    };
    if (fns[v]) fns[v]();
    return;
};

const toggles = {
    'silent': ToggleOp(SILENT),
    'debug': ToggleOp(DEBUG)
};

const special = {
    'prompts': () => {},
    'optional-prompts': () => {},
};

const operations = {
    ...binding,
    ...toggles,
    ...special
};

module.exports = operations;
