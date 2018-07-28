'use strict';

const vm = require('vm');
const os = require('os');
const chalk = require('chalk');
const tty = require('./tty');
const { get:getToggle } = require('./store/Toggles');

exports.clone = v => JSON.parse(JSON.stringify(v));

exports.orObject = v => v == null ? {} : v;

const maybeStringify = exports.maybeStringify = v => {
    try {
        return JSON.stringify(v, null, 4);
    } catch (e) {
        return v;
    }
};

const ansiLabel = exports.ansiLabel = label =>
    `${chalk.reset.white('[')}${chalk.reset.yellow(label)}${chalk.reset.white(']')}`;

const write = () => tty.isTTY
    ? (l, v) => require('./tty')().output().addLine(`${l} ${v}`)
    : (l, v) => console.log(l, v);

const print = exports.print = (label, value, silent) => {
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

const printUnit = exports.printUnit = (unit) =>
    Array.isArray(unit)
        ? unit.map(printUnit)
        : unit != null && print(unit.label, unit.value, unit.silent);

exports.Print = (label) =>
    (value) => print(label, value);

exports.evaluate = (statement, context) =>
    vm.runInNewContext(statement, context);