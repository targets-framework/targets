'use strict';

const TARGET_MARK = exports.TARGET_MARK = Symbol('target');
const PARALLEL_MARK = exports.PARALLEL_MARK = Symbol('parallel');

const BINDING_MARK = exports.BINDING_MARK = Symbol('binding');
const OP_MARK = exports.OP_MARK = Symbol('op');

const MARKS = {
    target: TARGET_MARK,
    parallel: PARALLEL_MARK,
    binding: BINDING_MARK,
    op: OP_MARK
};

const operationMarks = [ BINDING_MARK, OP_MARK ];
exports.hasOperationMark = (subject) => Object.getOwnPropertySymbols(subject).reduce((acc, sym) =>
    acc || operationMarks.reduce((a, f) => a || f === sym, false), false);

exports.hasMark = (subject, markName) => !!subject[MARKS[markName]];

exports.mark = (subject, markName) => subject[MARKS[markName]] = true;
