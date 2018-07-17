# Targets

> a task orchestration and composition framework

[![Version](https://img.shields.io/npm/v/targets.svg)]() [![Travis](https://img.shields.io/travis/machellerogden/targets.svg)]() [![License](https://img.shields.io/npm/l/targets.svg)]()

## Overview

Targets is a framework for building CLI tooling. It provides a base on which simple functions can sequenced, parallelized and composed together easily. It leans heavily on [answers](https://www.npmjs.com/package/answers) to enable deep config sourcing and override control.

Original, Targets was inspired by GNU Make. Make was the original build tool. It was designed to make configuring, compiling, testing, debugging and running C code easier. It is deep coupled to C. Targets on the other hand has nothing to do with C, or any other language. Targets is an attempt to take the best ideas from Make around how to compose tasks and how to source config, to improve upon and modernize these basic ideas while avoiding language-specific arcana in the implementation. Tasks are called "targets" in Make documentation, hence the name of this module.

## Install

```text
npm install --save targets
```

## Usage

> Better docs coming soon!

For the time-being, here's an old and incomplete tutorial that might get your headed in the right direction: [TUTORIAL.md](https://github.com/machellerogden/targets/blob/master/TUTORIAL.md).

## License

Apache-2.0

