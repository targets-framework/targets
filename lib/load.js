'use strict';

module.exports = load;

const fs = require('fs');
const path = require('path');
const callsites = require('callsites');
const YAML = require('js-yaml');
const { inspect } = require('util');
const globby = require('globby');
const m = require('module');
const untildify = require('untildify');

const yml = (filePath) => YAML.safeLoad(fs.readFileSync(filePath, 'utf8'));
const js = (filePath) => m._load(filePath);

const readers = {
    yml,
    yaml: yml,
    js,
    json: js
};

// TODO: clean up this mess ... use globbler and port unrelativize over there. let's bury the complexity.

const unrelativize = (p, cwd) =>
    Array.isArray(p)
        ? p.map(p => unrelativize(p, cwd))
        : (/^\.\.?[/\\]/.test(p))
            ? path.resolve(cwd, p)
            : untildify(p);

function load(options) {
    const {
        patterns:givenPatterns = [],
        cwd = path.dirname(callsites()[1].getFileName())
    } = (options != null && typeof options === 'object' && !Array.isArray(options))
        ? options
        : {
            patterns: options
          };

    const patterns = unrelativize(givenPatterns, cwd);
    const paths = globby.sync(patterns, { cwd: '/' });

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
