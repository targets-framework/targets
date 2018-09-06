'use strict';

const { tag } = require('../tags');
const Unit = require('../Unit');
const { isBoolean } = require('../util');

const test = (get, toggle, fromPath, toPath = false) => {
    const value = get(fromPath, toggle);
    const compare = toPath
        ? get(toPath, toPath)
        : toggle;
    const test = isBoolean(compare)
        ? value && ![ '0', 'false' ].includes(value)
        : compare == value;
    const result = toggle
        ? !test
        : test;
    return {
        result,
        reason: `${fromPath} (${value}) ${toPath ? `${toggle ? '!=' : '=='} ${toPath} (${compare})` : `is ${toggle ? 'falsy' : 'truthy'}`}`
    };
};

const When = (name, toggle = false) => (fromPath, ...rest) => {
    const {
        targets,
        config,
        predicates = [],
        Store: { get },
        ...restContext
    } = rest.pop();

    const targetName = rest.pop();

    const predicate = () => test(get, toggle, fromPath, rest.pop());

    return Unit({ arg: targets[targetName], targets, config, predicates: [ ...predicates, predicate ], name: targetName, ...restContext });
};

const when = When('when');
tag(when, 'target');

const whenNot = When('when-not', true);
tag(whenNot, 'target');

const Exit = (name, toggle = false) => (fromPath, ...rest) => {
    const { Store: { get } } = rest.pop();
    const { result, reason } = test(get, toggle, fromPath, rest.pop());
    if (result) {
        console.log(`Exiting. Reason: @${name} - ${reason}`);
        process.exit();
    }
};

const exitWhen = Exit('exit-when');
tag(exitWhen, 'binding');

const proceedWhen = Exit('proceed-when', true);
tag(proceedWhen, 'binding');

module.exports = {
    when,
    'when-not': whenNot,
    'exit-when': exitWhen,
    'proceed-when': proceedWhen
};
