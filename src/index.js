#!/usr/bin/env node
import { parseArgs } from './args.js';
import { GenCLI } from './cli.js';
import logger from './logger.js';

function showHelp() {
  logger.info(`
Gen CLI - Generate bash commands from natural language using AI

Usage: 
  gen "your message here"
  gen "your message here" -p <provider>
  gen provider -list
  gen provider -set <provider>

Options:
  -p, --provider <name>   Use specific provider for this command (gemini, copilot, claude)
  -c, --context <num>     Context from previous commands (future feature)
  -h, --help              Show this help message

Provider Commands:
  provider -list          List all available providers and their status
  provider -set <name>    Set preferred provider (gemini, copilot, claude, auto)

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

main().catch(logger.error);

export default GenCLI;
