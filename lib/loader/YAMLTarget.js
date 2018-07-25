'use strict';

module.exports = YAMLTarget;

const fs = require('fs');
const YAML = require('js-yaml');
const ShellTarget = require('./ShellTarget');

function YAMLTarget(file) {
  const definition = YAML.safeLoad(fs.readFileSync(file, 'utf8'));
  const { kind, spec } = definition;
  if (kind === 'shell') return ShellTarget(definition);
  if (kind === 'composition') return spec;
}
