# Composition

> The examples in this section build on what you learned in the ["Bindings"
> tutorial](Bindings.md).

Targets are run sequentially by default, but when separated by comma they will
be invoked in parallel.

Here's an example of running two targets in parallel:

```
mycli weather.sky,weather.temp --weather.location Chicago
[Current Temperature] 75
[Current Weather] Partly Sunny
```

Note the order of the results. Because these were run in parallel the order of
the results is non-deterministic.

Targets is all about composing small, single-purpose targets with various
operations and configuration. When you declare a group of targets and give it a
name, we call this a composition.

You've already seen a basic composition in a previous example when we learned
about bindings. Now, let's explore Targets' scheduler and how Targets handles
the sequencing and parallelizing of target compositions.

Set your `index.js` file to the following:

```
#!/usr/bin/env node
'use strict';

const { promisify } = require('util');
const sleep = promisify(setTimeout);
const clock = () => String(Math.floor(Date.now()/1000)).slice(-1);
const a = () => sleep(1000).then(() => `scheduler demo - ${clock()}`);
const b = [ 'a', 'a,a,a', 'a' ];
const c = [ 'b', 'b,b,b', 'b' ];

require('targets')({ targets: { a, b, c } });
```

Run `mycli a`.

You should see something similar to the following output print after short
delay:

```
[a] scheduler demo - 7
```

Now, run `mycli b`.

You should see something similar to the following output print out over the
course of a few seconds:

```
[a] scheduler demo - 4
[a] scheduler demo - 5
[a] scheduler demo - 5
[a] scheduler demo - 5
[a] scheduler demo - 6
```

Note how the three lines in the middle all printed at the same time (the counter
shows the same number).

This demonstrates how the parallelized groups can be nest within greater
sequences. As a final demonstration run `mycli c`.

Over the course of several seconds your should see something similar to the
following output:

```
[a] scheduler demo - 6
[a] scheduler demo - 7
[a] scheduler demo - 7
[a] scheduler demo - 7
[a] scheduler demo - 8
[a] scheduler demo - 9
[a] scheduler demo - 9
[a] scheduler demo - 9
[a] scheduler demo - 0
[a] scheduler demo - 0
[a] scheduler demo - 0
[a] scheduler demo - 0
[a] scheduler demo - 0
[a] scheduler demo - 0
[a] scheduler demo - 0
[a] scheduler demo - 0
[a] scheduler demo - 0
[a] scheduler demo - 1
[a] scheduler demo - 1
[a] scheduler demo - 1
[a] scheduler demo - 2
[a] scheduler demo - 3
[a] scheduler demo - 3
[a] scheduler demo - 3
[a] scheduler demo - 4
```

If you scrutinize the clock output, you will see that parallel groups can be
nested within sequences and sequences can be nested in parallel groups to an
arbitrary depth. This is obviously a contrived example, but it demonstrates the
scheduling capabilities of the framework.

Now, not all targets output a single line at a single moment in time. Because
Targets can return streams, and if you parallelize something with a stream, you
will get interleaved results. All lines are prefixed with a label, so this should
help you sort out which output is coming from which target.

Let's take a look at a target which returns a stream.

```js
#!/usr/bin/env node
'use strict';

const { spawn } = require('child_process');

const tcpdump = () => spawn('tcpdump', ['-i', 'en0', '-n', '-s', '0']);

require('targets')({ targets: { tcpdump } });
```

Now, when we run `sudo mycli tcpdump` the output from tcpdump is streamed to the
console.

```
sudo mycli tcpdump
[tcpdump] output here...
[tcpdump] output here...
[tcpdump] output here...
[tcpdump] output here...
[tcpdump] output here...
```

> Note that `sudo` is required for this example because tcpdump needs permission
> to attach to your network interface.

If you were to compose this with other streams or asynchrous targets, the output
will be interleaved but each line will always be prefixed with the reporting
target's label.

**TODO: add interleaved stream output example to docs.**
