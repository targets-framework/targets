# Binding Operations

## @bind

Use the **bind** operation to take a value at a given location from within the global store and set/merge it into another location within the global store.

### Syntax

`@bind/{source keypath}::{destination keypath}`

> Note: Because `@bind` is the most common operation, it also supports a special short-hand syntax wherein you may omit the name of the operation and the forward-slash: `@result.foo::config.bar` is equivalent to `@bind/result.foo::config.bar`.

### Arguments

* `source keypath` - keypath from which to resolve a value from the global store.
* `destination keypath` - keypath to which the value resolved from the source keypath will be set/merged.

### Example

```sh
--config.git.refspec HEAD git.rev-parse @bind/result.git.rev-parse::config.fs.name fs.write
```

## @bind-to

Use the **bind-to** operation to take a value at a given location from within the global store and bind it to a given target.

### Syntax

`@bind-to/{source keypath}::{target name}`

### Arguments

* `source keypath` - keypath from which to resolve a value from the global store.
* `target name` - name of target to which the value resolved from the source keypath will be bound.

### Example

```sh
--config.production.host abcwidgets.com @bind-to/config.production::health-check
```
