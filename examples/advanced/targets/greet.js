'use strict';

function greet({ name }) {
    return `Hello, ${name}!`;
}
greet.label = 'Greet';

module.exports = greet;
