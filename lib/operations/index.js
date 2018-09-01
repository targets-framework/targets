'use strict';

const binding = require('./binding');
const predicate = require('./predicate');
const toggle = require('./toggle');
const noop = require('./noop');
const log = require('./log');

module.exports = {
    ...binding,
    ...predicate,
    ...toggle,
    ...noop,
    ...log
};
