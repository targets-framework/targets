'use strict';

const get = require('lodash/get');

const weatherTemp = ({ data }) => data.length
    ? get(data, '[0].current.temperature')
    : 'Location not found';

weatherTemp.label = 'Current Temperature';

module.exports = weatherTemp;
