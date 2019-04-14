'use strict';

// TODO: remove this, prefer a proper EL
const { VM } = require('vm2');

const evaluate = exports.evaluate = (statement, sandbox) => new VM({ sandbox }).run(statement);

exports.predicate = (statement, sandbox) => {
    try {
        return evaluate(statement, sandbox);
    } catch {
        return false;
    }
};
