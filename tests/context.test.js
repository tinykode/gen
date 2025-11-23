const test = require('node:test');
const assert = require('node:assert');
const os = require('os');
const path = require('path');
const Context = require('../src/context');

test('Context class', async (t) => {
    const context = new Context();

    await t.test('getOS returns valid OS information', () => {
        const osInfo = context.getOS();
        assert.strictEqual(osInfo.platform, os.platform());
        assert.strictEqual(osInfo.release, os.release());
        assert.strictEqual(osInfo.type, os.type());
        assert.strictEqual(osInfo.arch, os.arch());
    });

    await t.test('getShell returns a string', () => {
        const shell = context.getShell();
        assert.strictEqual(typeof shell, 'string');
        assert.ok(shell.length > 0);
    });

    await t.test('getCWD returns current working directory', () => {
        const cwd = context.getCWD();
        assert.strictEqual(cwd, process.cwd());
    });

    await t.test('getDirectoryContent returns array of files', () => {
        const content = context.getDirectoryContent();
        assert.ok(Array.isArray(content));
        // We expect at least package.json to be present in the root if we run from root
        // But tests are usually run from root. Let's check if we can find package.json if we are in root.
        // Or just check structure.
        if (content.length > 0) {
            assert.ok(content[0].name);
            assert.ok(content[0].type);
        }
    });

    await t.test('gather returns all information', () => {
        const gathered = context.gather();
        assert.deepStrictEqual(gathered.os, context.getOS());
        assert.strictEqual(gathered.shell, context.getShell());
        assert.strictEqual(gathered.cwd, context.getCWD());
        assert.deepStrictEqual(gathered.directoryContent, context.getDirectoryContent());
    });
});
