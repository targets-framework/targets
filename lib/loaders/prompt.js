'use strict';

module.exports = PromptsLoader;

const inquirer = require('inquirer');
const evaluate = require('../evaluate');

const types = {
    config: ConfigPrompt,
    target: TargetPrompt,
};

function PromptsLoader({ type = 'config', spec } ) {
    const Prompt = types[type];
    if (typeof Prompt === 'function') {
        return Prompt(spec);
    } else {
        throw new Error(`invalid prompt type: ${type}`);
    }
}

function ConfigPrompt(spec) {
    function promptsTarget(config) {
        return config;
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

function TargetPrompt(spec) {
    function promptsTarget() {
        const prompts = spec.map((prompt) => {
            if (prompt.when) {
                const when = prompt.when;
                prompt.when = (answers) => evaluate(when, answers);
            }
            return prompt;
        });
        return inquirer.prompt(prompts);
    }
    return promptsTarget;
}
