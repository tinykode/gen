const { execSync } = require('child_process');
const BaseProvider = require('./base-provider');

const execConfig = {
  encoding: 'utf8',
  timeout: 5000,
  stdio: ['pipe', 'pipe', 'ignore'] // Ignore stderr to suppress MCP errors
};

class GHProvider extends BaseProvider {
  constructor() {
    super();
    this.name = 'gh';
    this.minVersion = '2.0.0';
  }

  async isInstalled() {
    try {
      const output = execSync('gh --version', execConfig);
      const versionMatch = output.match(/gh version (\d+\.\d+\.\d+)/);

      if (!versionMatch) {
        throw new Error('GitHub CLI found but version could not be determined');
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
      const output = execSync('gh auth status', execConfig);
      return output.includes('Logged in to github.com');
    } catch (error) {
      return false;
    }
  }

  async generateCommand(query, context = '') {
    const systemPrompt = "You are an expert bash command generator for zsh on macOS. Generate a precise bash command that accomplishes the user's request. Use zsh-specific syntax when relevant, optimize for macOS compatibility, prefer commonly available tools, and include necessary error handling. Do not include any explanations or additional information. Do not use any tools you don't need to explore for context. IMPORTANT: Return the command wrapped in <command></command> tags with no explanations.";

    const fullPrompt = context ?
      `${systemPrompt} Context: ${context}. User query: ${query}` :
      `${systemPrompt} User query: ${query}`;

    try {
      // Send "exit" to exit quickly without polluting clipboard
      const output = execSync(`echo "exit" | gh copilot suggest -t shell "${fullPrompt}"`, {
        ...execConfig,
        timeout: 30000,
      });

      return this.extractCommand(output);
    } catch (error) {
      throw new Error(`GitHub Copilot failed: ${error.message}`);
    }
  }

  extractCommand(output) {
    // First, try to extract from <command></command> tags (preferred)
    const match = output.match(/<command>(.*?)<\/command>/s);
    if (match) {
      return match[1].trim();
    }

    // Fallback: GitHub Copilot shows "Suggestion:" followed by the command
    const suggestionMatch = output.match(/Suggestion:\s*\n\s*(.*?)(?:\n|$)/);
    if (suggestionMatch) {
      return suggestionMatch[1].trim();
    }

    // Last resort: look for commands in the output
    const lines = output.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip empty lines, headers, and interface elements
      if (trimmed &&
        !trimmed.includes('Welcome to GitHub Copilot') &&
        !trimmed.includes('version') &&
        !trimmed.includes('Suggestion:') &&
        !trimmed.includes('Select an option') &&
        !trimmed.includes('Use arrows') &&
        !trimmed.includes('Copy command') &&
        !trimmed.includes('Explain command') &&
        !trimmed.includes('Execute command') &&
        !trimmed.includes('Revise command') &&
        !trimmed.includes('Rate response') &&
        !trimmed.includes('Exit') &&
        !trimmed.startsWith('>') &&
        !trimmed.startsWith('?') &&
        trimmed.length > 1) {
        return trimmed;
      }
    }

    throw new Error('Could not extract command from GitHub Copilot response');
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

module.exports = GHProvider;
