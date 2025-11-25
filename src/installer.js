#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Installer {
  constructor() {
    this.homeDir = os.homedir();
    this.zshrcPath = path.join(this.homeDir, '.zshrc');
    this.packageDir = __dirname;
    this.functionsFile = path.join(this.packageDir, '..', 'zshrc_functions.zsh');
  }

  getImportScriptsContent(globalFunctionsPath) {
    return `# Gen - Auto-generated
if [ -f "${globalFunctionsPath}" ]; then
    source "${globalFunctionsPath}"
else
    echo "⚠️  Gen functions not found at ${globalFunctionsPath}"
fi`;
  }

  async install() {
    logger.info('🚀 Welcome to Gen!');
    logger.info('');
    logger.info('This tool generates bash commands from natural language using:');
    logger.info('  • GitHub Copilot CLI (gh copilot)');
    logger.info('  • Gemini CLI (gemini)');
    logger.info('  • Future: Claude CLI and others');
    logger.info('');
    logger.info('⚠️  WARNING: This tool is for experienced developers only!');
    logger.info('   Commands are generated ready-to-execute. Know what you\'re doing.');
    logger.info('');

    // Check if .zshrc exists
    if (!fs.existsSync(this.zshrcPath)) {
      logger.error('❌ No .zshrc file found. This tool requires zsh.');
      logger.error('   Please install zsh and create a .zshrc file first.');
      return;
    }

    // Check if already installed
    const zshrcContent = fs.readFileSync(this.zshrcPath, 'utf8');
    if (zshrcContent.includes(this.getImportScriptsContent(this.functionsFile))) {
      logger.info('✅ Gen already configured in .zshrc');
      logger.info('');
      this.showUsage();
      return;
    }

    // Prompt user
    const shouldInstall = await this.promptUser();
    if (shouldInstall) {
      this.installZshFunctions();
      this.showUsage();
    } else {
      logger.info('');
      logger.info('⏭️  Skipped zsh integration.');
      logger.info('   You can manually add the functions from:');
      logger.info(`   ${this.functionsFile}`);
      logger.info('');
      logger.info('   Or run: npm run configure');
    }
  }

  async promptUser() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      logger.info('📝 To use the `gen` command, we need to add a source line to your .zshrc');
      logger.info('   This will load the gen functions from the global package installation.');
      logger.info('');
      rl.question(`❓ Add gen source to ${this.zshrcPath} (Y/n): `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes' || answer.trim() === '');
      });
    });
  }

  installZshFunctions() {
    try {
      // Create the source line for .zshrc
      const sourceBlock = this.getImportScriptsContent(this.functionsFile);
      const zshrcContent = fs.readFileSync(this.zshrcPath, 'utf8');

      // if tinykode_GEN tags are in file replaced the content inside with the source block
      if (zshrcContent.includes('# tinykode_GEN_START')) {
        const updatedZshrcContent = zshrcContent.replace(/# tinykode_GEN_START[\s\S]*?# tinykode_GEN_END/, `# tinykode_GEN_START\n${sourceBlock}\n# tinykode_GEN_END`);
        fs.writeFileSync(this.zshrcPath, updatedZshrcContent);
      } else {
        // if not, appended to the file
        fs.appendFileSync(this.zshrcPath, `\n# tinykode_GEN_START\n${sourceBlock}\n# tinykode_GEN_END`);
      }

      logger.info('');
      logger.info('✅ Successfully added gen source to ~/.zshrc');
      logger.info(`   Functions will be loaded from: ${this.functionsFile}`);
      logger.info('');
      logger.info('🔄 Please restart your terminal or run: source ~/.zshrc');

    } catch (error) {
      logger.error('❌ Failed to install zsh integration:', error.message);
      logger.info('');
      logger.info('   You can manually add this to your ~/.zshrc:');
      logger.info(`   source "${this.functionsFile}"`);
    }
  }

  showUsage() {
    logger.info('');
    logger.info('🎯 Usage Examples:');
    logger.info('   gen -m "find all files larger than 100MB"');
    logger.info('   gen -m "compress old log files" -p gemini');
    logger.info('   gen provider -list');
    logger.info('   gen --help');
    logger.info('');
    logger.info('📚 More info: https://github.com/your-repo/gen');
    logger.info('');
  }
}

export default Installer;
