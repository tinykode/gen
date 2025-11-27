import GHProvider from './providers/gh-provider.js';
import GeminiProvider from './providers/gemini-provider.js';
import CopilotProvider from './providers/copilot-provider.js';
import ClaudeProvider from './providers/claude-provider.js';
import Config from './config.js';
import Installer from './installer.js';
import logger from './logger.js';
import Context from './context.js';

class GenCLI {
  constructor() {
    this.config = new Config();
    this.context = new Context();
    this.installer = new Installer();
    this.providers = [
      new GHProvider(),
      new GeminiProvider(),
      new CopilotProvider(),
      new ClaudeProvider()
    ];
  }

  configure() {
    this.installer.install().catch(err => {
      logger.error('Failed to configure Gen:', err);
    });
  }

  async findAvailableProvider() {
    const preferredProvider = this.config.getProvider();

    // If user has set a preference, try that first
    if (preferredProvider) {
      const provider = this.providers.find(p => p.name === preferredProvider);
      if (provider) {
        const status = await provider.getStatus();
        if (status.status === 'ready') {
          return provider;
        } else {
          throw new Error(`Preferred provider '${preferredProvider}' is ${status.status}`);
        }
      }
    }

    // Auto-detect first available provider
    for (const provider of this.providers) {
      const status = await provider.getStatus();
      if (status.status === 'ready') {
        return provider;
      }
    }

    throw new Error(`No available providers found. Please install and authenticate any of the following:\n- ${this.providers.filter(p => !p.internal).map(p => p.name).join('\n- ')}`);
  }

  async findSpecificProvider(providerName) {
    const provider = this.providers.find(p => p.name === providerName);
    if (!provider) {
      throw new Error(`Provider '${providerName}' not found. Available: ${this.providers.filter(p => !p.internal).map(p => p.name).join(', ')}`);
    }

    const status = await provider.getStatus();
    if (status.status !== 'ready') {
      throw new Error(`Provider '${providerName}' is ${status.status}${status.message ? ': ' + status.message : ''}`);
    }

    return provider;
  }

  async generateCommand(query, userContext = '', oneTimeProvider = null) {
    const provider = oneTimeProvider ?
      await this.findSpecificProvider(oneTimeProvider) :
      await this.findAvailableProvider();

    const systemContext = this.context.gather();
    const contextString = `OS: ${systemContext.os.platform} ${systemContext.os.release}, Shell: ${systemContext.shell}, CWD: ${systemContext.cwd}, Files: ${JSON.stringify(systemContext.directoryContent.map(f => f.name))}`;
    const fullContext = userContext ? `${userContext}. System Info: ${contextString}` : `System Info: ${contextString}`;

    return await provider.generateCommand(query, fullContext);
  }

  async listProviders() {
    logger.info('Available providers:');

    for (const provider of this.providers) {
      if (provider.internal) continue;
      const status = await provider.getStatus();
      const current = this.config.getProvider() === provider.name ? ' (current)' : '';
      const statusIcon = status.status === 'ready' ? '✅' :
        status.status === 'not_authenticated' ? '⚠️' : '❌';

      const statusText = status.status === 'error' && status.message ?
        `${status.status} (${status.message})` : status.status;

      logger.info(`  ${statusIcon} ${provider.name}${current} - ${statusText}`);
    }

    if (!this.config.getProvider()) {
      logger.info('\nNo provider set (auto-detect mode)');
    }
  }

  setProvider(providerName) {
    const validProviders = this.providers.map(p => p.name);

    if (providerName === 'auto') {
      this.config.setProvider(null);
      logger.info('Provider set to auto-detect');
      return;
    }

    if (!validProviders.includes(providerName)) {
      throw new Error(`Invalid provider '${providerName}'. Available: ${validProviders.filter(p => p !== 'gh').join(', ')}, auto`);
    }

    this.config.setProvider(providerName);
    logger.info(`Provider set to: ${providerName}`);
  }
}

export {
  GenCLI
} 
