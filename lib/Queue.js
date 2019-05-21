'use strict';

module.exports = Queue;

const { isTargetName } = require('./Target');

const Unit = require('./Unit');

function Queue({ targets, operations, loaders, args }) {
    return args.reduce((acc, arg, i, col) => isTargetName(col[i - 1], arg)
          ? [ ...acc, Unit({ arg, targets, operations, loaders }) ]
          : acc,
    []);
}
