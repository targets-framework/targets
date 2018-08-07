'use strict';

module.exports = CompositionLoader;

const { flag } = require('../flags');

function CompositionLoader({ spec, parallel = false, config = {} }) {
    if (parallel) flag(spec, 'parallel');
    if (config != null) spec.config = config;
    return spec;
}
