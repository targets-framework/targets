'use strict';

const builtins = require('../operations');

const Operations = (operations) => ({
    ...operations,
    ...builtins
});

module.exports = Operations;
