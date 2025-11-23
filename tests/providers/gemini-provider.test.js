import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import child_process from 'child_process';
import GeminiProvider from '../../src/providers/gemini-provider.js';

describe('GeminiProvider', () => {
    let execSyncMock;

    beforeEach((t) => {
        execSyncMock = t.mock.method(child_process, 'execSync');
    });

    test('isInstalled should return true for valid version', async () => {
        execSyncMock.mock.mockImplementation(() => 'gemini version 1.0.0');
        const provider = new GeminiProvider();
        const result = await provider.isInstalled();
        assert.strictEqual(result, true);
    });

    test('isInstalled should return false if command not found', async () => {
        execSyncMock.mock.mockImplementation(() => {
            const err = new Error('command not found');
            err.status = 127;
            throw err;
        });
        const provider = new GeminiProvider();
        const result = await provider.isInstalled();
        assert.strictEqual(result, false);
    });

    test('isInstalled should throw error for old version', async () => {
        execSyncMock.mock.mockImplementation(() => 'gemini version 0.0.1');
        const provider = new GeminiProvider();
        await assert.rejects(async () => await provider.isInstalled(), /Version 0.0.1 is less than required/);
    });

    test('isAuthenticated should return true if credentials loaded', async () => {
        execSyncMock.mock.mockImplementation(() => 'Loaded cached credentials.');
        const provider = new GeminiProvider();
        const result = await provider.isAuthenticated();
        assert.strictEqual(result, true);
    });

    test('generateCommand should extract command from tags', async () => {
        execSyncMock.mock.mockImplementation(() => '<command>ls -la</command>');
        const provider = new GeminiProvider();
        const command = await provider.generateCommand('list files');
        assert.strictEqual(command, 'ls -la');
    });
});
