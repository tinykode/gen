import { test, describe } from 'node:test';
import assert from 'node:assert';
import BaseProvider from '../../src/providers/base-provider.js';

describe('BaseProvider', () => {
  test('should throw error for unimplemented methods', async () => {
    const provider = new BaseProvider();

    await assert.rejects(async () => await provider.isInstalled(), {
      message: 'isInstalled() must be implemented'
    });

    await assert.rejects(async () => await provider.isAuthenticated(), {
      message: 'isAuthenticated() must be implemented'
    });

    await assert.rejects(async () => await provider.generateCommand('test'), {
      message: 'generateCommand() must be implemented'
    });
  });

  test('getStatus should return not_installed if isInstalled returns false', async () => {
    class TestProvider extends BaseProvider {
      async isInstalled() { return false; }
    }
    const provider = new TestProvider();
    const status = await provider.getStatus();
    assert.strictEqual(status.status, 'not_installed');
  });

  test('getStatus should return not_authenticated if isAuthenticated returns false', async () => {
    class TestProvider extends BaseProvider {
      async isInstalled() { return true; }
      async isAuthenticated() { return false; }
    }
    const provider = new TestProvider();
    const status = await provider.getStatus();
    assert.strictEqual(status.status, 'not_authenticated');
  });

  test('getStatus should return ready if authenticated', async () => {
    class TestProvider extends BaseProvider {
      async isInstalled() { return true; }
      async isAuthenticated() { return true; }
    }
    const provider = new TestProvider();
    const status = await provider.getStatus();
    assert.strictEqual(status.status, 'ready');
  });
});
