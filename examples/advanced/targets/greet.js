'use strict';

const axios = require('axios');

function greet() {
    return axios.get('https://api.github.com/users/machellerogden')
        .then((res) => `Hello, ${res.data.name}!`);
}
greet.label = 'Greet';

module.exports = greet;
