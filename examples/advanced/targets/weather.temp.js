'use strict';

const weatherJs = require('weather-js');
const Promise = require('bluebird');
const _ = require('lodash');

function getTemp(results) {
    if (results.length) {
        return _.result(results, '[0].current.temperature');
    } else {
        return 'Location not found';
    }
}

function weather(answers) {
    const options = {
        search: answers.weather.location,
        degreeType: 'F'
    };
    return Promise.promisify(weatherJs.find)(options)
        .then(getTemp);
}

weather.label = "Current Temperature";

weather.prompts = [
    {
        type: "input",
        name: "location",
        message: "Enter your location",
        default: "Chicago"
    }
];

module.exports = weather;
