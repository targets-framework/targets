'use strict';

module.exports = CompositionLoader;

const { tag } = require('../tags');

function CompositionLoader({ spec, parallel = false, config = {}, predicates = [] }) {
    if (parallel) tag(spec, 'parallel');
    if (config != null) spec.config = config;
    if (predicates != null) spec.predicates = predicates;
    return spec;
}
