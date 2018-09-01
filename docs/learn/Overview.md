# Overview

## What is Targets?

Targets takes the concept of function composition and surfaces it to the command-line. It enables you, the author of the next great CLI tool, to take many small single-purpose functions and to safely compose them into complex but reliable workflows using a succint declarative syntax.

Use Targets to build common tooling for your team/users and reduce complex workflows into reliable tasks and which are simple to operate on.

## Who would want to use Targets?

Developers, and in particular DevOps folk, and their ilk, will find it particularly useful. If you have some gnarly shell scripts sitting your `$HOME/bin` which you call on with any regularity, you should probably keep reading.

Consider some practical DevOps use cases:

* scheduling builds and deployments
* orchestrating containers
* complex database migrations
* managing messages and dead-letter queues in event-based systems
* auditing source control systems at scale
* auditing dependencies in a micro-services architecture
* managing configuration and secrets

All of the above referenced use cases are examples of complex workflows to which Targets is ideally suited.

So, get ready to throw out all those overgrown POSIX scripts, ditch that late night python hackery, uninstall a few dozen Jenkins plugins and give Targets a spin!

> Targets isn't just about Node.js scripting—it can easily handle readable streams and pty instances. This means that any existing command-line tools you have can easily be incorporated into the workflows you design. There are extensions to make this easy! Keep reading to learn more.

## What is a "target"?

**The short answer:** it's a task.

**The technical answer:** At it's core, a target is just a JavaScript function which may return either null, a value, a [Promise](https://promisesaplus.com/), a [ReadableStream](https://nodejs.org/api/stream.html#stream_readable_streams) or a [pty](https://www.npmjs.com/package/node-pty) instance. But Targets also supports a declarative syntax written as either JSON or YML which allows you to create workflows out of shell commands and/or network requests without writing a single line of code.

## What is a "composition"?

A core capability of Targets is to allow targets to be composed. When you declare a group of targets and give it a name, we call this a composition. You'll learn more about this as you work through the tutorials.

## What is an "operation"?

Operations are meta-targets which handle side-effects. They provide an explicit/declarative mechanism for altering config, dictating control flow, toggling states/modes and otherwise affecting the behavior of your workflows.

## What is a "spec"?

Targets can be written as code, or, for certain types of targets—such as shell commands or HTTP requests—targets can be declared. When declaring a target, we call this a "spec". Targets supports a few useful spec formats out-of-the-box, and supports custom loaders which enable you to implement your own spec interpreters.

## What does a Targets implementation look like?

Some folks do best with an example. So, without any of the necessary context, let's swim straight to the deep end of the pool and consider the anatomy of a decently complex target composition.

```
kind: composition
config:
  git:
    depth: 1
    single-branch: true
spec:
  - '@bind/config.name::config.docker.name'
  - deploy.select
  - '@bind/result.deploy.select.refspec::config.git.branch'
  - mktemp
  - '@bind/result.mktemp::config.git.directory'
  - '@bind/result.mktemp::config.docker.context'
  - git.clone
  - docker.build
  - docker.tag
  - deploy.confirm
  - '@proceed-when/deploy.confirm.ready'
  - docker.push
  - '@bind-to/config.profile-a::k8s.apply,@bind-to/config.profile-b::k8s.apply'
  - '@bind-to/config.profile-a::k8s.verify,@bind-to/config.profile-b::k8s.verify'
```

Here's a breakdown:

* `kind` - This is used by the Targets loader to determine how the rest of the spec should be interpreted.
* `config` - This declares an instance of "bound config". Each target has certain config requirements, but when you are defining a composition, you sometimes want certain pieces of that configuration to be hard-coded with specific values. Declaring `config` on the composition will essentially hard-code these values within the context of the composition.
* `spec` - The contents of the `spec` property will vary for by `kind`, but in this example, each item in `spec` is either a target, another composition or an operation. Operations start with `@`. The operations name sits between the `@` and a `/` and values after the slash are arguments to the operation.

As you might surmise, the above example is only one piece of the puzzle. The full implementation would require each of the targets in the `spec` collection to have an underlying implementation. In this specific example, the targets we're alluding to could easily be defined by simply spec'ing out the necessary shell commands. **You wouldn't even need to write any code.**

That's enough to get you thinking—We'll leave this here for now as a mysterious example for the reader to consider.

> As you start working through the tutorials in this chapter, most of the examples you'll see use JSON for task compositions. Spoiler alert! As you can see in the example above, Targets supports a special YML syntax. You'll learn about this towards the end of the tutorials.

-----


#### Background

### The Targets Origin Story / A Note From the Author

Make was the original build tool. It was originally designed to make configuring, compiling, testing, debugging and running C code easier. Its history is deep coupled with the C programming language. Over time, Make has become useful for all sort of scripting beyond just working with C. In fact, Make was the backbone for a simple docker scheduling tool I wrote a few years ago called [powertrain](https://github.com/carsdotcom/powertrain). Targets on the other hand has nothing to do with C, or any other language. Targets started as an attempt to take the best ideas from Make around how to compose tasks and how to source config, to improve upon and modernize these basic ideas. It's ended up being so much more.

Targets exists because it's a tool that I've always wanted. It's my passion project. But, I'm hoping it can provide value to others as well. Targets was built for me—but anyone with a passion for DevOps and command-line scripting should be able to find new and creative ways to leverage it.

In Make, a target is a reference to the "target" program which you are intending to "make", but Make also supports the concept of "phony targets" which you can define with arbitrary behavior and which can be composed as tasks. It was Make's phony target capabilities which originally inspired this framework, and it's name.
