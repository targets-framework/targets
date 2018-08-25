'use strict';

const { VM } = require('vm2');

const evaluate = exports.evaluate = (statement, sandbox) => new VM({ sandbox }).run(statement);

exports.runPredicate = (statement, sandbox) => {
    try {
        return evaluate(statement, sandbox);
    } catch {
        return false;
    }
};
