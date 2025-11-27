import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import os from 'os';
import Installer from '../src/installer.js';
import logger from '../src/logger.js';

describe('Installer', () => {
	let tempDir;
	let zshrcPath;
	let originalHomedir;

	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-installer-test-'));
		zshrcPath = path.join(tempDir, '.zshrc');

		originalHomedir = os.homedir;
		os.homedir = () => tempDir;

		// Create dummy .zshrc
		fs.writeFileSync(zshrcPath, '# existing zshrc content\n');
	});

	afterEach(() => {
		// Cleanup
		if (fs.existsSync(zshrcPath)) {
			fs.unlinkSync(zshrcPath);
		}
		os.homedir = originalHomedir;
	});

	test('should detect if zshrc does not exist', (t) => {
		fs.unlinkSync(zshrcPath);
		const installer = new Installer();

		const loggerError = t.mock.method(logger, 'error');

		installer.install();

		const calls = loggerError.mock.calls.map(c => c.arguments[0]);
		assert.ok(calls.some(msg => msg && msg.includes('No .zshrc file found')), 'Should log error message');
	});

	test('should detect if already installed', (t) => {
		const installer = new Installer();
		const sourceBlock = installer.getImportScriptsContent(installer.functionsFile);
		fs.appendFileSync(zshrcPath, sourceBlock);

		const loggerInfo = t.mock.method(logger, 'info');

		installer.install();

		const calls = loggerInfo.mock.calls.map(c => c.arguments[0]);
		assert.ok(calls.some(msg => msg && msg.includes('Gen already configured')), 'Should log already configured message');
	});

	test('should install zsh functions', (t) => {
		const installer = new Installer();
		installer.installZshFunctions();

		const content = fs.readFileSync(zshrcPath, 'utf8');
		assert.ok(content.includes('# tinykode_GEN_START'));
		assert.ok(content.includes(installer.functionsFile));
	});
});
