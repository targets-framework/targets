# Targets

> a task composition framework

[![Version](https://img.shields.io/npm/v/targets.svg)]() [![Travis](https://img.shields.io/travis/machellerogden/targets.svg)]() [![License](https://img.shields.io/npm/l/targets.svg)]()

## Overview

Targets is a framework for building information gathering tools, task runners and build/deploy CLIs inspired by GNU Make.

Make was the original build tool. It was designed to make configuring, compiling, testing, debugging and running C code easier. It is deep coupled to C. Targets on the other hand has nothing to do with C, or any other language. Targets is an attempt to take the best ideas from Make around how to compose tasks and how to source config, to improve upon and modernize these basic ideas while avoiding language-specific arcana in the implementation.

By the way, tasks are called "targets" in Make documentation, hence the name of this module.

## Install

```text
npm install --save targets
```

## Usage

Targets is best explained by example. To get started, see [TUTORIAL.md](https://github.com/machellerogden/targets/blob/master/TUTORIAL.md).

## License

Apache-2.0

