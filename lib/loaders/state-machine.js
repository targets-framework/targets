'use strict';
const sota = require('sota');
const Trajectory = require('trajectory');

function StateMachine({ spec }) {
    const trajectory = new Trajectory({ resources });
    return (io, ctx) => trajectory.execute(sota.readAll(spec), io);
}

module.exports = StateMachine;
