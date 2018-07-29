'use strict';

module.exports = PromptsLoader;

function PromptsLoader({ spec } ) {
    function promptsTarget(options) {
        return options;
    }
    promptsTarget.prompts = spec;
    return promptsTarget;
}
