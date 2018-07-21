'use strict';

const os = require('os');
const chalk = require('chalk');
const { maybeStringify } = require('../util');
const { get:getToggle } = require('../store/Toggles');

const ansiLabel = label =>
    `${chalk.reset.white('[')}${chalk.reset.yellow(label)}${chalk.reset.white(']')}`;

const print = (label, value, silent) =>
    value != null
        && !silent
        && !getToggle('silent')
        && console.log(ansiLabel(label),
            (`${typeof value === 'string'
                ? value
                : maybeStringify(value)}`
            .replace(new RegExp(`^${os.EOL}*`), '')
            .replace(new RegExp(`${os.EOL}*$`), '')
            .split(os.EOL)
            .join(`\n${ansiLabel(label)} `)));

const printer = (value) =>
    Array.isArray(value)
        ? value.map(printer)
        : value != null && print(value.label, value.value, value.silent);

const Print = (label) => (value) => print(label, value);

module.exports = Print;
module.exports.print = print;
module.exports.printer = printer;
module.exports.ansiLabel = ansiLabel;
