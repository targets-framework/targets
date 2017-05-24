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
            get: () => {},
            configure: () => {}
        };
        sandbox.stub(answersStub, 'get').resolves(answers);
        sandbox.stub(answersStub, 'configure');
        const Targets = proxyquire('..', { answers: () => answersStub });
        return { Targets, answersStub };
    }

    it('should prompt user with choices for which registered targets to invoke', () => {
        const answers = {
            _: [ 'foo' ]
        };
        const { Targets, answersStub } = setup({ answers });
        function foo() { return 'bar'; }
        return Targets({ targets: { foo } }).then(() => {
            expect(answersStub.get).to.have.been.called;
        });
    });
    describe('chosen targets', () => {
        it('should be invoked', () => {
            const answers = {
                _: [ 'foo', 'bar' ]
            };
            const { Targets } = setup({ answers });
            const foo = sandbox.stub().returns("foo");
            foo.label = "Foo";
            const bar = sandbox.stub().returns("bar");
            bar.label = "Bar";
            return Targets({ targets: { foo, bar } }).then(() => {
                expect(foo).to.have.been.called;
                expect(bar).to.have.been.called;
            });
        });
        it('should be invoked with options from answers', () => {
            const answers = {
                _: [ 'foo', 'bar' ]
            };
            const { Targets } = setup({ answers });
            const foo = sandbox.stub().returns("foo");
            foo.label = "Foo";
            const bar = sandbox.stub().returns("bar");
            bar.label = "Bar";
            return Targets({ targets: { foo, bar } }).then(() => {
                expect(foo).to.have.been.calledWith(sinon.match.has('_', [ 'foo', 'bar' ]));
                expect(bar).to.have.been.calledWith(sinon.match.has('_', [ 'foo', 'bar' ]));
            });
        });
        it('should report undefined if they reject', () => {
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
                expect(console.log).to.have.been.calledWith(sinon.match.any, "unavailable");
            });
        });
        it('should use function name if no label found', () => {
            const answers = {
                _: [ 'foo', 'bar' ]
            };
            const { Targets } = setup({ answers });
            const foo = sandbox.stub().resolves('bar');
            sandbox.spy(console, 'log');
            return Targets({ targets: { foo } }).then(() => {
                expect(console.log).to.have.been.calledWith(sinon.match(/proxy/), sinon.match.any);
            });
        });
        it('should log if target not found', () => {
            const answers = {
                _: [ 'foo' ]
            };
            const { Targets } = setup({ answers });
            sandbox.spy(console, 'log');
            return Targets({ targets: {} }).then(() => {
                expect(console.log).to.have.been.calledWith("no target found");
            });
        });
        it('should have any prompts which they define added to the main prompts', () => {
            const answers = {
                _: [ 'foo' ]
            };
            const { Targets, answersStub } = setup({ answers });
            const foo = sandbox.stub().resolves("bar");
            foo.label = "Foo";
            foo.prompts = [
                {
                    type: 'input',
                    name: "bar",
                    message: "Bar?",
                    default: "Bar"
                }
            ];
            return Targets({ targets: { foo } }).then(() => {
                expect(answersStub.configure).to.have.been.called;
                expect(answersStub.configure).to.have.been.calledWith('prompts', sinon.match(foo.prompts));
            });
        });
    });
});
