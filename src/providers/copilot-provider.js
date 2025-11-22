const { execSync } = require('child_process');
const BaseProvider = require('./base-provider');

const execConfig = {
    encoding: 'utf8',
    timeout: 10000,
    stdio: ['pipe', 'pipe', 'ignore']
};

class CopilotProvider extends BaseProvider {
    constructor() {
        super();
        this.name = 'copilot';
    }

    async isInstalled() {
        try {
            // Check if copilot command exists
            execSync('which copilot', execConfig);
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
        const systemPrompt = "You are an expert bash command generator for zsh on macOS. Generate a precise bash command that accomplishes the user's request. Use zsh-specific syntax when relevant, optimize for macOS compatibility, prefer commonly available tools, and include necessary error handling. Do not include any explanations or additional information. Do not use any tools you don't need to explore for context. IMPORTANT: Return the command wrapped in <command></command> tags with no explanations.";

        const fullPrompt = context ?
            `${systemPrompt} Context: ${context}. User query: ${query}` :
            `${systemPrompt} User query: ${query}`;

        try {
            // Escape double quotes in the prompt to avoid shell issues
            const escapedPrompt = fullPrompt.replace(/"/g, '\\"');

            const output = execSync(`copilot -p "${escapedPrompt}"`, execConfig);

            return this.extractCommand(output);
        } catch (error) {
            throw new Error(`Copilot failed: ${error.message}`);
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

module.exports = CopilotProvider;
