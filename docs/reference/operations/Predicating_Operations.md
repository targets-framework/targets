# Predicating Operations

> Note: In the current implementation, the ambiguity of the meaning of the second argument in the predicate operations can present collision problems. Syntax changes are being considered.

## @when

Use the **when** operation to predicate target execution without having to write a separate composition.

It considers the value at a given location from within the global store and then:

a) executes a given target if the source value evaluates as truthy
b) compares the source value to another value in the global store as resolved from another given keypath.
c) compares the source value to a literal string value if that value does not resolve as a keypath to a value in the global store.

### Syntax

`@when/{source keypath}[::{source keypath OR string literal}]::{target name}`

### Arguments

* `source keypath` - keypath from which to resolve a value from the global store.
* `source keypath OR string literal` __(optional)__ - keypath from which to resolve a value from the global store OR a string literal. The value, whether resolved from the store or given, will be used to make a loose equality comparison with the value resolved from the first argument.
* `target name` - name of target to execute based on resolution of predicate.

### Examples

```sh
--config.friend true @when/config.friend::greet # greet will be called
--config.friend false @when/config.friend::greet # greet will NOT be called
--config.a foo --config.b foo @when/config.a::config.b::greet # greet will be called
--config.a foo --config.b bar @when/config.a::config.b::greet # greet will NOT be called
--config.a foo @when/config.a::foo::greet # greet will be called
--config.a foo @when/config.a::bar::greet # greet will NOT be called
```

## @when-not

The `@when` operation with the result of the predicate negated.

### Examples

```sh
# greet will be called
--config.enemy false @when-not/config.enemy::greet

# greet will NOT be called
--config.enemy true @when-not/config.enemy::greet
```

## @exit-when

Use the **exit-when** operation to predicate process exit.

It considers the value at a given location from within the global store and then:

a) exit the process if the source value evaluates as truthy
b) compares the source value to another value in the global store as resolved from another given keypath.
c) compares the source value to a literal string value if that value does not resolve as a keypath to a value in the global store.

### Syntax

`@exit-when/{source keypath}[::{source keypath OR string literal}]`

### Arguments

* `source keypath` - keypath from which to resolve a value from the global store.
* `source keypath OR string literal` __(optional)__ - keypath from which to resolve a value from the global store OR a string literal. The value, whether resolved from the store or given, will be used to make a loose equality comparison with the value resolved from the first argument.

### Example

```sh
# if health-check target returns an error process will exit
health-check @exit-when/result.health-check.error
```

## @proceed-when

The `@exit-when` operation with the result of the predicate negated.

### Examples

```sh
# if health-check target returns status of healthy, the process contiues
health-check @proceed-when/result.health-check.status::healthy
```
