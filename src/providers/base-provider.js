/**
 * Base provider interface
 */
class BaseProvider {
  constructor() {
    this.name = '';
    this.minVersion = '';
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
   * Generate command from natural language
   */
  async generateCommand(query, context = '') {
    throw new Error('generateCommand() must be implemented');
  }

  /**
   * Get status of provider (installed, authenticated, etc.)
   */
  async getStatus() {
    try {
      const installed = await this.isInstalled();
      if (!installed) {
        return { status: 'not_installed', provider: this.name };
      }

      const authenticated = await this.isAuthenticated();
      return {
        status: authenticated ? 'ready' : 'not_authenticated',
        provider: this.name
      };
    } catch (error) {
      return { status: 'error', provider: this.name, message: error.message };
    }
  }
}

export default BaseProvider;
