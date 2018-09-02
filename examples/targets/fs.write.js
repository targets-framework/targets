'use strict';

const { promisify } = require('util');
const fs = require('fs');
const access = promisify(fs.access);
const writeFile = promisify(fs.writeFile);

const fsWrite = ({ name = 'output', data, overwrite = false }) => (overwrite)
    ? writeFile(name, data)
        .then(() => `${name} written`)
    : access(name)
        .then(() => `${name} already exists. refusing to overwrite.`)
        .catch(() => writeFile(name, data)
            .then(() => `${name} written`));

fsWrite.label = 'Write File';

fsWrite.prompts = [
    {
        name: 'name',
        message: 'Please enter filename to write'
    },
    {
        name: 'data',
        type: 'editor'
    },
    {
        name: 'overwrite',
        type: 'confirm',
        message: 'Overwrite file if exists?',
        default: false
    }
];

module.exports = fsWrite;
