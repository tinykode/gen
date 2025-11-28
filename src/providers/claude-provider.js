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

  async generateCommand(query, context = '') {
    const systemPrompt = "You are an expert bash command generator. Generate a precise bash command that accomplishes the user's request. Optimize for compatibility with the System described in the provided context, prefer commonly available tools, and include necessary error handling. Do not include any explanations or additional information. Do not use any tools you don't need to explore for context. IMPORTANT: Return the command wrapped in <command></command> tags with no explanations.";

    const fullPrompt = context ?
      `${systemPrompt} Context: ${context}. User query: ${query}` :
      `${systemPrompt} User query: ${query}`;

    try {
      // Escape double quotes in the prompt to avoid shell issues
      const escapedPrompt = fullPrompt.replace(/"/g, '\\"');

      const output = child_process.execSync(`claude -p --model "${this.model}" "${escapedPrompt}"`, execConfig);

      return this.extractCommand(output);
    } catch (error) {
      throw new Error(`Claude failed: ${error.message}`);
    }
  }

  extractCommand(output) {
    // First, try to extract from <command></command> tags
    const match = output.match(/<command>(.*?)<\/command>/s);
    if (match) {
      return match[1].trim();
    }

    // If no tags, assume the whole output is the command (or try to clean it up)
    // Based on the prompt "Generate a precise bash command...", it might just return the command.
    // But let's be safe and look for code blocks if present, otherwise return trimmed output.

    const codeBlockMatch = output.match(/```(?:bash|zsh|sh)?\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    return output.trim();
  }
}

export default ClaudeProvider;
