'use strict';

const FN_FLAG = exports.FN_FLAG = Symbol('fn');
const PARALLEL_FLAG = exports.PARALLEL_FLAG = Symbol('parallel');

const BINDING_FLAG = exports.BINDING_FLAG = Symbol('binding');
const OP_FLAG = exports.OP_FLAG = Symbol('operation');

const FLAGS = {
    fn: FN_FLAG,
    parallel: PARALLEL_FLAG,
    binding: BINDING_FLAG,
    op: OP_FLAG
};

class Operation {
    static [Symbol.hasInstance](s) {
        return [ BINDING_FLAG, OP_FLAG ].reduce((a, f) => a || f === s, false);
    }
}

exports.Operation = Operation;

exports.hasOpFlag = (subject) => Object.getOwnPropertySymbols(subject).reduce((acc, sym) => acc || sym instanceof Operation, false);
exports.hasFlag = (subject, flagName) => !!subject[FLAGS[flagName]];
exports.flag = (subject, flagName) => subject[FLAGS[flagName]] = true;
