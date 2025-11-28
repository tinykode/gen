import child_process from 'child_process';
import BaseProvider from './base-provider.js';
import logger from '../logger.js';

const execConfig = {
  encoding: 'utf8',
  timeout: 5000,
  stdio: ['pipe', 'pipe', 'ignore'] // Ignore stderr to suppress MCP errors
};

class GeminiProvider extends BaseProvider {
  constructor() {
    super();
    this.name = 'gemini';
    this.minVersion = '0.1.13';
    this.model = "gemini-2.5-flash-lite"
  }

  async isInstalled() {
    try {
      const output = child_process.execSync('gemini --version', execConfig);
      const versionMatch = output.match(/(\d+\.\d+\.\d+)/);

      if (!versionMatch) {
        throw new Error('Gemini CLI found but version could not be determined');
      }

      const version = versionMatch[1];
      if (this.compareVersions(version, this.minVersion) < 0) {
        throw new Error(`Version ${version} is less than required ${this.minVersion}`);
      }

      return true;
    } catch (error) {
      if (error.status === 127 || error.message.includes('command not found')) {
        return false; // Not installed
      }
      throw error; // Version or other issues
    }
  }

  async isAuthenticated() {
    return true;
  }

  async _generateCommand(query, context = '') {
    const fullPrompt = this.buildPrompt(query, context);

    const command = `gemini -m ${this.model} -p "${fullPrompt}"`;
    logger.debug(`[Provider ${this.name}] Full command: ${command}`);
    try {
      const output = child_process.execSync(command, {
        ...execConfig,
        timeout: 30000
      });

      return this.extractCommand(output);
    } catch (error) {
      throw new Error(`Gemini CLI failed: ${error.message}`);
    }
  }
}

export default GeminiProvider;
