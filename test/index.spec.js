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

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    function setup(options) {
        const { answers = {} } = options;
        const answersStub = {
            get: () => {}
        };
        sandbox.stub(answersStub, 'get').resolves(answers);
        const Targets = proxyquire('..', { answers: () => answersStub });
        return { Targets, answersStub };
    }

    it('should prompt user with choices for which registered targets to invoke', () => {
        const argv = [ 'foo' ];
        const answers = {
            _: argv
        };
        const { Targets, answersStub } = setup({ answers });
        function foo() { return 'bar'; }
        return Targets({ argv, targets: { foo } }).then(() => {
            expect(answersStub.get).to.have.been.called;
        });
    });
    describe('chosen targets', () => {
        it('should be invoked', () => {
            const argv = [ 'foo', 'bar' ];
            const answers = {
                _: argv
            };
            const { Targets } = setup({ answers });
            const foo = sandbox.stub().returns("foo");
            foo.label = "Foo";
            const bar = sandbox.stub().returns("bar");
            bar.label = "Bar";
            return Targets({ argv, targets: { foo, bar } }).then(() => {
                expect(foo).to.have.been.called;
                expect(bar).to.have.been.called;
            });
        });
        it('should be invoked with options from answers', () => {
            const fooOptions = {
                fooProp: "fooValue"
            };
            const barOptions = {
                barProp: "barValue"
            };
            const argv = [ 'foo', 'bar' ];
            const answers = {
                _: argv,
                foo: fooOptions,
                bar: barOptions
            };
            const { Targets } = setup({ answers });
            const foo = sandbox.stub().returns("foo");
            foo.label = "Foo";
            const bar = sandbox.stub().returns("bar");
            bar.label = "Bar";
            return Targets({ argv, targets: { foo, bar } }).then(() => {
                expect(foo).to.have.been.calledWithMatch(fooOptions);
                expect(bar).to.have.been.calledWithMatch(barOptions);
            });
        });
        it.skip('should do something if a targets rejects', () => {
            const answers = {
                _: [ 'foo', 'bar' ]
            };
            const { Targets } = setup({ answers });
            const foo = sandbox.stub().rejects();
            foo.label = "Foo";
            const bar = sandbox.stub().rejects();
            bar.label = "Bar";
            sandbox.spy(console, 'log');
            return Targets({ targets: { foo, bar } }).then(() => {
                expect(console.log).to.have.been.calledWith(sinon.match(/something/));
            });
        });
        it('should use function name if no label found', () => {
            const argv = [ 'foo', 'bar' ];
            const answers = {
                _: argv
            };
            const { Targets } = setup({ answers });
            const foo = sandbox.stub().resolves('bar');
            sandbox.spy(console, 'log');
            return Targets({ argv, targets: { foo } }).then(() => {
                expect(console.log).to.have.been.calledWith(sinon.match(/foo/), sinon.match.any);
            });
        });
        it('should log if target not found', () => {
            const argv = [ 'foo' ];
            const answers = {
                _: argv
            };
            const { Targets } = setup({ answers });
            sandbox.spy(console, 'log');
            return Targets({ argv, targets: {} }).then(() => {
                expect(console.log).to.have.been.calledWith('invalid target in command');
            });
        });
    });
});
