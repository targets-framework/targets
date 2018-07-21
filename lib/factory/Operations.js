'use strict';

const builtins = require('../operations');

const Operations = (operations) => ({
    ...builtins,
    ...operations
});

module.exports = Operations;
