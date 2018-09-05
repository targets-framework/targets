# Operations

Operations are meta-targets which handle side-effects. They provide an explicit/declarative mechanism for altering config, dictating control flow, toggling states/modes and otherwise affecting the behavior of your workflows.

## Syntax

All operations start with an at sign (`@`) followed by the operation's name. Optionally, a forward-slash (`/`) may follow the name after which arguments to the operation may be included with each argument delimited by two colons (`::`).

**Operation without arguments:**

`@{operation name}`

**Operation with single argument:**

`@{operation name}/{argument}`

**Operation with multiple arguments:**

`@{operation name}/{argument}::{argument}[::{...rest}]`

* [Binding Operations](Binding_Operations.md)
* [Predicating Operations](Predicating_Operations.md)
* [Debugging Operations](Debugging_Operations.md)
