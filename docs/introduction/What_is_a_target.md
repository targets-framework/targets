# What is a "target"?

**The short answer:** it's a task.

**The technical answer:** At it's core, a target is just a JavaScript function
which may return either null, a value, a [Promise](https://promisesaplus.com/),
a [ReadableStream](https://nodejs.org/api/stream.html#stream_readable_streams)
or a [pty](https://www.npmjs.com/package/node-pty) instance. Targets also
supports a declarative syntax written as either JSON or YML which allows you to
create workflows out of shell commands and/or network requests without writing a
single line of code.
