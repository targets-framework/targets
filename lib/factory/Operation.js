'use strict';

const {
    OP_FLAG,
    OP_PREFIX,
    FN_DELIM,
    ARG_DELIM
} = require('../constants');

const ConfigStore = require('../store/Config');
const ResultStore = require('../store/Results');

const Operation = (operations, operation) => {
    const [ name, argString ] = operation.split(FN_DELIM);
    const key = name.replace(OP_PREFIX, '');
    const args = (argString || '').split(ARG_DELIM).filter(v => v != null);
    const fn = () => (operations[key] || (() => 'unknown operation'))(...args, { config: ConfigStore, results: ResultStore });
    fn[operations[key].flag || OP_FLAG] = true;
    return { name: operation, fn, namespace: key };
};

module.exports = Operation;
