---
title: installation
description: how to add targets as a dependency to your project
weight: 15
---

{{% notice info %}}
To support [the experimental TTY-mode]({{< relref "learn/tty_mode/_index.en.md" >}}) (currently in active development), targets has a subdependency on [node-pty](https://www.npmjs.com/package/node-pty). node-pty uses some recently deprecated native C++ syntax and as a result you might see a few warnings during installation. You can safely disregard these messages—they are just warnings, not errors. A PR for node-pty is in the works.
{{% /notice %}}

## npm install

To add targets as a dependency to your project, simply run `npm i targets`.

```sh
cd ./mycli
npm i targets
```

_**Next Up:** [Hello World]({{< relref "learn/hello_world/_index.en.md" >}})_
