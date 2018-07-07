'use strict';

const weatherJs = require('weather-js');
const Promise = require('bluebird');
const _ = require('lodash');

function getSkytext(results) {
    if (results.length) {
        return _.result(results, '[0].current.skytext');
    } else {
        return 'Location not found';
    }
}

function weather(answers, print) {
    const options = {
        search: answers.location,
        degreeType: 'F'
    };
    print('How about that weather?');
    return Promise.promisify(weatherJs.find)(options)
        .then(getSkytext);
}

weather.label = "Current Weather";

weather.prompts = [
    {
        type: "input",
        name: "location",
        message: "Enter your location",
        default: "Chicago"
    }
];

module.exports = weather;
