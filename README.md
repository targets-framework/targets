# Targets

> a task orchestration and composition framework

[![Version](https://img.shields.io/npm/v/targets.svg)]() [![Travis](https://img.shields.io/travis/machellerogden/targets.svg)]() [![License](https://img.shields.io/npm/l/targets.svg)]()

## Quick Start Guide

### Requirements

   *  Node version 10 or higher.
   *  Tested and working on Mac OS - not yet tested on Windows.

### Install

```text
npm install --save targets
```

### Write one function per task

Tasks are just functions. A given task function can return either a value, a Promise or a Stream.

#### Consider the following example:

Let's say you write a "greet" target, like so...

```js
// ./targets/greet.js
module.exports = greet;

function greet({ name = 'World' }) {
    return `Hello, ${name}!`;
}
```

...and you write your main entrypoint like this:

```js
// ./index.js
#!/usr/bin/env node

const requireDir = require('require-dir');
const targets = requireDir('./targets');

require('targets')({ targets });
```

...and then, on the command line, make your entrypoint file executable...

```sh
$ chmod +x ./index.js
```

...and while still on the command-line, you enter...

```sh
$ ./index.js greet
[greet] Hello, World!
```

...or...

```sh
$ ./index.js greet --greet.name Jane
[greet] Hello, Jane!
```

And, consider the following...

```js
// whoami.js
module.exports = whoami;

function whoami() {
    return require('child_process').spawn('whoami');
}
```

...you can bind the output of any function to another like so...

```sh
$ ./index.js whoami whoami::greet.name greet
[whoami] jane
[greet example] Hello, jane!
```

Let's go back and modify our 'greet' target...

```js
// ./targets/greet.js
module.exports = greet;

function greet({ name = 'World' }) {
    return `Hello, ${name}!`;
}
greet.label = "greet example";
greet.prompts = [
    {
        name: "name",
        message: "What's your name?",
        default: "World"
    }
];
```

...we've added a label and some prompts. Let's see what this does when we do not include the `--greet.name` option...

```sh
$ ./index.js greet
? [greet.name] What's your name? Peter
[greet example] Hello, Peter!
```

This time you were prompted for the missing config!

**Want to learn more?** Check out the [full tutorial](https://github.com/machellerogden/targets/blob/master/TUTORIAL.md).

## Background

Targets is a framework for building CLI tooling. It provides a base on which simple functions can sequenced, parallelized and composed together easily. It leans heavily on [answers](https://www.npmjs.com/package/answers) to enable deep config sourcing and config override control.

Originally, Targets was inspired by GNU Make. Make was the original build tool. It was designed to make configuring, compiling, testing, debugging and running C code easier. It is deep coupled to C. Targets on the other hand has nothing to do with C, or any other language. Targets is an attempt to take the best ideas from Make around how to compose tasks and how to source config, to improve upon and modernize these basic ideas while avoiding language-specific arcana in the implementation. Tasks are called "targets" in Make documentation, hence the name of this module.

## Coming Soon...

> Better docs! In the meantime, take a look in the examples directory.

## License

Apache-2.0

