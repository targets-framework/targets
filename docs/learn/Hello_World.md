# Hello, World!

Let's jump right in. Open up a terminal and complete the steps below. You should have a working targets CLI tool in just a few minutes.

```
mkdir mycli
cd ./mycli
npm init -y
npm i targets
```

Now, copy the code below into a new `index.js` file.

```js
#!/usr/bin/env node
'use strict';

const greet = () => "Hello, World!";

require('targets')({ targets: { greet } });
```

The above is your first target. As you can see, the most basic target is just a function.

Next, open your `package.json` file (this was created for you when you ran `npm init -y`).

Find the line with `"main": "index.js",` and right underneath that line, add a new line with `"bin": "./index.js",`.

Save the file and exit.

Complete the following steps in your terminal:

```
chmod +x ./index.js
npm link
```

Congratulations! You're done with the setting your new CLI tool.

Now, let's run it. Enter the following in your terminal.

```
mycli greet
```

You should see the following output:

```text
[greet] Hello, World!
```

The output from the `greet` target is prefixed with the target's name. As you add more targets to your tool, this prefix will let you know which output is coming from which target.

You can also define a label if you would like to see a different prefix.

Try editing your `index.js` file as shown below.

```js
#!/usr/bin/env node
'use strict';

const greet = () => "Hello, World!";

greet.label = "Basic Example";

require('targets')({ targets: { greet } });
```

This time when you run `mycli greet` you'd see the following output:

```text
[Basic Example] Hello, World!
```

Every target receives an options object. Let's edit our `index.js` file again.

```js
#!/usr/bin/env node
'use strict';

const greet = ({ name = "World" }) => `Hello, ${name}!`;

greet.label = "Basic Example";

require('targets')({ targets: { greet } });
```

In this case, if you run `mycli greet --greet.name Jane` you'd see the following output:

```text
[Basic Example] Hello, Jane!
```

Notice how `name` has been namespaced with `greet` in the command line option. Instead of just `--name`, you had to specify `--greet.name`. This might seem tedious at first, but you'll understand why this is important as you learn more about the framework.
