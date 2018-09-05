# Scheduler

> This section is a work-in-progress.

## Sequential Target Invokation

Target names delimited by a space will be executed sequentially.

```sh
build publish deploy
```

## Parallel Target Invokation

Target names delimited by a comma will be executed in parallel.

```sh
deploy-a,deploy-b,deploy-c
```
