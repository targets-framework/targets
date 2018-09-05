# What does a Targets implementation look like?

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
  - '@proceed-when/result.deploy.confirm.ready'
  - docker.push
  - '@bind-to/config.profile-a::k8s.apply,@bind-to/config.profile-b::k8s.apply'
  - '@bind-to/config.profile-a::k8s.verify,@bind-to/config.profile-b::k8s.verify'
```

Here's a breakdown:

* `kind` - This is used by the Targets loader to determine how the rest of the spec should be interpreted.
* `config` - This declares an instance of "bound config". Each target has certain config requirements, but when you are defining a composition, you sometimes want certain pieces of that configuration to be hard-coded with specific values. Declaring `config` on the composition will essentially hard-code these values within the context of the composition.
* `spec` - The contents of the `spec` property will vary for by `kind`, but in this example, each item in `spec` is either a target, another composition or an operation. Operations start with `@`. The operations name sits between the `@` and a `/` and values after the slash are arguments to the operation.

As you might surmise, the above example is only one piece of the puzzle. The full implementation would require each of the targets in the `spec` collection to have an underlying implementation. In this specific example, the targets we're alluding to could easily be defined by simply spec'ing out the necessary shell commands. **You wouldn't even need to write any code.**

That's enough to get you thinking—We'll leave this here for now as a mysterious
example for the reader to consider.

> As you start working through the tutorials in this chapter, most of the examples you'll see use JSON for task compositions. As you can see in the example above, Targets supports a special YML syntax. You'll learn about this towards the end of the tutorials.
