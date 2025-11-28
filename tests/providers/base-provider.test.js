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
      message: '_generateCommand() must be implemented'
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

  test('generateCommand should cache results for same query', async () => {
    let callCount = 0;
    class TestProvider extends BaseProvider {
      async isInstalled() { return true; }
      async isAuthenticated() { return true; }
      async _generateCommand(query, context) {
        callCount++;
        return `echo "${query}"`;
      }
    }

    const provider = new TestProvider();
    provider.clearCache(); // Clear any cached values
    const uniqueQuery = `test-cache-query-${Date.now()}`;
    const result1 = await provider.generateCommand(uniqueQuery);
    const result2 = await provider.generateCommand(uniqueQuery);

    assert.strictEqual(result1, result2);
    assert.strictEqual(callCount, 1, 'Should only call _generateCommand once for same query');
  });

  test('generateCommand should cache results per query+context combination', async () => {
    let callCount = 0;
    class TestProvider extends BaseProvider {
      async isInstalled() { return true; }
      async isAuthenticated() { return true; }
      async _generateCommand(query, context) {
        callCount++;
        return `echo "${query}" with context "${context}"`;
      }
    }

    const provider = new TestProvider();
    provider.clearCache(); // Clear any cached values
    const uniqueQuery = `test-context-query-${Date.now()}`;
    const result1 = await provider.generateCommand(uniqueQuery, 'ctx1');
    const result2 = await provider.generateCommand(uniqueQuery, 'ctx2');
    const result3 = await provider.generateCommand(uniqueQuery, 'ctx1'); // Should hit cache

    assert.notStrictEqual(result1, result2, 'Different contexts should produce different results');
    assert.strictEqual(result1, result3, 'Same query+context should return cached result');
    assert.strictEqual(callCount, 2, 'Should call _generateCommand twice for different contexts');
  });

  test('cache should store different results for different queries', async () => {
    class TestProvider extends BaseProvider {
      async isInstalled() { return true; }
      async isAuthenticated() { return true; }
      async _generateCommand(query, context) {
        return `echo "${query}"`;
      }
    }

    const provider = new TestProvider();
    provider.clearCache(); // Clear any cached values
    const timestamp = Date.now();
    const result1 = await provider.generateCommand(`query1-${timestamp}`);
    const result2 = await provider.generateCommand(`query2-${timestamp}`);
    const cachedResult1 = await provider.generateCommand(`query1-${timestamp}`);

    assert.notStrictEqual(result1, result2);
    assert.strictEqual(result1, cachedResult1);
  });
});
