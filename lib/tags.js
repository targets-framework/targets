'use strict';

const TARGET_TAG = exports.TARGET_TAG = Symbol('target');
const PARALLEL_TAG = exports.PARALLEL_TAG = Symbol('parallel');

const BINDING_TAG = exports.BINDING_TAG = Symbol('binding');
const OP_TAG = exports.OP_TAG = Symbol('op');

const TAGS = {
    target: TARGET_TAG,
    parallel: PARALLEL_TAG,
    binding: BINDING_TAG,
    op: OP_TAG
};

const operationTags = [ BINDING_TAG, OP_TAG ];
exports.hasOperationTag = (subject) => Object.getOwnPropertySymbols(subject).reduce((acc, sym) =>
    acc || operationTags.reduce((a, f) => a || f === sym, false), false);

exports.hasTag = (subject, tagName) => !!subject[TAGS[tagName]];

exports.tag = (subject, tagName) => subject[TAGS[tagName]] = true;
