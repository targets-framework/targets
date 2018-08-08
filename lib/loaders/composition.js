'use strict';

module.exports = CompositionLoader;

const { mark } = require('../marks');

function CompositionLoader({ spec, parallel = false, config = {}, predicates = [] }) {
    if (parallel) mark(spec, 'parallel');
    if (config != null) spec.config = config;
    if (predicates != null) spec.predicates = predicates;
    return spec;
}
