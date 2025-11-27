import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import os from 'os';
import Config from '../src/config.js';

describe('Config', () => {
  let tempDir;
  let configPath;
  let originalHomedir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-'));
    configPath = path.join(tempDir, '.tinykode/gen-config');

    originalHomedir = os.homedir;
    os.homedir = () => tempDir;
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    if (fs.existsSync(path.dirname(configPath))) {
      fs.rmdirSync(path.dirname(configPath));
    }
    os.homedir = originalHomedir;
  });

  test('should load default config if file does not exist', () => {
    const config = new Config();
    assert.deepStrictEqual(config.getProvider(), null);
  });

  test('should save and load config', () => {
    const config = new Config();
    config.setProvider('gemini');

    // Verify it was saved to file
    const fileContent = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.strictEqual(fileContent.provider, 'gemini');

    // Verify it loads correctly
    const newConfig = new Config();
    assert.strictEqual(newConfig.getProvider(), 'gemini');
  });

  test('should list providers', () => {
    const config = new Config();
    const providers = config.listProviders();
    assert.ok(providers.includes('gh'));
    assert.ok(providers.includes('gemini'));
  });
});
