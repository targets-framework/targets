'use strict';

const Answers = require('answers');
const get = require('lodash/get');

const {
    getLatest:getLatestConfig,
    push:pushConfig
} = require('../store/Config');

const {
    getLatest:getLatestResult
} = require('../store/Results');

const { on, off } = require('../store/Toggles');

const { BINDING_FLAG } = require('../constants');

const bind = (fromPath, toPath) => pushConfig(Answers.deepSet(getLatestConfig(), toPath, get(getLatestResult(), fromPath)));
bind.flag = BINDING_FLAG;

const rebind = (fromPath, toPath) => pushConfig(Answers.deepSet(getLatestConfig(), toPath, get(getLatestConfig(), fromPath)));
rebind.flag = BINDING_FLAG;

const binding = {
    bind,
    rebind
};

const ToggleOp = (name) => (v) => (({ 'on': () => on(name), 'off': () => off(name) })[v] || (() => {}))(); // nothing to see here... i was bored

const toggles = {
    'silent': ToggleOp('silent')
};

const special = {
    'prompts-on': () => {},
    'prompts-off': () => {},
};

const Operations = (operations) => ({
    ...operations,
    ...binding,
    ...toggles,
    ...special
});

module.exports = Operations;
