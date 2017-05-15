'use strict';
const _ = require('lodash');

function Prompts(targets) {
    const getterPairs = _.toPairs(targets);

    function getChoices() {
        return _.map(getterPairs, (pair) => {
            const getter = pair[1];
            const getterKey = pair[0];
            const option = {
                name: getter.label || getter.name,
                value: getterKey
            };
            return option;
        });
    }

    let prompts = [
        {
            type: 'checkbox',
            name: 'options',
            message: 'What information would you like to see?',
            choices: getChoices(targets)
        }
    ];

    _.forEach(getterPairs, (pair) => {
        let getter = pair[1];
        let getterKey = pair[0];
        if (getter.prompts) {
            let getterPrompts = _.map(getter.prompts, (prompt) => {
                let when = prompt.when;
                if (_.isFunction(when)) {
                    prompt.when = (answers) => (_.isArray(answers.options) && answers.options.indexOf(getterKey) >= 0) && when(answers);
                } else if (_.isBoolean(when)) {
                    prompt.when = (answers) => when && (_.isArray(answers.options) && answers.options.indexOf(getterKey) >= 0);
                } else {
                    prompt.when = (answers) => _.isArray(answers.options) && answers.options.indexOf(getterKey) >= 0;
                }
                return prompt;
            });
            prompts = prompts.concat(getterPrompts);
        }
    });

    return prompts;
}

module.exports = Prompts;
