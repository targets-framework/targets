'use strict';

module.exports = load;

const fs = require('fs');
const path = require('path');
const YAMLTarget = require('./YAMLTarget');
const callsites = require('callsites');

function load(commandDir) {
    const dir = path.join(path.dirname(callsites()[1].getFileName()), commandDir);
    return fs.readdirSync(dir).reduce((acc, file) => {
        const extIdx = file.lastIndexOf('.');
        const name = file.slice(0, extIdx);
        const ext = file.slice(extIdx + 1);
        if ([ 'yml', 'yaml' ].includes(ext)) acc[name] = YAMLTarget(path.join(dir, file));
        if ([ 'js', 'json' ].includes(ext)) acc[name] = require(path.join(dir, file));
        return acc;
    }, {});
}
