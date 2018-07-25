'use strict';

module.exports = runInNewContext;

const vm = require('vm');

function runInNewContext(statement, context) {
    const script = new vm.Script(statement);
    return script.runInNewContext(context);
}
