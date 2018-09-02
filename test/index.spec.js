'use strict';
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const proxyquire = require('proxyquire');

describe('Targets', () => {
    let sandbox;

    beforeEach(() => sandbox = sinon.createSandbox());
    afterEach(() => sandbox.restore());

    function setup({ answers = {} }) {

        const answersStub = { get: () => {}, configure: () => {} };
        sandbox.stub(answersStub, 'get').resolves(answers);

        const Targets = proxyquire('..', { answers: () => answersStub });

        return { Targets, answersStub };
    }

    it('should prompt user with choices for which registered targets to invoke', () => {

        const argv = [ 'foo' ];
        const answers = { _: argv };
        const { Targets, answersStub } = setup({ answers });
        const foo = () => 'bar';

        return Targets({ argv, targets: { foo } })
            .then(() => expect(answersStub.get).to.have.been.called);
    });

    describe('chosen targets', () => {

        it('should be invoked', () => {

            const argv = [ 'foo', 'bar' ];
            const answers = { _: argv };

            const { Targets } = setup({ answers });

            const foo = sandbox.stub().returns('foo');
            foo.label = 'Foo';

            const bar = sandbox.stub().returns('bar');
            bar.label = 'Bar';

            return Targets({ argv, targets: { foo, bar } }).then(() => {
                expect(foo).to.have.been.called;
                expect(bar).to.have.been.called;
            });
        });

        it('should be invoked with options from answers', () => {

            const fooOptions = {
                fooProp: 'fooValue'
            };

            const barOptions = {
                barProp: 'barValue'
            };

            const argv = [ 'foo', 'bar' ];

            const answers = {
                _: argv,
                config: {
                    foo: fooOptions,
                    bar: barOptions
                }
            };

            const { Targets } = setup({ answers });

            const foo = sandbox.stub().returns('foo');
            foo.label = 'Foo';

            const bar = sandbox.stub().returns('bar');
            bar.label = 'Bar';

            return Targets({ argv, targets: { foo, bar } }).then(() => {
                expect(foo).to.have.been.calledWithMatch(fooOptions);
                expect(bar).to.have.been.calledWithMatch(barOptions);
            });
        });

        it('should use function name if no label found', () => {

            const argv = [ 'foo' ];
            const answers = { _: argv };

            const { Targets } = setup({ answers });

            const foo = sandbox.stub().resolves('bar');

            sandbox.spy(console, 'log');

            return Targets({ argv, targets: { foo } })
                .then(() => expect(console.log).to.have.been.calledWith(sinon.match(/foo/), sinon.match.any));
        });

        it('should reject with an error when target is not found', () => {

            const argv = [ 'foo' ];
            const answers = { _: argv };

            const { Targets } = setup({ answers });

            return expect(Targets({ argv, targets: {} })).to.be.rejectedWith(Error, 'invalid target in command');
        });
    });

    describe('binding operations', () => {

        it('bind should use result at given path of a target to extend config for another target', () => {

            const fooResult = { fooProp: 'fooValue' };
            const barOptions = { barProp: 'barValue' };

            const argv = [ 'foo', '@bind/result.foo.fooProp::config.bar.barProp', 'bar' ];

            const answers = {
                _: argv,
                config: {
                    bar: barOptions
                }
            };

            const { Targets } = setup({ answers });

            const foo = sandbox.stub().returns(fooResult);
            const bar = sandbox.spy(({ barProp = 'bar' }) => barProp);

            return Targets({ argv, targets: { foo, bar } })
                .then(() => expect(bar).to.have.been.calledWithMatch({ barProp: 'fooValue' }));
        });

        it('bind should use result at given path of a target to extend config for another target', () => {

            const fooOptions = { fooProp: 'fooValue' };
            const barOptions = { barProp: 'barValue' };

            const argv = [ '@bind/config.foo.fooProp::config.bar.barProp', 'bar' ];

            const answers = {
                _: argv,
                config: {
                    foo: fooOptions,
                    bar: barOptions
                }
            };

            const { Targets } = setup({ answers });

            const bar = sandbox.spy(({ barProp = 'bar' }) => barProp);

            return Targets({ argv, targets: { bar } })
                .then(() => expect(bar).to.have.been.calledWithMatch({ barProp: 'fooValue' }));
        });

        describe('binding shorthand', () => {

            it('bind shorthand should use result at given path of a target to extend config for another target', () => {

                const fooResult = { fooProp: 'fooValue' };
                const barOptions = { barProp: 'barValue' };

                const argv = [ 'foo', '@result.foo.fooProp::config.bar.barProp', 'bar' ];

                const answers = {
                    _: argv,
                    config: {
                        bar: barOptions
                    }
                };

                const { Targets } = setup({ answers });

                const foo = sandbox.stub().returns(fooResult);
                const bar = sandbox.spy(({ barProp = 'bar' }) => barProp);

                return Targets({ argv, targets: { foo, bar } })
                    .then(() => expect(bar).to.have.been.calledWithMatch({ barProp: 'fooValue' }));
            });

            it('bind shorthand should use result at given path of a target to extend config for another target', () => {

                const fooOptions = { fooProp: 'fooValue' };
                const barOptions = { barProp: 'barValue' };

                const argv = [ '@config.foo.fooProp::config.bar.barProp', 'bar' ];

                const answers = {
                    _: argv,
                    config: {
                        foo: fooOptions,
                        bar: barOptions
                    }
                };

                const { Targets } = setup({ answers });

                const bar = sandbox.spy(({ barProp = 'bar' }) => barProp);

                return Targets({ argv, targets: { bar } })
                    .then(() => expect(bar).to.have.been.calledWithMatch({ barProp: 'fooValue' }));
            });
        });

    });

    describe('@when', () => {

        it('should execute given target given truthy result of predicate', () => {

            const fooResult = { fooProp: 'fooValue' };

            const argv = [ 'foo', '@when/result.foo.fooProp::fooValue::bar' ];

            const answers = { _: argv };

            const { Targets } = setup({ answers });

            const foo = sandbox.stub().returns(fooResult);
            const bar = sandbox.spy(() => 'this should happen');

            return Targets({ argv, targets: { foo, bar } })
                .then(() => expect(bar).to.have.been.called);
        });

        it('should not execute given target given falsy result of predicate', () => {

            const fooResult = { fooProp: 'fooValue' };

            const argv = [ 'foo', '@when/result.foo.fooProp::otherValue::bar' ];

            const answers = { _: argv };

            const { Targets } = setup({ answers });

            const foo = sandbox.stub().returns(fooResult);
            const bar = sandbox.spy(() => 'this should not happen');

            return Targets({ argv, targets: { foo, bar } })
                .then(() => expect(bar).not.to.have.been.called);
        });

    });

    describe('@when-not', () => {

        it('should not execute given target given truthy result of predicate', () => {

            const fooResult = { fooProp: 'fooValue' };

            const argv = [ 'foo', '@when-not/result.foo.fooProp::fooValue::bar' ];

            const answers = { _: argv };

            const { Targets } = setup({ answers });

            const foo = sandbox.stub().returns(fooResult);
            const bar = sandbox.spy(() => 'this should happen');

            return Targets({ argv, targets: { foo, bar } })
                .then(() => expect(bar).not.to.have.been.called);
        });

        it('should execute given target given falsy result of predicate', () => {

            const fooResult = { fooProp: 'fooValue' };

            const argv = [ 'foo', '@when-not/result.foo.fooProp::otherValue::bar' ];

            const answers = { _: argv };

            const { Targets } = setup({ answers });

            const foo = sandbox.stub().returns(fooResult);
            const bar = sandbox.spy(() => 'this should not happen');

            return Targets({ argv, targets: { foo, bar } })
                .then(() => expect(bar).to.have.been.called);
        });

    });
});
