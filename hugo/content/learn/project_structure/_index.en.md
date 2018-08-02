---
title: project structure
weight: 55
description: recommendations for how to structure your targets projects
---

### Recommended Project Structure / Bootstrapping

You can structure your project however you like, however, here is some basic guidance you might find useful.

If you define all your targets in a `./targets` directory like so:

```
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

### Using Loaders

If you are using the `Targets.load(<glob>)` function, you can gain much more flexibility in you organize things. More on this coming soon.

**TODO: add section about `load`**

_**Next Up:** [More to learn]({{< relref "learn/more/_index.en.md" >}})_
