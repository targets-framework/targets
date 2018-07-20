'use strict';

const os = require('os');
const chalk = require('chalk');
const { maybeStringify } = require('./util');

const ansiLabel = exports.ansiLabel = label =>
    `${chalk.reset.white('[')}${chalk.reset.yellow(label)}${chalk.reset.white(']')}`;

const print = exports.print = (label, value, silent) =>
    value != null && !silent
        && console.log(ansiLabel(label),
            (`${typeof value === 'string'
                ? value
                : maybeStringify(value)}`
            .replace(new RegExp(`^${os.EOL}*`), '')
            .replace(new RegExp(`${os.EOL}*$`), '')
            .split(os.EOL)
            .join(`\n${ansiLabel(label)} `)));

const printer = exports.printer = (value) =>
    Array.isArray(value)
        ? value.map(printer)
        : print(value.label, value.value, value.silent);

exports.Print = (label) => (value) => print(label, value);
