'use strict';

module.exports = a;

function a() {
    return new Promise(r => setTimeout(() => r('scheduler demo - run `./mycli c`'), 1000));
}
