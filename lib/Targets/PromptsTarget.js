'use strict';

module.exports = PromptsTarget;

function PromptsTarget({ spec } ) {
    function promptsTarget(options) {
        return options;
    }
    promptsTarget.prompts = spec;
    return promptsTarget;
}
