# Global Store

Targets maintains state in a global config store. The store itself is a collection wherein each state change results in a new object being appended to the collection.

The global store houses three primary data sets under three corresponding keys: `config`, `result` and `setting`.

* The state which is maintained under the `config` property holds the composite result of all config sources and is updated as the config is operated on by a given workflow.
* The state which is maintained under the `result` property holds the resolved values from each target execution in a given workflow and is updated as new results are resolved.
* The state which is maintained under the `setting` property holds any settings which have been provided via config or at runtime.
