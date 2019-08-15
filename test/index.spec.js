'use strict';

import test from 'ava';
import sinon from 'sinon';

test.beforeEach(t => t.context = { sandbox: sinon.createSandbox() });
test.afterEach(t => t.context.sandbox.restore());

test('test', async t => {
    t.assert(true);
});
