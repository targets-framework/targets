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

exports.hasTag = (subject = {}, tagName) => !!subject[TAGS[tagName]];

exports.tag = (subject, tagName) => subject[TAGS[tagName]] = true;
