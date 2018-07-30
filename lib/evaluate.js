'use strict';
const { VM } = require('vm2');

module.exports = (statement, sandbox) => new VM({ sandbox }).run(statement);

