'use strict';

const Promise = require('bluebird');
const _ = require('lodash');

module.exports = invokeTargets;

function invokeTargets(payload) {
    const promises = payload.options.map((optionName) => {
        const wrapper = {};
        if (_.isFunction(payload.targets[optionName])) {
            wrapper[optionName] = Promise.resolve(payload.targets[optionName](payload)).catch(() => 'unavailable');
        } else {
            console.log('no target found');
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
