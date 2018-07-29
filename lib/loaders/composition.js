'use strict';

module.exports = CompositionLoader;

const { PARALLEL_FLAG } = require('../constants');

function CompositionLoader({ spec, parallel = false, config = {} }) {
    if (parallel) spec[PARALLEL_FLAG] = true;
    if (config != null) spec.config = config;
    return spec;
}
