'use strict';

module.exports = YAMLTarget;

const fs = require('fs');
const YAML = require('js-yaml');
const ShellTarget = require('./ShellTarget');
const PromptsTarget = require('./PromptsTarget');
const { PARALLEL_FLAG } = require('../constants');

function YAMLTarget(file) {
  const definition = YAML.safeLoad(fs.readFileSync(file, 'utf8'));
  const {
      kind,
      spec,
      parallel = false,
      config = {}
  } = definition;
  if (kind === 'shell') return ShellTarget(definition, config);
  if (kind === 'prompts') return PromptsTarget(definition);
  if (kind === 'composition') {
      if (parallel) spec[PARALLEL_FLAG] = true;
      if (config != null) spec.config = config;
      return spec;
  }
}
