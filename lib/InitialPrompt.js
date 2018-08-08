'use strict';

module.exports = InitialPrompt;

const inquirer = require('inquirer');

const { hasTargetNames } = require('./Target');

const TargetChoices = targets => Object.entries(targets)
    .map(([ targetName, target ]) => ({
        name: target.label || targetName,
        value: targetName
    }));

function InitialPrompt({ targets, argv }) {
    return hasTargetNames(argv)
        ? Promise.resolve(argv)
        : inquirer.prompt([{
                type: 'checkbox',
                name: 'targetNames',
                message: 'Please select your targets',
                choices: TargetChoices(targets)
            }])
            .then(({ targetNames }) => targetNames)
            .then(choices => [ ...choices, ...argv ]);
}
