'use strict';

function greet({ name = 'World' }) {
    return `Hello, ${name}!`;
}
greet.label = 'Greet';

module.exports = greet;
