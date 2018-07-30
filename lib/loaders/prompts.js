'use strict';

module.exports = PromptsLoader;

const evaluate = require('../evaluate');

function PromptsLoader({ spec } ) {
    function promptsTarget(options) {
        return options;
    }
    promptsTarget.prompts = spec.map((prompt) => {
        if (prompt.when) {
            const when = prompt.when;
            prompt.when = (answers) => evaluate(when, answers);
        }
        return prompt;
    });

    return promptsTarget;
}
