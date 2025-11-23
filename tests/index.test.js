import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import GenCLI from '../src/index.js';

describe('GenCLI', () => {
    test('should initialize with default providers', () => {
        const cli = new GenCLI();
        assert.strictEqual(cli.providers.length, 3);
        assert.strictEqual(cli.providers[0].name, 'gh');
        assert.strictEqual(cli.providers[1].name, 'gemini');
        assert.strictEqual(cli.providers[2].name, 'copilot');
    });

    test('findAvailableProvider should return preferred provider if ready', async () => {
        const cli = new GenCLI();

        // Mock config
        cli.config = {
            getProvider: () => 'gemini'
        };

        // Mock providers
        cli.providers = [
            { name: 'gh', getStatus: async () => ({ status: 'ready' }) },
            { name: 'gemini', getStatus: async () => ({ status: 'ready' }) }
        ];

        const provider = await cli.findAvailableProvider();
        assert.strictEqual(provider.name, 'gemini');
    });

    test('findAvailableProvider should throw if preferred provider not ready', async () => {
        const cli = new GenCLI();

        cli.config = {
            getProvider: () => 'gemini'
        };

        cli.providers = [
            { name: 'gemini', getStatus: async () => ({ status: 'not_authenticated' }) }
        ];

        await assert.rejects(async () => await cli.findAvailableProvider(), {
            message: "Preferred provider 'gemini' is not_authenticated"
        });
    });

    test('findAvailableProvider should auto-detect first ready provider', async () => {
        const cli = new GenCLI();

        cli.config = {
            getProvider: () => null
        };

        cli.providers = [
            { name: 'gh', getStatus: async () => ({ status: 'not_installed' }) },
            { name: 'gemini', getStatus: async () => ({ status: 'ready' }) }
        ];

        const provider = await cli.findAvailableProvider();
        assert.strictEqual(provider.name, 'gemini');
    });

    test('findSpecificProvider should return requested provider if ready', async () => {
        const cli = new GenCLI();

        cli.providers = [
            { name: 'gemini', getStatus: async () => ({ status: 'ready' }) }
        ];

        const provider = await cli.findSpecificProvider('gemini');
        assert.strictEqual(provider.name, 'gemini');
    });

    test('findSpecificProvider should throw if provider not found', async () => {
        const cli = new GenCLI();
        cli.providers = [];

        await assert.rejects(async () => await cli.findSpecificProvider('unknown'), /Provider 'unknown' not found/);
    });

    test('setProvider should update config', (t) => {
        const cli = new GenCLI();
        const setProviderMock = t.mock.fn();

        cli.config = {
            setProvider: setProviderMock
        };

        const consoleLog = t.mock.method(console, 'log');

        cli.setProvider('gemini');

        assert.strictEqual(setProviderMock.mock.calls.length, 1);
        assert.strictEqual(setProviderMock.mock.calls[0].arguments[0], 'gemini');
    });
});
