'use strict';

const Target = require('../Target');
const { tag } = require('../tags');

const log = (fromPath, { Store: { get } }) => Target({ fn: () => get(fromPath, fromPath), name: '@log' });
tag(log, 'target');

module.exports = {
    log
};
