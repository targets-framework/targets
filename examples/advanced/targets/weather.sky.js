'use strict';

const get = require('lodash/get');

function weatherSky({ data }) {
    return get(data, '[0].current.skytext');
}

weatherSky.label = "Current Weather";

module.exports = weatherSky;
