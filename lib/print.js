'use strict';

const os = require('os');
const chalk = require('chalk');
const SettingStore = require('./Setting');
const { get:getToggle } = require('./Toggle');

const maybeStringify = exports.maybeStringify = v => {
    try {
        return JSON.stringify(v, null, 4);
    } catch {
        return v;
    }
};

const ansiLabel = exports.ansiLabel = label =>
    `${chalk.reset.white('[')}${chalk.reset.yellow(label)}${chalk.reset.white(']')}`;

const writeTty = (l, v) => require('./tty')().output().addLine(`${l} ${v}`);
const writeStdout = (l, v) => console.log(l, v);

const writeMode = {
    tty: writeTty,
    ci: writeStdout,
    dev: writeStdout
};

const Write = () => writeMode[SettingStore.get('mode')];

const print = exports.print = (label, value, silent) => {
    return value != null
        && !silent
        && !getToggle('silent')
        && Write()(ansiLabel(label),
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
