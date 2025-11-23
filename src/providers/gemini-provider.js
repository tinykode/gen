const { execSync } = require('child_process');
const BaseProvider = require('./base-provider');

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
  }

  async isInstalled() {
    try {
      const output = execSync('gemini --version', execConfig);
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
    try {
      const output = execSync('gemini -p hi', {
        ...execConfig,
        timeout: 10000
      });
      return output.includes('Loaded cached credentials.');
    } catch (error) {
      return false;
    }
  }

  async generateCommand(query, context = '') {
    const systemPrompt = "You are an expert bash command generator for zsh on macOS. Generate a precise bash command that accomplishes the user's request. Use zsh-specific syntax when relevant, optimize for macOS compatibility, prefer commonly available tools, and include necessary error handling. IMPORTANT: Return the command wrapped in <command></command> tags with no explanations.";

    const fullPrompt = context ?
      `${systemPrompt}; Context: ${context}; User query: ${query}` :
      `${systemPrompt}; User query: ${query}`;

    try {
      const output = execSync(`gemini -p "${fullPrompt}"`, {
        ...execConfig,
        timeout: 30000
      });

      return this.extractCommand(output);
    } catch (error) {
      throw new Error(`Gemini CLI failed: ${error.message}`);
    }
  }

  extractCommand(output) {
    const match = output.match(/<command>(.*?)<\/command>/s);
    if (match) {
      return match[1].trim();
    }

    throw new Error('Could not extract command from Gemini response');
  }

  compareVersions(a, b) {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;

      if (aPart > bPart) return 1;
      if (aPart < bPart) return -1;
    }

    return 0;
  }
}

module.exports = GeminiProvider;
