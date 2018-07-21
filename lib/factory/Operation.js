'use strict';

const {
    OP_FLAG,
    OP_PREFIX,
    FN_DELIM,
    ARG_DELIM
} = require('../constants');

const Operation = (operations, operation) => {
    const [ name, argString ] = operation.split(FN_DELIM);
    const key = name.replace(OP_PREFIX, '');
    const args = (argString || '').split(ARG_DELIM);
    const fn = () => (operations[key] || (() => 'unknown operation'))(...args);
    fn[fn.flag || OP_FLAG] = true;
    return { name, fn, namespace: key };
};

module.exports = Operation;
