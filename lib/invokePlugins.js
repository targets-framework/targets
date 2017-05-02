'use strict';

const Promise = require('bluebird');
const requireDir = require('require-dir');
const _ = require('lodash');

module.exports = invokePlugins;

function invokePlugins(payload) {
    const promises = payload.options.map((optionName) => {
        const wrapper = {};
        if (_.isFunction(payload.plugins[optionName])) {
            wrapper[optionName] = payload.plugins[optionName](payload).catch(() => 'unavailable');
        }
        return wrapper;
    });
    return Promise.reduce(promises, Object.assign, {})
        .props()
        .then((results) => {
            payload.results = results;
            return payload;
        });
}
