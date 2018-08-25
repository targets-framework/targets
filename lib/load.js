'use strict';

module.exports = load;

const fs = require('fs');
const path = require('path');
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

function load(patterns) {
    const dir = path.dirname(callsites()[1].getFileName());
    const paths = globby.sync(patterns, { cwd: dir });
    return paths.reduce((acc, file) => {
        const extIdx = file.lastIndexOf('.');
        const pdIdx = file.lastIndexOf(path.sep);
        const name = file.slice(pdIdx < 0 ? 0 : pdIdx + 1, extIdx);
        const ext = file.slice(extIdx + 1);
        const filePath = path.join(dir, file);
        acc[name] = LoadTarget(readers[ext](filePath));
        return acc;
    }, {});
}

function LoadTarget(given) {
    if (given != null && [ 'string', 'function', 'object' ].includes(typeof given)) return given;
    throw new Error(`invalid target: ${inspect(given)}`);
}
