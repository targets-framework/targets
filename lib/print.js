'use strict';

const os = require('os');
const chalk = require('chalk');
const { setting: { get:getSetting } } = require('./Store');
const { get:getToggle } = require('./Toggle');
const { labelLength } = require('./GlobalSymbols');
const { isString } = require('./util');
const truncate = require('lodash/truncate');
const figures = require('figures');

const maybeStringify = exports.maybeStringify = v => {
    try {
        return JSON.stringify(v, null, 4);
    } catch {
        return v;
    }
};

const MAX_LABEL_LENGTH = 20;

const labelPostfix = ` ${figures.arrowRight} `;

const getPadding = l => {
    const length = l.length > MAX_LABEL_LENGTH
        ? MAX_LABEL_LENGTH
        : l.length;
    return new Array(Math.abs((global[labelLength] || 0) - length)).fill(' ').join('');
};

const ansiLabel = exports.ansiLabel = label => chalk.reset.dim.grey(`${label}${labelPostfix}`);

const paddedAnsiLabel = exports.paddedAnsiLabel = label =>
    chalk.reset.dim.grey(`${truncate(label, { length: MAX_LABEL_LENGTH, omission: '...' })}${getPadding(label)}${labelPostfix}`);

const labelStyle = {
    'default': ansiLabel,
    'aligned': paddedAnsiLabel
};

const writeTty = (l, v) => require('./tty')().output().addLine(`${l} ${v}`);

const writeStdout = (l, v) => console.log(l, v);

const writeMode = {
    tty: writeTty,
    ci: writeStdout,
    dev: writeStdout
};

const Write = () => writeMode[getSetting('mode')];

const print = exports.print = (label, value, silent) => {
    return value != null
        && !silent
        && !getToggle('silent')
        && Write()(labelStyle[getSetting('label-style') || 'default'](label),
            (`${typeof value === 'string'
                ? value
                : maybeStringify(value)}`
            .replace(new RegExp(`^${os.EOL}*`), '')
            .replace(new RegExp(`${os.EOL}*$`), '')
            .split(os.EOL)
            .join(`\n${labelStyle[getSetting('label-style') || 'default'](label)} `)));
};

const printUnit = exports.printUnit = (unit) =>
    Array.isArray(unit)
        ? unit.map(printUnit)
        : unit != null && print(unit.label, unit.value, unit.silent);

exports.Print = (label) =>
    (value) => print(label, value);

exports.registerLabel = (label) => {
    if (!isString(label)) return;
    if ((global[labelLength] || 0) < label.length) {
        global[labelLength] = label.length > MAX_LABEL_LENGTH
            ? MAX_LABEL_LENGTH
            : label.length;
    }
};
