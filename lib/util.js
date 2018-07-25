'use strict';

const os = require('os');
const chalk = require('chalk');
const { get:getToggle } = require('./store/Toggles');
const tty = require('./tty');

const clone = v => JSON.parse(JSON.stringify(v));
const orObject = v => v == null ? {} : v;
const maybeStringify = v => {
    try {
        return JSON.stringify(v, null, 4);
    } catch (e) {
        return v;
    }
};

const ansiLabel = label =>
    `${chalk.reset.white('[')}${chalk.reset.yellow(label)}${chalk.reset.white(']')}`;

const write = () => tty.isTTY
    ? (l, v) => require('./tty')().output().addLine(`${l} ${v}`)
    : (l, v) => console.log(l, v);

const print = (label, value, silent) => {
    return value != null
        && !silent
        && !getToggle('silent')
        && write()(ansiLabel(label),
            (`${typeof value === 'string'
                ? value
                : maybeStringify(value)}`
            .replace(new RegExp(`^${os.EOL}*`), '')
            .replace(new RegExp(`${os.EOL}*$`), '')
            .split(os.EOL)
            .join(`\n${ansiLabel(label)} `)));
};

const printUnit = (unit) =>
    Array.isArray(unit)
        ? unit.map(printUnit)
        : unit != null && print(unit.label, unit.value, unit.silent);

const Print = (label) => (value) => print(label, value);

exports.Print = Print;
exports.print = print;
exports.printUnit = printUnit;
exports.ansiLabel = ansiLabel;

exports.clone = clone;
exports.orObject = orObject;
exports.maybeStringify = maybeStringify;
