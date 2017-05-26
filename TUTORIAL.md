# Targets Tutorial

This tutorial assumes you know Node.js. If you don't, please start [here](https://tech.cars.com/node-js-everything-you-need-to-know-aside-from-javascript-15acfa713401).

Let's jump right in. Consider the code below.

```js
#!/usr/bin/env node
'use strict';

function greet() {
    return "Hello, World!";
}

require('targets')({ targets: { greet } });
```

As you can see, the most basic target is just a function.

To run it:
   *  create a new directory with `mkdir mycli`
   *  change to that directory with `cd ./mycli`
   *  create a new package.json with `npm init -y`
   *  `npm install --save targets`
   *  copy the above example to a file called `mycli`
   *  make it executable with `chmod +x mycli`
   *  make sure you're running on node v6.4.x or higher with `node -v`
   *  run it with `./mycli greet`

You'll see the following output:

```text
[greet] Hello, World!
```

The output from the `greet` target is prefix with the target's name.

You can also define a label if you would like to see a different prefix, for example:

```js
#!/usr/bin/env node
'use strict';

function greet() {
    return "Hello, World!";
}
greet.label = "Basic Example";

require('targets')({ targets: { greet } });
```

This time when you run `./mycli greet` you'd see the following output:

```text
[Basic Example] Hello, World!
```


Every target receives on options object.

```js
#!/usr/bin/env node
'use strict';

function greet(options) {
    const name = options.name || "World";
    return "Hello, ${name}!";
}
greet.label = "Basic Example";

require('targets')({ targets: { greet } });
```

In this case, if you run `./mycli greet --greet.name="John"` you'd see the following output:

```text
[Basic Example] Hello, John!
```

Notice how the `name` option has been namespaced under greet in the command line. If you register multiple targets to a given namespace they will share config. Here's an example.

```js
#!/usr/bin/env node
'use strict';

function greetYo(options) {
    const name = options.name || "World";
    return "Yo, ${name}!";
}
greetYo.label = "Yo";

function greetHi(options) {
    const name = options.name || "World";
    return "Hi, ${name}!";
}
greetHi.label = "Uses same namespace";

require('targets')({ targets: {
    "greet.hi": greetHi,
    "greet.yo": greetYo
} });
```

You can now specify name as `--greet.name="John"` for both `./mycli greet.hi` and `./mycli greet.yo`. For example:

```text
./mycli greet.hi --greet.name="John"
[Hi] Hi, John!
./mycli greet.yo --greet.name="John"
[Yo] Yo, John!
```

This is a good point at which to demonstrate how tasks can be composed, or run together. Consider the following.

```text
./mycli greet.hi greet.yo --greet.name="John"
[Hi] Hi, John!
[Yo] Yo, John!
```

But, before we get any further into Targets task composition functionality, let's take a look at other way config can be declared and provided to our targets. Consider the following.

```js
#!/usr/bin/env node
'use strict';

function greet(options) {
    const name = options.name;
    return "Hello, ${name}!";
}
greet.label = "Config Example";
greet.prompts = [
    {
        "name": "name",
        "message": "What's your name?",
        "default": "World"
    }
];

require('targets')({ targets: { greet } });
```

In this example, we're declaring what configuration our target will need in terms of prompts which can be asked to the user.

If we run the above with `./mycli greet` and no additional arguments, Targets will detect that config is missing for the `greet` target and the user will be prompted. The output will look something like this.

```text
./mycli greet
? What's your name? John
[Config Example] Hello, John!
```

Of course, if the needed config is provided the user will not be prompted, just as before.

```text
./mycli greet --greet.name="John"
[Config Example] Hello, John!
```

I call this concept "naive config". This gives the user the ability to use your target without knowing what config is needed because the target itself knows how to ask for it. The prompts are [inquirer](https://www.npmjs.com/package/inquirer) options. Check the docs to learn all the various ways you'll be able to prompt for config.

Just as with Make, config in target goes much deeper than command-line arguments and prompts. Let's take a look at how Targets handle's config files.

Let's assume there is a `./myclirc` file in the project's root directory which contains the following.

```text
{
    "greet": {
        "name": "Bob"
    }
}
```

With this file in place, running the command without arguments will now resolve config from the file and the user will not be prompted.

```text
./mycli greet
[Config Example] Hello, Bob!
```

Let's move that rc file so that it resides in the user's home directory (`$HOME/.myclirc`) instead of in the project directory.

```text
./mycli greet
[Config Example] Hello, Bob!
```

Same effect, it still works. Now if we'd copied that file instead of moving it, the project-level config would take priority being deeply merged with other config.

The order of config precedence, from highest to lowest precedence, is as follows:

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

The logic which handles this config cascade comes from the brilliant [rc](https://github.com/dominictarr/rc) module by [Dominic Tarr](https://github.com/dominictarr), but it has been modified and reimplemented in my [answers](https://www.npmjs.com/package/answers) module in order to handle the deep config merging in a manner which is more suitable for task composition. More on that later...

Now that you understand where config comes from and how to declare your Targets config requirements as prompts, let's take a look at more advanced way to define and compose your targets.

Targets can be defined as Promises. Consider the following.

```js
#!/usr/bin/env node
'use strict';

const axios = require('axios');

function greet() {
    return axios.get('https://api.github.com/users/machellerogden')
        .then((res) => res.data.name);
}
greet.label = "Async Example";

require('targets')({ targets: { greet } });
```

The output here comes from the github api, in this case it will be my name.

```text
./mycli greet
[Async Example] Hello, Mac Heller-Ogden!
```

To demostrate that all targets are called asynchronously by default, let's try adding another synchronous target.

```js
#!/usr/bin/env node
'use strict';

const axios = require('axios');

function greet() {
    return axios.get('https://api.github.com/users/machellerogden')
        .then((res) => res.data.name);
}
greet.label = "Async Example";

require('targets')({ targets: { greet, foo: () => 'bar' } });
```

And now, when we run `./mycli greet foo` the output displays in the opposite order we entered in our command because the greet function takes longer to resolve.

```text
./mycli greet foo
[foo] bar
[Async Example] Hello, Mac Heller-Ogden!
```

If we want targets to be invoked sequentially, use commas to separate the target names instead of spaces, like so.

```text
./mycli greet,foo
[Async Example] Hello, Mac Heller-Ogden!
[foo] bar
```


### Recommended Project Structure / Bootstrapping

I recommend you structure your Targets application in the following manner.

```text
./mycli
  └─┬─┬─ targets/
    │ ├─── ip.js
    │ ├─── memory.js
    │ └─── tcpdump.js
    ├─ package.json
    ├─ mycli
    └─ .myclirc
```

Then, in `./mycli` you just need to include the following to auto register any new target file modules.

```js
#!/usr/bin/env node
'use strict';

const targets = require('require-dir')('./targets');

require('targets')({ targets });
```

With this structure in place, so long as each file module inside the `./targets` directory exports a function, the filename (minus the extension) will become the target's name.

## More Examples

Review the `./examples/advanced` directory for more examples.

## License

Apache-2.0

