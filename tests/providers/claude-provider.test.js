import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import child_process from 'child_process';
import ClaudeProvider from '../../src/providers/claude-provider.js';

describe('ClaudeProvider', () => {
  let execSyncMock;

  beforeEach((t) => {
    execSyncMock = t.mock.method(child_process, 'execSync');
  });

  test('isInstalled should return true if command exists', async () => {
    execSyncMock.mock.mockImplementation(() => '');
    const provider = new ClaudeProvider();
    const result = await provider.isInstalled();
    assert.strictEqual(result, true);
  });

  test('isInstalled should return false if command fails', async () => {
    execSyncMock.mock.mockImplementation(() => { throw new Error('Command failed'); });
    const provider = new ClaudeProvider();
    const result = await provider.isInstalled();
    assert.strictEqual(result, false);
  });

  test('generateCommand should extract command from tags', async () => {
    execSyncMock.mock.mockImplementation(() => '<command>ls -la</command>');
    const provider = new ClaudeProvider();
    const command = await provider.generateCommand('list files');
    assert.strictEqual(command, 'ls -la');
  });

  test('generateCommand should extract command from code block', async () => {
    execSyncMock.mock.mockImplementation(() => 'Here is the command:\n```bash\nls -la\n```');
    const provider = new ClaudeProvider();
    const command = await provider.generateCommand('list files');
    assert.strictEqual(command, 'ls -la');
  });

  test('generateCommand should return raw output if no tags or blocks', async () => {
    execSyncMock.mock.mockImplementation(() => 'ls -la');
    const provider = new ClaudeProvider();
    const command = await provider.generateCommand('list files');
    assert.strictEqual(command, 'ls -la');
  });
});
