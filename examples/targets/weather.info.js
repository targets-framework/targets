'use strict';

const weatherJs = require('weather-js');
const { promisify } = require('util');

function weather({ location = 'Chicago' }, print) {
    const options = {
        search: location,
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
