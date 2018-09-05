# Settings

> This section is a work-in-progress.

## Passing settings via the command line

Any arguments which follow a `--` argument from the command-line will receive special consideration by the framework. Targets currently support the following flags:

`-- --tty` - sets `setting.mode` to "tty" in the global store.
`-- --ci` - sets `setting.mode` to "ci" in the global store.
`-- --aligned` - set `setting['label-style']` to "aligned" in the global store.
