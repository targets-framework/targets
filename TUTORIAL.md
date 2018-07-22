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
   *  make sure you're running on node v10.x.x or higher (you can check with `node -v`)
   *  create a new directory with `mkdir mycli`
   *  change to that directory with `cd ./mycli`
   *  create a new package.json with `npm init -y`
   *  `npm install --save targets`
   *  copy the above example to a file to a new file, `./index.js`
   *  add this to your package.json: `"bin": "./index.js",` and save the file
   *  make it executable with `chmod +x ./index.js`
   *  run `npm link` to create a globally available symlink to your new CLI
   *  run `mycli greet`

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

This time when you run `mycli greet` you'd see the following output:

```text
[Basic Example] Hello, World!
```

Every target receives on options object.

```js
#!/usr/bin/env node
'use strict';

function greet({ name = "World" }) {
    return "Hello, ${name}!";
}
greet.label = "Basic Example";

require('targets')({ targets: { greet } });
```

In this case, if you run `mycli greet --greet.name Jane` you'd see the following output:

```text
[Basic Example] Hello, Jane!
```

Notice how the `name` option has been namespaced under greet in the command line. If you register multiple targets to a given namespace they will share config. Here's an example.

```js
#!/usr/bin/env node
'use strict';

const getWeather = (location) => Promise.promisify(weatherJs.find)({
    search: location,
    degreeType: 'F'
});

function weatherSky({ location }) {
    return getWeather(location)
        .then((r) => r.[0].current.skytext);
}
weatherSky.label = "Current Weather";

function weatherTemp({ location }) {
    return getWeather(location)
        .then((r) => r.[0].current.temperature);
}
weatherSky.label = "Current Temperature";

require('targets')({
    targets: {
        'weather.sky': weatherSky,
        'weather.temp': weatherTemp
    }
});
```

You can now specify location as `--weather.location Chicago` for both `mycli weather.sky` and `mycli weather.temp`. For example:

```text
mycli weather.sky --weather.location Chicago
[Current Weather] Partly Sunny
mycli weather.temp --weather.location Chicago
[Current Temperature] 75
```

This is a good point at which to demonstrate how tasks can be composed, or run together. Consider the following.

```text
mycli weather.sky weather.temp --weather.location Chicago
[Current Weather] Partly Sunny
[Current Temperature] 75
```

But, before we get any further into Targets task composition functionality, let's take a look at other way config can be declared and provided to our targets. Consider the following.

```js
#!/usr/bin/env node
'use strict';

function greet({ name = "World" }) {
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

If we run the above with `mycli greet` and no additional arguments, Targets will detect that config is missing for the `greet` target and the user will be prompted. The output will look something like this.

```text
mycli greet
? [greet.name] What's your name? John
[Config Example] Hello, John!
```

Of course, if the needed config is provided the user will not be prompted, just as before.

```text
mycli greet --greet.name Jane
[Config Example] Hello, Jane!
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
mycli greet
[Config Example] Hello, Bob!
```

Let's move that rc file so that it resides in the user's home directory (`$HOME/.myclirc`) instead of in the project directory.

```text
mycli greet
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

The logic which handles this config cascade comes from the brilliant [rc](https://github.com/dominictarr/rc) module by [Dominic Tarr](https://github.com/dominictarr), but it has been modified and reimplemented in my [answers](https://www.npmjs.com/package/answers) module in order to handle the deep config merging in a manner which is more suitable for task composition.

To understand how config gets merged, let's do another quick exercise.

Let's start by adding a `logger` target to our CLI which simple prints out the options which it is provided with.

```js
#!/usr/bin/env node
'use strict';

function logger(options) {
    return options;
}

require('targets')({ targets: { logger } });
```

To test that it's working, run `mycli logger --logger.foo`. You should see the following output.


```text
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

Run `mycli logger --logger.collection[2].name bar`. You should see this output.

```text
mycli logger
[logger] {
[logger]     "collection": [
[logger]         {
[logger]             "name": "foo"
[logger]         },
[logger]         {
[logger]             "name": "foo"
[logger]         },
[logger]         {
[logger]             "name": "bar"
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

Run `mycli logger --logger.collection[0].people[+].name Shana --logger.collection[0].people[+].role Director`. You should see this output.

```text
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

This `[+]` syntax is a special syntax which allows you to push items onto an array in the existing config. There are two other special syntaxes. `[-]` prepends an existing array ("unshift") and `[<int>,<int>]` splices an existing array.

Sometime you will want the result from one target to be bound to the input for another target. Targets supports this via a mechanism called bindings.

Consider the following.

```js
#!/usr/bin/env node

'use strict';

function systemName() {
    return require('child_process').spawn('whoami');
}
systemName.label = "System Name";

function githubUser({ username }) {
    return require('axios')
        .get(`https://api.github.com/users/${username}`)
        .then(({ data }) => data);
}
githubUser.silent = true;

function greet({ name }) {
    return `Hello, ${name}!`;
}
greet.label = "Greet";

require('targets')({
    targets: {
        'system.name': systemName,
        'github.user': githubUser,
        greet
    }
});
```

Let's run some example of using binding on these targets...

```text
mycli system.name system.name::greet.name greet
[System Name] machellerogden
[Greet] Hello, machellerogden!
```

...and another example...

```text
mycli github.user github.user.name::greet.name greet
[Greet] Hello, Mac Heller-Ogden!
```

Tip: the right-side of the binding can use the special array notations: `[+]`, `[-]`, `[<int>,<int>]`.

You can also, rebind config by prefacing your binding with an `@` character. For example...

```text
mycli --foo.location Miami @foo.location::weather.location weather.sky
```

In this example the foo location config value will be copied over to weather.location.

This is particularly useful when you are creating composite targets. Consider the following config:

```text
{
    "name": "myproject"
}
```

...let's say you have a docker namespace and a k8s namespace target which both want to use this top-level name property. For this scenario, you could write a composite target like so:

```text
// deploy.js
module.exports = [ '@name::docker.name', '@name::k8s.name', 'docker.build', 'docker.push', 'k8s.deploy' ];
```

Now that you understand bindings, let's talk about sequencing. Targets are run
sequentially by default, but when separated by comma will be invoked in parallel.
Here's an example.

```text
mycli weather.sky,weather.temp --weather.location Chicago
[Current Temperature] 75
[Current Weather] Partly Sunny
```

Note the order of the results. Because these were run in parallel the order of the results is non-deterministic.

Targets can also be defined as streams. Consider the following.

```js
'use strict';

function tcpdump() {
    return require('child_process').spawn('tcpdump', ['-i', 'en0', '-n', '-s', '0']);
}

require('targets')({ targets: { tcpdump } });
```

Now, when we run `sudo mycli tcpdump` the output from tcpdump is streamed to the console.

```text
sudo mycli tcpdump
[tcpdump] output here...
[tcpdump] output here...
[tcpdump] output here...
[tcpdump] output here...
[tcpdump] output here...
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
    ├─ index.js
    └─ .myclirc
```

Then, in `./index.js` you just need to include the following to auto register any new target file modules.

```js
#!/usr/bin/env node
'use strict';

const targets = require('require-dir')('./targets');

require('targets')({ name: 'mycli', targets });
```

With this structure in place, so long as each file module inside the `./targets` directory exports a function, the filename (minus the extension) will become the target's name.

## More Examples

Review the [./examples](https://github.com/machellerogden/targets/tree/master/examples) directory for more examples.

## License

Apache-2.0

