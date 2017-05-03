# Targets

> Node.js CLI bootstrapper powered by minimist and inquirer

## Usage

Targets is very good for building information gathering and task running CLIs.
It's easiest to learn how it work by simply using it. Complete the following
exercise to get started.

## Example: A basic CLI using targets.

#### Save targets as a dependency to your package

```text
npm install --save targets
```

#### Copy the following to a file called `./mycli`.

```js
#!/usr/bin/env node
'use strict';

const Targets = require('targets');

/**
 * The most basic possible target is simply a named function.
 */
function foo() {
    return "bar";
}

/**
 * A more complete target should may return a promise, has a label property and
 * a may have a prompts property which contains `inquirer` prompts for the target.
 */
function greet(options) {
    let name = options.name || "World";
    return Promise.resolve(`Hello, ${name}!`);
}
greet.label = "greet example";
greet.prompts = [
    {
        type: 'input',
        name: "name",
        message: "What's your name?",
        default: "World"
    }
];

/**
 * Register targets
 */
Targets({
    greet,
    foo
});
```

#### Make it executable.

```text
chmod +x ./mycli
```

#### Run

```text
./mycli
```

When you run your tool without arguments and you'll be prompted for any registered targets, if those targets have prompts you'll receive those as well.

```text
./mycli greet --name=Bob
```

When you run your tool with the target name and options, your target will run with those options.

```text
./mycli foo greet --name=Bob
```

When you run your tool with multiple target names and options, all specified targets will run with those options.

## Advanced Example

Review the `./examples/advanced` directory for a more comprehensive example.

## License

Apache-2.0

