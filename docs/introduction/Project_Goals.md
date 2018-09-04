# Project Goals

Targets is a feature-rich task scheduling platform which strives to provide a comprehensive solution to a host of common tooling challenges.

- **Must be equally usable by humans and machines**.

  - Tools build with Targets will present a straight-forward interface and display easy to understand output.
  - Targets support multiple run modes in order to adapt the interface and output to the use case. I.E. A "dev" mode and a "tty" mode for humans as well as a "ci" mode for use on automation servers.

- **Provide a declarative solution whenever it is reasonable to do so.**

  - Targets currently supports the declaration of shell commands and HTTP requests out-of-the-box. Additionally, Targets allows for custom "loaders" to be provided via options— this allows users to author their own custom spec interpreters.
  - Targets enforces that all side-effects which arise from the mutation of config or from global state change be declared via "operations".

- **Make configuration easy and flexible**.

  - So much work and thought has gone into how Targets considers and handles configuration that its config system was lifted out of the framework and now exists as two separate modules: [Answers](https://github.com/machellerogden/answers) and [Sugar Merge](https://github.com/machellerogden/sugarmerge). Configuration with Targets continues to evolve.


