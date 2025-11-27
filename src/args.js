import logger from './logger.js';

export function parseArgs() {
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