'use strict';

module.exports = PromptsLoader;

const inquirer = require('inquirer');
const { predicate:evalPredicate } = require('../evaluate');

const types = {
    config: ConfigPrompt,
    result: ResultPrompt
};

function PromptsLoader({ type = 'config', alias, spec, silent } ) {
    const Prompt = types[type];
    if (typeof Prompt === 'function') {
        const promptsTarget = Prompt(spec);
        if (typeof silent === 'boolean') promptsTarget.silent = silent;
        if (typeof alias === 'string') promptsTarget.alias = alias;
        return promptsTarget;
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
            prompt.when = (answers) => evalPredicate(when, answers);
        }
        return prompt;
    });

    return promptsTarget;
}

function ResultPrompt(spec) {
    function promptsTarget() {
        const prompts = spec.map((prompt) => {
            if (prompt.when) {
                const when = prompt.when;
                prompt.when = (answers) => evalPredicate(when, answers);
            }
            return prompt;
        });
        return inquirer.prompt(prompts);
    }
    return promptsTarget;
}
