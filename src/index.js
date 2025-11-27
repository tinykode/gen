#!/usr/bin/env node
import { fileURLToPath } from 'url';
import GHProvider from './providers/gh-provider.js';
import GeminiProvider from './providers/gemini-provider.js';
import CopilotProvider from './providers/copilot-provider.js';
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
      new CopilotProvider()
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

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    message: '',
    context: '', // For future context implementation
    help: false,
    provider: null,
    oneTimeProvider: null, // For -p option
    listProviders: false,
    setProvider: null,
    configure: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '-c':
      case '--context':
        // Placeholder for future context implementation
        options.context = next;
        i++;
        break;
      case '-p':
      case '--provider':
        options.oneTimeProvider = next;
        i++;
        break;
      case '-h':
      case '--help':
        options.help = true;
        break;
      case 'provider':
        if (next === '-list' || next === '--list') {
          options.listProviders = true;
          i++;
        } else if (next === '-set' || next === '--set') {
          options.setProvider = args[i + 2];
          i += 2;
        }
        break;
      case "configure":
        options.configure = true;
        break;
      default:
        // If it starts with -, it's an unknown flag
        if (arg.startsWith('-')) {
          logger.warn(`Warning: Unknown option '${arg}'`);
        } else if (!options.message && !options.configure && !options.listProviders && !options.setProvider) {
          // Treat first non-flag argument as message if not already set
          // and not a subcommand
          options.message = arg;
        }
    }
  }

  return options;
}

function showHelp() {
  logger.info(`
Gen CLI - Generate bash commands from natural language using AI

Usage: 
  gen "your message here"
  gen "your message here" -p <provider>
  gen provider -list
  gen provider -set <provider>

Options:
  -p, --provider <name>   Use specific provider for this command (gemini, copilot)
  -c, --context <num>     Context from previous commands (future feature)
  -h, --help              Show this help message

Provider Commands:
  provider -list          List all available providers and their status
  provider -set <name>    Set preferred provider (gemini, copilot, auto)

Examples:
  gen "List all directories in current folder"
  gen "Find files larger than 100MB" -p gemini
  gen provider -list
  gen provider -set copilot
`);
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  const cli = new GenCLI();

  try {
    if (options.configure) {
      cli.configure();
      return;
    }

    if (options.listProviders) {
      await cli.listProviders();
      return;
    }

    if (options.setProvider) {
      cli.setProvider(options.setProvider);
      return;
    }

    // should be last
    if (!options.message) {
      showHelp();
      process.exit(1);
    }

    const command = await cli.generateCommand(options.message, options.context, options.oneTimeProvider);
    logger.info(command);

  } catch (error) {
    logger.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(logger.error);
}

export default GenCLI;
