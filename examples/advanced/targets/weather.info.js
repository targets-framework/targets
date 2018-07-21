'use strict';

const weatherJs = require('weather-js');
const { promisify } = require('util');

function weather(answers, print) {
    const options = {
        search: answers.location,
        degreeType: 'F'
    };
    print('Checking the weather...');
    return promisify(weatherJs.find)(options)
        .then((data = []) => data[0]
            ? data
            : 'Location not found');
}

weather.label = "Weather";

weather.prompts = [
    {
        type: "input",
        name: "location",
        message: "Enter your location",
        default: "Chicago"
    }
];

module.exports = weather;
