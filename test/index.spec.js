'use strict';
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const inquirer = require('inquirer');
var proxyquire = require('proxyquire').noPreserveCache();

describe('Targets', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    function setup(options) {
        let {
            argv = { _: [] },
            choices = [],
            answers = { options: [] }
        } = options;
        let {
            Targets = proxyquire('..', { minimist: () => argv, './lib/config': {} }),
        } = options;
        const promptOptions = {
            type: 'checkbox',
            name: 'options',
            message: 'What information would you like to see?',
            choices
        };
        const prompts = [
            promptOptions
        ];
        sandbox.stub(inquirer, 'prompt').resolves(answers);
        return { argv, Targets, prompts, answers };
    }

    it('should prompt user with choices for which registered targets to invoke', () => {
        let { Targets, prompts } = setup({
            choices: [
                {
                    name: "foo",
                    value: "foo"
                }
            ]
        });
        function foo() { return 'bar'; }
        return Targets({ targets: { foo } }).then(() => {
            expect(inquirer.prompt).to.have.been.called;
            expect(inquirer.prompt).to.have.been.calledWith(prompts);
        });
    });
    describe('chosen targets', () => {
        it('should be invoked', () => {
            let { Targets } = setup({
                answers: {
                    options: [ 'foo', 'bar' ]
                }
            });
            const foo = sandbox.stub().returns("foo");
            foo.label = "Foo";
            const bar = sandbox.stub().returns("bar");
            bar.label = "Bar";
            return Targets({ targets: { foo, bar } }).then(() => {
                expect(foo).to.have.been.called;
                expect(bar).to.have.been.called;
            });
        });
        it('should be invoked with options from inquirer', () => {
            let { Targets } = setup({
                answers: {
                    options: [ 'foo', 'bar' ]
                }
            });
            const foo = sandbox.stub().returns("foo");
            foo.label = "Foo";
            const bar = sandbox.stub().returns("bar");
            bar.label = "Bar";
            return Targets({ targets: { foo, bar } }).then(() => {
                expect(foo).to.have.been.calledWith(sinon.match.has('options', [ 'foo', 'bar' ]));
                expect(bar).to.have.been.calledWith(sinon.match.has('options', [ 'foo', 'bar' ]));
            });
        });
        it('should be invoked with options from minimist', () => {
            let { Targets } = setup({
                argv: {
                    _: [ 'foo', 'bar' ]
                }
            });
            const foo = sandbox.stub().returns("foo");
            foo.label = "Foo";
            const bar = sandbox.stub().returns("bar");
            bar.label = "Bar";
            return Targets({ targets: { foo, bar } }).then(() => {
                expect(foo).to.have.been.calledWith(sinon.match.has('options', [ 'foo', 'bar' ]));
                expect(bar).to.have.been.calledWith(sinon.match.has('options', [ 'foo', 'bar' ]));
            });
        });
        it('should report undefined if they reject', () => {
            let { Targets } = setup({
                argv: {
                    _: [ 'foo', 'bar' ]
                }
            });
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
            let { Targets } = setup({
                argv: {
                    _: [ 'foo' ]
                }
            });
            const foo = sandbox.stub().resolves('bar');
            sandbox.spy(console, 'log');
            return Targets({ targets: { foo } }).then(() => {
                expect(console.log).to.have.been.calledWith(sinon.match(/proxy/), sinon.match.any);
            });
        });
        it('should log if target not found', () => {
            let { Targets } = setup({
                argv: {
                    _: [ 'boom' ]
                }
            });
            const foo = sandbox.stub().rejects();
            foo.label = "Foo";
            sandbox.spy(console, 'log');
            return Targets({ targets: { foo } }).then(() => {
                expect(console.log).to.have.been.calledWith("no target found");
            });
        });
        it('should have any prompts which they define added to the main prompts', () => {
            let answers = {
                options: [ "foo" ]
            };
            let { Targets } = setup({
                answers
            });
            const foo = sandbox.stub().resolves("bar");
            foo.label = "Foo";
            foo.prompts = [
                {
                    type: 'input',
                    name: "foo",
                    message: "Bar?",
                    default: "Bar"
                }
            ];
            return Targets({ targets: { foo } }).then(() => {
                expect(inquirer.prompt).to.have.been.called;
                expect(inquirer.prompt).to.have.been.calledWith(sinon.match((prompts) => {
                    return prompts.length === 2 && prompts[1].default === foo.prompts[0].default && prompts[1].name === foo.prompts[0].name && prompts[1].message === foo.prompts[0].message && prompts[1].when(answers) === true;
                }));
            });
        });
        it('should register `when` if set as false (along with the default `when`)', () => {
            let answers = {
                options: [ "foo" ]
            };
            let { Targets } = setup({
                answers
            });
            const foo = sandbox.stub().resolves("bar");
            foo.label = "Foo";
            foo.prompts = [
                {
                    type: 'input',
                    name: "foo",
                    message: "Bar?",
                    default: "Bar",
                    when: false
                }
            ];
            return Targets({ targets: { foo } }).then(() => {
                expect(inquirer.prompt).to.have.been.called;
                expect(inquirer.prompt).to.have.been.calledWith(sinon.match((prompts) => {
                    return prompts[1].when(answers) === false;
                }));
            });
        });
        it('should register `when` if set as true (along with the default `when`)', () => {
            let answers = {
                options: [ "foo" ]
            };
            let { Targets } = setup({
                answers
            });
            const foo = sandbox.stub().resolves("bar");
            foo.label = "Foo";
            foo.prompts = [
                {
                    type: 'input',
                    name: "foo",
                    message: "Bar?",
                    default: "Bar",
                    when: true
                }
            ];
            return Targets({ targets: { foo } }).then(() => {
                expect(inquirer.prompt).to.have.been.called;
                expect(inquirer.prompt).to.have.been.calledWith(sinon.match((prompts) => {
                    return prompts[1].when(answers) === true;
                }));
            });
        });
        it('should register `when` if set as function returning false (along with the default `when`)', () => {
            let answers = {
                options: [ "foo" ]
            };
            let { Targets } = setup({
                answers
            });
            const foo = sandbox.stub().resolves("bar");
            foo.label = "Foo";
            foo.prompts = [
                {
                    type: 'input',
                    name: "foo",
                    message: "Bar?",
                    default: "Bar",
                    when: () => false
                }
            ];
            return Targets({ targets: { foo } }).then(() => {
                expect(inquirer.prompt).to.have.been.called;
                expect(inquirer.prompt).to.have.been.calledWith(sinon.match((prompts) => {
                    return prompts[1].when(answers) === false;
                }));
            });
        });
        it('should register `when` if set as function returning true (along with the default `when`)', () => {
            let answers = {
                options: [ "foo" ]
            };
            let { Targets } = setup({
                answers
            });
            const foo = sandbox.stub().resolves("bar");
            foo.label = "Foo";
            foo.prompts = [
                {
                    type: 'input',
                    name: "foo",
                    message: "Bar?",
                    default: "Bar",
                    when: () => true
                }
            ];
            return Targets({ targets: { foo } }).then(() => {
                expect(inquirer.prompt).to.have.been.called;
                expect(inquirer.prompt).to.have.been.calledWith(sinon.match((prompts) => {
                    return prompts[1].when(answers) === true;
                }));
            });
        });
    });
});
