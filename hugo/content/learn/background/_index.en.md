---
title: terminology and background
weight: 5
description: what is a "target" anyhow?
---

#### Basic Terminology

More terminology will be introduced as you work through the tutorials, but let's start the most basic thing: **a target**.

### What is a "target"?

**The short answer:** it's a task.

**The technical answer:** At it's core, a target is just a JavaScript function which may return either null, a value, a [Promise](https://promisesaplus.com/), a [ReadableStream](https://nodejs.org/api/stream.html#stream_readable_streams) or a [pty](https://www.npmjs.com/package/node-pty) instance.

### What is the framework for?

The purpose of the targets framework is to enable you, the author of a CLI tool, to take many small single-purpose functions and safely compose them together along with dynamically sourced config in complex ways by way of a succint declarative syntax.

{{% notice tip %}}
The framework is able to handle readable streams and pty instances. This means that any existing command-line tools you have can easily be incorporated into the workflows you design. There are extensions to make this easy! Keep reading to learn more.
{{% /notice %}}

### What is a composition?

The main purpose of the framework is to compose targets. If you declare a group of targets and give it a name, we call this a composition. You learn more about this as you work through the tutorials.

### The Deep End

#### A.K.A. A mysterious example to peak your curiousity

Some folks do best with an example. So, **without any of the necessary context**, let's go straight to the deep end. Below is a fairly complex example of a possible target composition for your consideration. You're not expected to understand what any of this is yet, but if it peaks your curiousity, I encourage you to read on. There's much to explore here, and what you see below won't make much sense until you make it all the way to the end of the docs.

```
kind: composition
config:
  git:
    depth: 1
    single-branch: true
spec:
  - '@rebind/name::docker.name'
  - deploy.select
  - '@bind/deploy.select.refspec::git.branch'
  - mktemp
  - '@bind/mktemp::git.directory'
  - '@bind/mktemp::docker.context'
  - git.clone
  - docker.build
  - docker.tag
  - deploy.confirm
  - '@proceed-when/deploy.confirm.ready'
  - docker.push
  - '@bound-to/profile-a::k8s.apply,@bound-to/profile-b::k8s.apply'
  - '@bound-to/profile-a::k8s.verify,@bound-to/profile-b::k8s.verify'
```

{{% notice info %}}
As you start working through the tutorials in this chapter, most of the examples you'll see use JSON for task compositions. Spoiler alert! As you can see above, Targets supports a special YML syntax. You'll learn about this towards the end of the tutorials.
{{% /notice %}}

#### Background

### The Targets Origin Story / A Note From the Author

Make was the original build tool. It was originally designed to make configuring, compiling, testing, debugging and running C code easier. It's history is deep coupled with the C programming language. Over time, Make has become useful for all sort of scripting beyond just working with C. In fact, Make was the backbone for a simple docker scheduling tool I wrote a few years ago called [powertrain](https://github.com/carsdotcom/powertrain). Targets on the other hand has nothing to do with C, or any other language. Targets started as an attempt to take the best ideas from Make around how to compose tasks and how to source config, to improve upon and modernize these basic ideas. It's ended up being so much more.

Targets exists because it's a tool that I've always wanted. It's my passion project. But, I'm hoping it can provide value to others as well. Targets was built for me—but anyone with a passion for DevOps and command-line scripting should be able to find new and creative ways to leverage it.

In Make, a target is a reference to the "target" program which you are intending to "make", but Make also supports the concept of "phony targets" which you can define with arbitrary behavior and which can be composed as tasks. It was Make's phony target capabilities which originally inspired this framework, and it's name.

_**Next Up:** [prerequisites]({{< relref "learn/prerequisites/_index.en.md" >}})_

