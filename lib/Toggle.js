'use strict';

const { toggleStore } = require('./GlobalSymbols');

exports.SILENT_TOGGLE = 'silent';

const ToggleStore = global[toggleStore] = {};

const get = exports.get = (key) => !!ToggleStore[key];

exports.on = (key) => ToggleStore[key] = true;

exports.off = (key) => ToggleStore[key] = false;

exports.toggle = (key) => ToggleStore[key] = !get(key);
