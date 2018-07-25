'use strict';

const blessed = require('blessed');
const XTerm = require('blessed-xterm');
const mem = require('mem');
const debounce = require('lodash/debounce');

const memoized = mem(Tty);
memoized.isTTY = false;

const nodes = [];
const targets = [];
let focused = 0;

const Style = () => ({
    fg: 'default',
    bg: 'default',
    border: { fg: 'white' },
    focus: { border: { fg: 'cyan' } },
    scrolling: { border: { fg: 'red' } }
});

module.exports = memoized;

function Tty() {
    memoized.isTTY = true;

    function append(node) {
        screen.append(node);
        nodes.push(node);
    }

    const screen = blessed.screen({
        title:       process.title,
        smartCSR:    true,
        autoPadding: false,
        warnings:    false
    });

    const queueReport = blessed.box({
        border: 'line',
        left: 0,
        top: 0,
        width: Math.floor(screen.width / 4),
        height: Math.floor(screen.height / 4),
        scrollable: true,
        scrollbar: true,
        style: Style(),
        tags: true
    });

    const dashboard = blessed.box({
        border: 'line',
        left: 0,
        top: Math.floor(screen.height / 4),
        width: Math.floor(screen.width / 4),
        height: 'shrink',
        shrink: true,
        scrollable: true,
        scrollbar: true,
        style: Style(),
        tags: true
    });

    append(queueReport);
    append(dashboard);

    function addLine(line) {
        if (this.getLines().length >= this.height - 2) this.deleteTop();
        this.insertBottom(line);
        screen.render();
    }

    dashboard.addLine = addLine;
    queueReport.addLine = addLine;

    screen.key([ 'C-n' ], debounce(() => {
        if (focused < nodes.length) focused++;
        if (focused == nodes.length) focused = 0;
        dashboard.addLine(`focused: ${focused}`);
        nodes[focused].focus();
    }, 100));

    screen.key([ 'C-p' ], debounce(() => {
        if (focused >= 0) focused--;
        if (focused < 0) focused = nodes.length - 1;
        dashboard.addLine(`focused: ${focused}`);
        nodes[focused].focus();
    }, 100));

    const terminate = () => {
        screen.destroy();
        process.exit(0);
    };

    screen.key([ 'C-q', 'C-c' ], () => {
        terminate();
    });

    screen.render();

    function appendTarget(node) {
        append(node);
        targets.push(node);
        const height = `${parseInt(100 / (targets.length || 1))}%`;
        targets.forEach((t, i) => {
            t.top = `${(parseInt(100 / (targets.length || 1)) * (i + 1)) - parseInt(100 / (targets.length || 1))}%`;
            t.height = height;
        });
    }

    const spawnTerminal = (cmd, args) => {
        const terminal = new XTerm({
            shell: cmd,
            args,
            env: process.env,
            cwd: process.cwd(),
            cursorType: 'block',
            border: 'line',
            scrollback: 1000,
            style: Style(),
            left: Math.floor(screen.width / 4),
            top: 0,
            width: Math.floor(screen.width / 4) * 3,
            height: screen.height,
            label: cmd
        });
        appendTarget(terminal);
    };

    const box = blessed.box({
        border: 'line',
        left: Math.floor(screen.width / 4),
        top: 0,
        width: Math.floor(screen.width / 4) * 3,
        height: 'shrink',
        shrink: true,
        scrollable: true,
        scrollbar: true,
        style: Style(),
        tags: true
    });
    box.addLine = addLine;

    let once = true;
    const output = () => {
        if (once) {
            appendTarget(box);
            once = false;
        }
        return box;
    };

    return {
        screen,
        dashboard,
        queueReport,
        spawnTerminal,
        output
    };
}
