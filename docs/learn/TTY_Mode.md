# TTY Mode

### EXPERIMENTAL!

> TTY-mode is NOT complete and is highly-experimental. That said, it is mostly working as of the latest release if you want to give it a go. Use it at your own discretion.

The interleaved output format is very helpful for logs when using targets on a CI system, such as Jenkins, but it can sometimes be a little hard to follow as a user. Also, what if your target results in an interactive TTY? For these reasons, targets has an experiment TTY-mode which will multiplex parallelized output streams.

Consider we were to execute two parallel targets which launched a docker TTY like so:

```
mycli docker.run,docker.run --docker.tty --docker.interaction --docker.name busybox -- --tty
```

> If you add a ` -- ` at the end of your command, any additional arguments will be passed down directly to the framework. For example, for TTY-mode you can add ` -- --tty` at the end of any command. This tells targets to run in "tty" mode.

You would then be presented with a multiplexed terminal which looks something like this:

```
┌───────────────────────┐┌───────────────────────────────────────────────────────┐
│[docker.run,docker.run]││                                                       │
│                       ││[docker] Running: docker run --tty busybox:latest      │
│                       ││[docker] Running: docker run --tty busybox:latest      │
└───────────────────────┘│                                                       │
┌───────────────────────┐│                                                       │
│                       │└───────────────────────────────────────────────────────┘
│docker.run - started   │┌─docker────────────────────────────────────────────────┐
│docker.run - started   ││/ #                                                    │
│                       ││                                                       │
│                       ││                                                       │
│                       ││                                                       │
│                       ││                                                       │
│                       │└───────────────────────────────────────────────────────┘
│                       │┌─docker────────────────────────────────────────────────┐
│                       ││/ #                                                    │
│                       ││                                                       │
│                       ││                                                       │
│                       ││                                                       │
│                       ││                                                       │
└───────────────────────┘└───────────────────────────────────────────────────────┘
```

To move between the panes, just hit `Ctrl-N` or `Ctrl-P`. To exit, hit `Ctrl-C` or `Ctrl-Q`.

Given your target has returned working TTY, as shown above, you can even interact
with the shell inside any of the multiplexed panes.

