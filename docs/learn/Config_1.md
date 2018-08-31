# Config - Part 1

> The examples in this section build on what you learned in the ["Hello, World!" tutorial]({{< relref "learn/hello_world/_index.en.md" >}}). If you're new to targets, start there.

Let's make something a little more useful than hello world.

We'll reuse what you setup in the ["Hello, World!" tutorial]({{< relref "learn/hello_world/_index.en.md" >}}) but let's add a couple more dependencies.

```
npm i weather-js mem
```

Now, copy this into your `index.js` file.

```js
#!/usr/bin/env node
'use strict';

const { promisify } = require('util');
const mem = require('mem');
const weatherJs = require('weather-js');

const getWeather = mem((location) => promisify(weatherJs.find)({
    search: location,
    degreeType: 'F'
}));

const weatherSky = ({ location }) => getWeather(location)
        .then((r) => r[0].current.skytext);

weatherSky.label = "Current Weather";

const weatherTemp = ({ location }) => getWeather(location)
        .then((r) => r[0].current.temperature);

weatherSky.label = "Current Temperature";

require('targets')({
    targets: {
        'weather.sky': weatherSky,
        'weather.temp': weatherTemp
    }
});
```

If you register multiple targets to a given namespace, as we've done above, they will share config.

You can now specify location as `--weather.location Chicago` for both `mycli weather.sky` and `mycli weather.temp`. For example:

```
mycli weather.sky --weather.location Chicago
[Current Weather] Partly Sunny
mycli weather.temp --weather.location Chicago
[Current Temperature] 75
```

This is a good point at which to demonstrate how tasks can be composed, or run together. Consider the following.

```
mycli weather.sky weather.temp --weather.location Chicago
[Current Weather] Partly Sunny
[Current Temperature] 75
```

We'll talk more about composition [later]({{< relref "learn/composition/_index.en.md" >}}). For now, let's take a look at other ways config can be declared and provided to our targets.

Consider the following:

```js
#!/usr/bin/env node
'use strict';

const { promisify } = require('util');
const mem = require('mem');
const weatherJs = require('weather-js');

const getWeather = mem((location) => promisify(weatherJs.find)({
    search: location,
    degreeType: 'F'
}));

const weatherSky = ({ location }) => getWeather(location)
        .then((r) => r[0].current.skytext);

weatherSky.label = "Current Weather";

const weatherTemp = ({ location }) => getWeather(location)
        .then((r) => r[0].current.temperature);

weatherSky.label = "Current Temperature";

const prompts = [
    {
        "name": "location",
        "message": "Where would you like to know about?",
        "default": "Chicago"
    }
];

weatherSky.prompts = prompts;
weatherTemp.prompts = prompts;

require('targets')({
    targets: {
        'weather.sky': weatherSky,
        'weather.temp': weatherTemp
    }
});

```

In this example, we've adding some prompts to our weather targets. By doing this, we are declaring what configuration our target requires in order to run, but we're doing so in way which will allow the system to ask for the needed input if it is not provided.

If we run the above with `mycli weather.sky weather.temp` and no additional arguments, Targets will detect that config is missing for these targets and you will be prompted.

The output will look something like this.

```
mycli weather.sky weather.temp
? [weather.location] Where would you like to know about? Miami
[Current Temperature] Mostly Clear
[weather.temp] 83
```

{{% notice tip %}}
Notice that even though you added these prompts to both of your targets, you only get prompted once. Each prompt is unique by name.
{{% /notice %}}

If the needed config is provided, the user will not be prompted, just as before.

```
mycli weather.sky weather.temp --weather.location Chicago
[Current Weather] Partly Sunny
[Current Temperature] 75
```

> Targets calls this concept "naive config". It gives the user the ability to use your target without knowing what config is needed because the target itself knows how to ask for it.

All prompts are defined as [inquirer](https://www.npmjs.com/package/inquirer) options. Check the inquirer docs to learn the various ways you'll be able to prompt for config.

Config in target goes much deeper than command-line arguments and prompts however. In the next section we'll explore some of the ways that targets handles config files.
