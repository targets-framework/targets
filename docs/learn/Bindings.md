# Bindings

> The examples in this section build on what you learned in the ["Config - Part 2" tutorial]({{< relref "learn/config_part_2/_index.en.md" >}}).

#### First, a soapbox about about side-effects

You may be wonder why the framework isolates a target's config to a given namespace. Targets imposes this limitation in order to guarantee that your targets are composed without unintended side-effects. Each target represents a single functional component of your system, and each namespace represents the data provider for a single functional domain. This keeps the system in alignment with the [single responsibility principle](https://en.wikipedia.org/wiki/Single_responsibility_principle) so long as you define each target to do one and only one thing and configure each namespace to have well-defined boundaries.

> When functional components of a system are allowed to reach outside their intended domain, and allowed to implicitly affect other components, it can easily result in unintended and difficult to debug side-effects.

Sounds safe, but terribly limiting, right? Don't worry! Targets can still share config across namespaces. Your intention to do so simply has to be explicitly declared.

> The framework's config limitations are not about dissallowing side-effects, but about making sure we surface the complexity of inter-related components. It's about making sure that those relationships are explicit and obvious.

As you'll learn below, Targets provides an elegant solution for doing just this.

Sometimes you will want the result from one target to be fed to the input for another target. Targets supports this via a mechanism called bindings.

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

{{% notice tip %}}
If you're coding along with the tutorial, you'll need to add [axios](https://www.npmjs.com/package/axios) to your project for the above example code to work (`npm i axios`).
{{% /notice %}}

Let's run some example commands and use a binding on the targets we've implemented above...

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

Here you'll see that the result from one target was "bound" to the config of another target.

{{% notice tip %}}
The right-side of the binding can use the special array notations you learned about in the [previous section]({{< relref "learn/config_part_2/_index.en.md" >}}): `[+]`, `[-]`, `[<int>,<int>]`.
{{% /notice %}}

Aside from binding results, targets also allows you to bind config from one namespace to another. For example...

```
mycli --foo.location Miami @config.foo.location::config.weather.location weather.sky
```

In this example the foo location config value will be copied over to weather.location.

This is particularly useful when you are creating composition targets. You'll learn about composition targets more later, but for now consider the following.

Given we have a config file which looks like this:

```
{
    "name": "myproject"
}
```

...let's say you have a docker namespace and a k8s namespace target which both want to use this top-level name property. Don't worry about how these targets are implemented—we'll keep this example conceptual.

For this scenario, you could write a composition target like so:

```
// deploy.js
module.exports = [ '@config.name::config.docker.name', '@config.name::config.k8s.name', 'docker.build', 'docker.push', 'k8s.deploy' ];
```

When you run your composition target (i.e. `mycli deploy`), both the `docker.build` and the `k8s.deploy` targets will receive the top-level `name` config property.

It's important to understand that bindings are actually just operations. Target has other built-in operations which you'll learn about later, as well as supporting custom operations which you can define yourself.

In the examples above, we used a binding shorthand. Bindings have a special short-hand syntax because they are one of the most common operations you'll use as you build your CLI tool.

Let's see review these examples again, but this time we'll use the long-form syntax.

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

Now that you understand bindings, it's time to learn how to sequence and parallelize target execution, and you'll learn more about target composition.
