'use strict';

module.exports = CompositionLoader;

const { tag } = require('../tags');

function CompositionLoader({ spec, alias, parallel = false, config = {}, predicates = [], silent }) {
    if (parallel) tag(spec, 'parallel');
    spec.config = config;
    spec.predicates = predicates;
    if (typeof silent === 'boolean') spec.silent = silent;
    if (typeof alias === 'string') spec.alias = alias;
    return spec;
}
