'use strict';

const get = require('lodash/get');

function weatherTemp({ data }) {
    if (data.length) {
        return get(data, '[0].current.temperature');
    } else {
        return 'Location not found';
    }
}

weatherTemp.label = "Current Temperature";

module.exports = weatherTemp;
