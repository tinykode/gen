import child_process from 'child_process';
import BaseProvider from './base-provider.js';

const execConfig = {
  encoding: 'utf8',
  timeout: 10000,
  stdio: ['pipe', 'pipe', 'ignore']
};

class ClaudeProvider extends BaseProvider {
  constructor() {
    super();
    this.name = 'claude';
    this.model = 'haiku';
  }

  async isInstalled() {
    try {
      // Check if claude command exists
      child_process.execSync('which claude', execConfig);
      return true;
    } catch (error) {
      return false;
    }
  }

  async isAuthenticated() {
    // Assuming if it's installed, it's ready to use or handles its own auth
    return true;
  }

  async _generateCommand(query, context = '') {
    const fullPrompt = this.buildPrompt(query, context);

    try {
      // Escape double quotes in the prompt to avoid shell issues
      const escapedPrompt = fullPrompt.replace(/"/g, '\\"');

      const output = child_process.execSync(`claude -p --model "${this.model}" "${escapedPrompt}"`, execConfig);

      return this.extractCommand(output);
    } catch (error) {
      throw new Error(`Claude failed: ${error.message}`);
    }
  }
}

export default ClaudeProvider;
