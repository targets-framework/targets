# Config - Part 2

> The examples in this section build on what you learned in the ["Config - Part 1" tutorial](Config_1.md).

Create a `.myclirc` file in the project's root directory which contains the following.

```
{
    "greet": {
        "name": "Peter"
    }
}
```

With this file in place, running the greet command from the last section without arguments. It should now resolve config from the file and the user will not be prompted.

```
mycli greet
[Config Example] Hello, Peter!
```

Let's move that rc file so that it resides in your user's home directory instead of in the project directory.

```
mv ./.myclirc $HOME/.myclirc
```

Run the command again.

```
mycli greet
[Config Example] Hello, Peter!
```

Same effect—it still works. Now, leave the `$HOME/.myclirc` file in your home directory, but add a copy of it back into your project.

```
cp $HOME/.myclirc ./.myclirc
```

Open the copy in your project directory and change "Peter" to "Jane".

```
{
    "greet": {
        "name": "Jane"
    }
}
```

Run the command again.

```
mycli greet
[Config Example] Hello, Jane!
```

The project-level config takes priority.

Before, we proceed any further, note that the order of config precedence, from highest precedence to lowest precedence, is as follows:

   *  command line arguments
   *  environment variables prefixed with `${appname}_` (use `__` to indicate nested properties. e.g. `appname_foo__bar__baz` => `foo.bar.baz`)
   *  `.${appname}rc` in the project root, or the first found in any parent directories
   *  `$HOME/.${appname}rc`
   *  `$HOME/.${appname}/config`
   *  `$HOME/.config/${appname}`
   *  `$HOME/.config/${appname}/config`
   *  `/etc/${appname}rc`
   *  `/etc/${appname}/config`

All configs will be deeply merged so that one can extend upon another.

The logic which handles this config cascade orginally came from the [rc](https://github.com/dominictarr/rc) module by [Dominic Tarr](https://github.com/dominictarr), but it has since been modified and reimplemented in the [answers](https://www.npmjs.com/package/answers) module with additional syntax options and better handling of arrays.

To understand how config gets merged, let's do another quick exercise.

Let's start by adding a new target called `logger` to our CLI. This target will simply print out the options which it is provided with.

```js
#!/usr/bin/env node
'use strict';

const logger = (options) => options;

require('targets')({ targets: { logger } });
```

To test that it's working, run `mycli logger --logger.foo`. You should see the following output.


```
mycli logger --logger.foo
[logger] {
[logger]     "foo": true
[logger] }
```

Now, create a `./.myclirc` in your project directory which contains the following:

```js
{
    "logger": {
        "collection": [
            {
                "name": "foo"
            },
            {
                "name": "foo"
            },
            {
                "name": "foo"
            }
        ]
    }
}
```

Run `mycli logger --logger.collection[1].name bar`. You should see this output.

```
mycli logger
[logger] {
[logger]     "collection": [
[logger]         {
[logger]             "name": "foo"
[logger]         },
[logger]         {
[logger]             "name": "bar"
[logger]         },
[logger]         {
[logger]             "name": "foo"
[logger]         }
[logger]     ]
[logger] }
```

With targets, you can override and amend to almost any value in the config via command-line arguments no matter how complex the config.

Let's consider a more complex config example. Modify the `./.myclirc` in your project directory to look like the following:

```js
{
    "logger": {
        "collection": [
            {
                "people": [
                    {
                        "name": "Jane",
                        "role": "Developer"
                    },
                    {
                        "name": "Peter",
                        "role": "Manager"
                    }
                ]
            }
        ]
    }
}
```

Run `mycli logger --logger.collection[0].people[+].name Shana --logger.collection[0].people[+].role Director`.

You should see the following output:

```
mycli logger
[logger] {
[logger]     "collection": [
[logger]         {
[logger]             "people": [
[logger]                 {
[logger]                     "name": "Jane",
[logger]                     "role": "Developer"
[logger]                 },
[logger]                 {
[logger]                     "name": "Peter",
[logger]                     "role": "Manager"
[logger]                 },
[logger]                 {
[logger]                     "name": "Shana",
[logger]                     "role": "Director"
[logger]                 }
[logger]             ]
[logger]         }
[logger]     ]
[logger] }
```

This `[+]` syntax is a special syntax which allows you to push items onto an array in the existing config.

There are two other special syntaxes you should become familiar with. Ending an options key with `[-]` will prepend to an existing array (or "unshift"), and ending an option key with `[<int>,<int>]` will splice an existing array.

> See [Array.prototype.splice()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice) for splice documentation if you are not already familiar with it.

Here's another example, this time using the splice syntax:

Run `mycli logger --logger.collection[0].people[1,0].name Shana --logger.collection[0].people[1,0].role Directory`.

You should see the following output:

```
mycli logger
[logger] {
[logger]     "collection": [
[logger]         {
[logger]             "people": [
[logger]                 {
[logger]                     "name": "Jane",
[logger]                     "role": "Developer"
[logger]                 },
[logger]                 {
[logger]                     "name": "Shana",
[logger]                     "role": "Director"
[logger]                 },
[logger]                 {
[logger]                     "name": "Peter",
[logger]                     "role": "Manager"
[logger]                 }
[logger]             ]
[logger]         }
[logger]     ]
[logger] }
```

These special syntax keys work in your config files as well.

Put the same config as we used above into `$HOME/.myclirc`. Here it is again for reference:

```
{
    "logger": {
        "collection": [
            {
                "people": [
                    {
                        "name": "Jane",
                        "role": "Developer"
                    },
                    {
                        "name": "Peter",
                        "role": "Manager"
                    }
                ]
            }
        ]
    }
}
```

Now, open the `./myclirc` file in your **project** directory and populate it with the following:

```
{
    "logger": {
        "collection": [
            {
                "people[1,0]": {
                    "name": "Shana",
                    "role": "Developer"
                }
            }
        ]
    }
}
```

Now, run `mycli logger` without any additional arguments.

You should see the same effect as when you did this via command-line options.

Congrats! You now know almost everything targets provides for configuring your targets.

In the next section, you'll learn how the framework allows explict config bindings which keep your config dry while maintaining proper boundaries on the functional components of your system.
