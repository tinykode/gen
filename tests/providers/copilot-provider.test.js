const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const child_process = require('child_process');
const CopilotProvider = require('../../src/providers/copilot-provider');

describe('CopilotProvider', () => {
    let execSyncMock;

    beforeEach((t) => {
        execSyncMock = t.mock.method(child_process, 'execSync');
    });

    test('isInstalled should return true if command exists', async () => {
        execSyncMock.mock.mockImplementation(() => '');
        const provider = new CopilotProvider();
        const result = await provider.isInstalled();
        assert.strictEqual(result, true);
    });

    test('isInstalled should return false if command fails', async () => {
        execSyncMock.mock.mockImplementation(() => { throw new Error('Command failed'); });
        const provider = new CopilotProvider();
        const result = await provider.isInstalled();
        assert.strictEqual(result, false);
    });

    test('generateCommand should extract command from tags', async () => {
        execSyncMock.mock.mockImplementation(() => '<command>ls -la</command>');
        const provider = new CopilotProvider();
        const command = await provider.generateCommand('list files');
        assert.strictEqual(command, 'ls -la');
    });

    test('generateCommand should extract command from code block', async () => {
        execSyncMock.mock.mockImplementation(() => 'Here is the command:\n```bash\nls -la\n```');
        const provider = new CopilotProvider();
        const command = await provider.generateCommand('list files');
        assert.strictEqual(command, 'ls -la');
    });

    test('generateCommand should return raw output if no tags or blocks', async () => {
        execSyncMock.mock.mockImplementation(() => 'ls -la');
        const provider = new CopilotProvider();
        const command = await provider.generateCommand('list files');
        assert.strictEqual(command, 'ls -la');
    });
});
