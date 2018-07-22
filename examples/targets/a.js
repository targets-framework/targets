'use strict';

module.exports = a;

function a() {
    return new Promise(r => setTimeout(() => (console.log('a'),r()), 500));
}
