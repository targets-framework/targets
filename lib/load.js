'use strict';

module.exports = load;

const fs = require('fs');
const path = require('path');
const requireDir = require('require-dir');
const builtinLoaders = requireDir('./loaders');
const callsites = require('callsites');
const YAML = require('js-yaml');
const { inspect } = require('util');
const globby = require('globby');

const yml = (filePath) => YAML.safeLoad(fs.readFileSync(filePath, 'utf8'));
const js = (filePath) => require(filePath);

const readers = {
    yml,
    yaml: yml,
    js,
    json: js
};

function load(patterns, loaders = {}) {
    const dir = path.dirname(callsites()[1].getFileName());
    const paths = globby.sync(patterns, { cwd: dir });
    return paths.reduce((acc, file) => {
        const extIdx = file.lastIndexOf('.');
        const pdIdx = file.lastIndexOf(path.sep);
        const name = file.slice(pdIdx < 0 ? 0 : pdIdx + 1, extIdx);
        const ext = file.slice(extIdx + 1);
        const filePath = path.join(dir, file);
        acc[name] = LoadTarget(readers[ext](filePath), loaders);
        return acc;
    }, {});
}

function LoadTarget(given, customLoaders = {}) {
    const loaders = { ...builtinLoaders, ...customLoaders };
    if (typeof given === 'string') return given;
    if (typeof given === 'function') return given;
    if (Array.isArray(given)) {
        const mapped = given.map(LoadTarget);
        if (given.config) mapped.config = given.config;
        if (given.predicates) mapped.predicates = given.predicates;
        return mapped;
    }
    if (given != null && typeof given === 'object' && given.kind && given.spec) {
        const loader = loaders[given.kind];
        if (typeof loader !== 'function') throw new Error(`invalid loader: ${given.kind}`);
        return LoadTarget(loader(given));
    }
    throw new Error(`invalid target: ${inspect(given)}`);
}
