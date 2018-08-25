'use strict';

module.exports = CompositionLoader;

const { tag } = require('../tags');

function CompositionLoader({ spec, parallel = false, config = {}, predicates = [], silent }) {
    if (parallel) tag(spec, 'parallel');
    spec.config = config;
    spec.predicates = predicates;
    if (silent != null) spec.silent = silent;
    return spec;
}
