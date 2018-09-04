# Bindings

> The examples in this section build on what you learned in the ["Config - Part 2" tutorial](Config_2.md).

#### First, a soapbox about about side-effects

When the functional components of a system are allowed to reach outside their
intended domain, and are allowed to implicitly affect other components, it can
easily result in unintended and difficult to debug side-effects. To mitigate
this problem, Targets isolates all configuration to namespaced domains of
functionality and forces you to explicitly declare any interactions or
interdependencies between these domains.

To be clear, the framework's limitations in this regard are not intended to
disallow side-effects, but rather to ensure that proper functional boundaries
are maintained within the workflows you author. It's all about surfacing the
complexity of inter-related components—all cross-functional relationships become
explicit and obvious.

As you'll learn below, Targets provides an elegant solution to support this
philosopy.

Sometimes you want the result from one target to be fed to the input for another
target. Targets supports this via a mechanism called bindings.

Consider the following:

```js
#!/usr/bin/env node

'use strict';

const systemName = () => require('child_process').spawn('whoami');

systemName.label = "System Name";

const githubUser = ({ username }) => require('axios')
    .get(`https://api.github.com/users/${username}`)
    .then(({ data }) => data);

githubUser.silent = true;

const greet = ({ name }) => `Hello, ${name}!`;

greet.label = "Greet";

require('targets')({
    targets: {
        'system.name': systemName,
        'github.user': githubUser,
        greet
    }
});
```

> If you're coding along with the tutorial, you'll need to add
> [axios](https://www.npmjs.com/package/axios) to your project for the above
> example code to work (`npm i axios`).

Let's run some example commands and use a binding on the targets we've
implemented above...

```
mycli system.name @result.system.name::config.greet.name greet
[System Name] machellerogden
[Greet] Hello, machellerogden!
```

...and another example...

```
mycli github.user @result.github.user.name::config.greet.name greet
[Greet] Hello, Mac Heller-Ogden!
```

Here you'll see that the result from one target was "bound" to the config of
another target.

> The right-side of the binding can use the special array notations you learned
> about in the [previous section]("learn/Config_2/.md"): `[+]`, `[-]`,
> `[<int>,<int>]`.

Aside from binding results, targets also allows you to bind config from one
namespace to another. For example...

```
mycli --foo.location Miami @config.foo.location::config.weather.location weather.sky
```

In this example the foo location config value will be copied over to
weather.location.

This is particularly useful when you are creating composition targets. You'll
learn about composition targets more later, but for now consider the following.

Given we have a config file which looks like this:

```
{
    "name": "myproject"
}
```

...let's say you have a docker namespace and a k8s namespace target which both
want to use this top-level name property. Don't worry about how these targets
are implemented—we'll keep this example conceptual.

For this scenario, you could write a composition target like so:

```
// deploy.js
module.exports = [ '@config.name::config.docker.name', '@config.name::config.k8s.name', 'docker.build', 'docker.push', 'k8s.deploy' ];
```

When you run your composition target (i.e. `mycli deploy`), both the
`docker.build` and the `k8s.deploy` targets will receive the top-level `name`
config property.

It's important to understand that bindings are actually just operations. Target
has other built-in operations which you'll learn about later, as well as
supporting custom operations which you can define yourself.

In the examples above, we used a binding shorthand. Bindings have a special
short-hand syntax because they are one of the most common operations you'll use
as you build your CLI tool.

Let's see review these examples again, but this time we'll use the long-form
syntax.

The long-form bind syntax would look like this:  

```
mycli system.name @bind/result.system.name::config.greet.name greet
[System Name] machellerogden
[Greet] Hello, machellerogden!
```

```
mycli github.user @bind/result.github.user.name::config.greet.name greet
[Greet] Hello, Mac Heller-Ogden!
```

```
mycli --foo.location Miami @bind/config.foo.location::config.weather.location weather.sky
```

Now that you understand bindings, it's time to learn how to sequence and
parallelize target execution, and you'll learn more about target composition.
