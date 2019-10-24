# [![Targets](targets-logo.png?raw=true "Targets")](https://targets.gitbook.io)

> a task orchestration and composition framework

[![Version](https://img.shields.io/npm/v/targets.svg)]() [![Travis](https://img.shields.io/travis/machellerogden/targets.svg)]() [![License](https://img.shields.io/npm/l/targets.svg)]()

## Overview

Targets takes the concept of function composition and surfaces it to the command-line. It enables you, the author of the next great CLI tool, to take many small single-purpose functions and to safely compose them into complex but reliable workflows using a succint declarative syntax.

Use Targets to build common tooling for your team/users and to reduce complex workflows into reliable tasks and which are simple to operate on.

## Documentation

For full documentation please visit [targets.gitbook.io](https://targets.gitbook.io).

## TODO list for alpha branch - complete before landing

- [x] sota based workflow orchestration
- [x] pdn support for target data loader
- [x] dry run support
- [ ] recursive submachine support - non-trivial but doable
- [ ] pdn support for config (via answers)
- [ ] update all targets documentation
- [ ] remove sugarmerge from answers? fork? optional merge fn? seems orthogonal now... adds undue complexity
- [ ] bake-in dottle support? at least kill remaining dottle bugs.
- [ ] resolve fn targets at compile time?
- [ ] allow shellspec to support "other" choice override
- [ ] new logo! re-brand opportunity

## License

MIT
