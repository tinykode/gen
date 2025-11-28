import logger from "../logger.js";
import os from 'os';
import fs from 'fs';
import path from 'path';

/**
 * Base provider interface
 */
class BaseProvider {
  constructor() {
    this.name = '';
    this.model = 'auto';
    this.minVersion = '';
    this.internal = false;
    this.cacheDir = path.join(os.homedir(), '.tinykode');
    this.cachePath = path.join(this.cacheDir, 'gen-cache.json');
    this.cache = this.loadCache();
  }

  /**
   * Load cache from file
   */
  loadCache() {
    try {
      if (fs.existsSync(this.cachePath)) {
        const content = fs.readFileSync(this.cachePath, 'utf8');
        const data = JSON.parse(content);
        return new Map(Object.entries(data));
      }
    } catch (error) {
      logger.debug(`[Provider] Could not load cache file: ${error.message}`);
    }
    return new Map();
  }

  /**
   * Save cache to file
   */
  saveCache() {
    try {
      // Create directory if it doesn't exist
      fs.mkdirSync(this.cacheDir, { recursive: true });

      // Convert Map to plain object for JSON serialization
      const cacheObject = Object.fromEntries(this.cache);
      fs.writeFileSync(this.cachePath, JSON.stringify(cacheObject, null, 2));
    } catch (error) {
      logger.debug(`[Provider] Could not save cache file: ${error.message}`);
    }
  }

  /**
   * Clear the cache (useful for testing)
   */
  clearCache() {
    this.cache.clear();
    try {
      if (fs.existsSync(this.cachePath)) {
        fs.unlinkSync(this.cachePath);
      }
    } catch (error) {
      logger.debug(`[Provider] Could not delete cache file: ${error.message}`);
    }
  }

  /**
   * Check if provider is installed and meets minimum version
   */
  async isInstalled() {
    throw new Error('isInstalled() must be implemented');
  }

  /**
   * Check if provider is authenticated
   */
  async isAuthenticated() {
    throw new Error('isAuthenticated() must be implemented');
  }

  /**
   * Generate command from natural language (internal implementation)
   */
  async _generateCommand(query, context = '') {
    throw new Error('_generateCommand() must be implemented');
  }

  /**
   * Generate command from natural language with caching
   */
  async generateCommand(query, context = '') {
    const cacheKey = `${this.name}:${this.model}:${query}:${context}`;

    // Check if we have a cached result
    if (this.cache.has(cacheKey)) {
      logger.debug(`[Provider ${this.name}] Cache hit for key: ${cacheKey.substring(0, 50)}...`);
      return this.cache.get(cacheKey);
    }

    logger.debug(`[Provider ${this.name}] Cache miss, generating command...`);

    // Generate new command
    const command = await this._generateCommand(query, context);

    // Store in cache
    this.cache.set(cacheKey, command);
    this.saveCache();

    return command;
  }

  /**
   * Build the prompt for the AI provider
   */
  buildPrompt(query, context = '') {
    const systemPrompt = "You are an expert bash command generator. Generate a precise bash command that accomplishes the user's request. Optimize for compatibility with the System described in the provided context, prefer commonly available tools, and include necessary error handling. Do not include any explanations or additional information. Do not use any tools you don't need to explore for context. IMPORTANT: Return the command wrapped in <command></command> tags with no explanations.";

    return context ?
      `${systemPrompt} Context: ${context}. User query: ${query}` :
      `${systemPrompt} User query: ${query}`;
  }

  /**
   * Extract command from AI provider output
   * Tries multiple parsing strategies in order:
   * 1. <command></command> tags (preferred)
   * 2. Code blocks (```bash, ```sh, etc.)
   * 3. Raw trimmed output
   */
  extractCommand(output) {
    logger.debug(`[Provider ${this.name}] Extracting command from output: ${output}`);
    // First, try to extract from <command></command> tags
    const match = output.match(/<command>(.*?)<\/command>/s);
    if (match) {
      return match[1].trim();
    }

    // If no tags, look for code blocks
    const codeBlockMatch = output.match(/```(?:bash|zsh|sh)?\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // Last resort: return trimmed output
    return output.trim();
  }

  /**
   * Compare two semantic version strings
   * @returns 1 if a > b, -1 if a < b, 0 if equal
   */
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

  /**
   * Get status of provider (installed, authenticated, etc.)
   */
  async getStatus() {
    try {
      const installed = await this.isInstalled();
      if (!installed) {
        logger.debug(`[Provider ${this.name}] Not installed`);
        return { status: 'not_installed', provider: this.name };
      }

      const authenticated = await this.isAuthenticated();
      logger.debug(`[Provider ${this.name}] Authenticated: ${authenticated}`);
      return {
        status: authenticated ? 'ready' : 'not_authenticated',
        provider: this.name
      };
    } catch (error) {
      logger.error(`[Provider ${this.name}] Error getting status: ${error.message}`);
      return { status: 'error', provider: this.name, message: error.message };
    }
  }
}

export default BaseProvider;
