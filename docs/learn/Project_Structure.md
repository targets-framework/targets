# Recommended Project Structure / Bootstrapping

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

const Targets = require('targets');

Targets.load('./targets/**');

Targets({ name: 'mycli', targets });
```

With this structure in place, so long as each file module inside the `./targets` directory exports a function, the filename (minus the extension) will become the target's name.
