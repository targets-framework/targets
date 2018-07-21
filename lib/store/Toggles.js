'use strict';
const Toggles = global[Symbol.for('targets-toggles')] = {};
const get = exports.get = (key) => !!Toggles[key];
exports.on = (key) => Toggles[key] = true;
exports.off = (key) => Toggles[key] = false;
exports.toggle = (key) => Toggles[key] = !get(key);
