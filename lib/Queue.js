'use strict';

module.exports = Queue;

const { isTargetName } = require('./Target');

const Unit = require('./Unit');

async function Queue({ targets, operations, loaders, args }) {
    const queue = args.reduce(async (acc, arg, i, col) => isTargetName(col[i - 1], arg)
          ? [ ...(await acc), await Unit({ arg, targets, operations, loaders }) ]
          : acc,
    []);
    return queue;
}
