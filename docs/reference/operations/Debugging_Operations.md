# Debugging Operations

> This section is a work-in-progress.

## @log

Use the **log** operation to log the current state of the global store at any given point in a given workflow.

### Syntax

`@log/{source keypath}`

### Arguments

* `source keypath` __optional__ - keypath from which to resolve a value from the global store.

### Example

```sh
--config.git.refspec HEAD @log/result.git.rev-parse
```

> Note: Even though the only argument to the `log` operation is optional, you MUST still include a forward-slash when omitting the argument—i.e. `@log/`.


## @debug

### Syntax

`@debug/{on|off}`

### Arguments

* `{on|off}` - turn debug mode on or off.


## @inspect

### Syntax

`@inspect/{target name}`

### Arguments

* `{target name}` - name of target which you would like to inspect

