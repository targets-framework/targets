'use strict';

const get = require('lodash/get');

const weatherSky = ({ data }) => get(data, '[0].current.skytext');

weatherSky.label = 'Current Weather';

module.exports = weatherSky;
