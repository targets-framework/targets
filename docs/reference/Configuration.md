# Configuration

## Config Source Precedence (highest to lowest)

* command line arguments
* environment variables prefixed with `${appname}_` (use `__` to indicate nested properties. e.g. `appname_foo__bar__baz` => `foo.bar.baz`)
* `.${appname}rc` in the project root, or the first found in any parent directories
* `$HOME/.${appname}rc`
* `$HOME/.${appname}/config`
* `$HOME/.config/${appname}`
* `$HOME/.config/${appname}/config`
* `/etc/${appname}rc`
* `/etc/${appname}/config`

All configs will be deeply merged so that one can extend upon another.

## Passing config via the command line

Unlike the keypaths used for bindings, all command-line config arguments are bound to the `config` property of the global store. You cannot set values to the `result` or `setting` properties of the store via a config argument.

```sh
--greet.name "Peter" greet
```

The above would result in a `config.greet.name` being set to "Peter" in the global store.

## Manipulating deeply nests config values via the command line

Targets supports is special syntax for manpulating deeply nested values within the config. These are as followings:

### Push Syntax (`[+]`)

Append `[+]` to the end of a given keypath to add an item to the end of an existing collection.

```sh
--foo.bar.baz[+] qux
```

### Unshift Syntax (`[-]`)

Append `[-]` to the end of a given keypath to add an item to the beginning of an existing collection.

```sh
--foo.bar.baz[-] qux
```

### Splice Syntax (`[<int>,<int>]`)

Append `[<int>,<int>]` to the end of a given keypath to add an item to an existing collection at an arbitrary index and optionally replace an existing item.

```sh
--foo.bar.baz[2,0] qux
```

So much work and thought has gone into how Targets considers and handles configuration that the core of its config system was lifted out of the framework and now exists as two separate modules:

* [Answers](https://github.com/machellerogden/answers)
* [Sugar Merge](https://github.com/machellerogden/sugarmerge)
