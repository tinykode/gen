import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import child_process from 'child_process';
import GHProvider from '../../src/providers/gh-provider.js';

describe('GHProvider', () => {
    let execSyncMock;

    beforeEach((t) => {
        execSyncMock = t.mock.method(child_process, 'execSync');
    });

    test('isInstalled should return true for valid version', async () => {
        execSyncMock.mock.mockImplementation(() => 'gh version 2.5.0');
        const provider = new GHProvider();
        const result = await provider.isInstalled();
        assert.strictEqual(result, true);
    });

    test('isInstalled should return false if command not found', async () => {
        execSyncMock.mock.mockImplementation(() => {
            const err = new Error('command not found');
            err.status = 127;
            throw err;
        });
        const provider = new GHProvider();
        const result = await provider.isInstalled();
        assert.strictEqual(result, false);
    });

    test('isAuthenticated should return true if logged in', async () => {
        execSyncMock.mock.mockImplementation(() => 'Logged in to github.com');
        const provider = new GHProvider();
        const result = await provider.isAuthenticated();
        assert.strictEqual(result, true);
    });

    test('generateCommand should extract command from tags', async () => {
        execSyncMock.mock.mockImplementation(() => '<command>ls -la</command>');
        const provider = new GHProvider();
        const command = await provider.generateCommand('list files');
        assert.strictEqual(command, 'ls -la');
    });

    test('generateCommand should extract command from suggestion', async () => {
        execSyncMock.mock.mockImplementation(() => 'Suggestion:\nls -la');
        const provider = new GHProvider();
        const command = await provider.generateCommand('list files');
        assert.strictEqual(command, 'ls -la');
    });
});
