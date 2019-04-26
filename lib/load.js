'use strict';

module.exports = { load, sourceExpander };

const fs = require('fs');
const path = require('path');
const YAML = require('js-yaml');
const ednToJs = require('edn-to-js');
const { inspect } = require('util');
const globby = require('globby');
const m = require('module');

const yml = (filePath) => YAML.safeLoad(fs.readFileSync(filePath, 'utf8'));
const js = (filePath) => m._load(filePath);
const edn = (filePath) => ednToJs(fs.readFileSync(filePath, 'utf8'));

const readers = {
    yml,
    yaml: yml,
    js,
    json: js,
    edn
};

function expandPatterns(patterns, dir) {
    if (!Array.isArray(patterns)) patterns = [ patterns ];
    return patterns.reduce((acc, p) => {
        if (/^\//.test(p)) {
            acc = [ ...acc, ...globby.sync(`.${p}`, { absolute: true, cwd: '/' }) ];
        } else if (/^~/.test(p)) {
            acc = [ ...acc, ...globby.sync(`.${p.slice(1)}`, { absolute: true, cwd: process.env.HOME }) ];
        } else {
            acc = [ ...acc, ...globby.sync(p, { absolute: true, cwd: dir }) ];
        }
        return acc;
    }, []);
}

function sourceExpander(config, filename) {
    if (config.source == null) return config;
    return { ...config, source: expandPatterns(config.source, path.dirname(filename)) };
}

function load(options) {
    const {
        patterns = [],
        cwd = process.cwd()
    } = (options != null && typeof options === 'object' && !Array.isArray(options))
        ? options
        : {
            patterns: options
          };

    const paths = expandPatterns(patterns, cwd);

    return paths.reduce((acc, file) => {
        const extIdx = file.lastIndexOf('.');
        const pdIdx = file.lastIndexOf(path.sep);
        const name = file.slice(pdIdx < 0 ? 0 : pdIdx + 1, extIdx);
        const ext = file.slice(extIdx + 1);
        if (Object.keys(readers).includes(ext)) acc[name] = LoadTarget(readers[ext](file));
        return acc;
    }, {});
}

function LoadTarget(given) {
    if (given != null && [ 'string', 'function', 'object' ].includes(typeof given)) return given;
    throw new Error(`invalid target: ${inspect(given)}`);
}
