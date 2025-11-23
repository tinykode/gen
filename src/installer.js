#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

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
    console.log('🚀 Welcome to Gen!');
    console.log('');
    console.log('This tool generates bash commands from natural language using:');
    console.log('  • GitHub Copilot CLI (gh copilot)');
    console.log('  • Gemini CLI (gemini)');
    console.log('  • Future: Claude CLI and others');
    console.log('');
    console.log('⚠️  WARNING: This tool is for experienced developers only!');
    console.log('   Commands are generated ready-to-execute. Know what you\'re doing.');
    console.log('');

    // Check if .zshrc exists
    if (!fs.existsSync(this.zshrcPath)) {
      console.log('❌ No .zshrc file found. This tool requires zsh.');
      console.log('   Please install zsh and create a .zshrc file first.');
      return;
    }

    // Check if already installed
    const zshrcContent = fs.readFileSync(this.zshrcPath, 'utf8');
    if (zshrcContent.includes(this.getImportScriptsContent(this.functionsFile))) {
      console.log('✅ Gen already configured in .zshrc');
      console.log('');
      this.showUsage();
      return;
    }

    // Prompt user
    const shouldInstall = await this.promptUser();
    if (shouldInstall) {
      this.installZshFunctions();
      this.showUsage();
    } else {
      console.log('');
      console.log('⏭️  Skipped zsh integration.');
      console.log('   You can manually add the functions from:');
      console.log(`   ${this.functionsFile}`);
      console.log('');
      console.log('   Or run: npm run configure');
    }
  }

  async promptUser() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      console.log('📝 To use the `gen` command, we need to add a source line to your .zshrc');
      console.log('   This will load the gen functions from the global package installation.');
      console.log('');
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

      // if TINYKIT_GEN tags are in file replaced the content inside with the source block
      if (zshrcContent.includes('# TINYKIT_GEN_START')) {
        const updatedZshrcContent = zshrcContent.replace(/# TINYKIT_GEN_START[\s\S]*?# TINYKIT_GEN_END/, `# TINYKIT_GEN_START\n${sourceBlock}\n# TINYKIT_GEN_END`);
        fs.writeFileSync(this.zshrcPath, updatedZshrcContent);
      } else {
        // if not, appended to the file
        fs.appendFileSync(this.zshrcPath, `\n# TINYKIT_GEN_START\n${sourceBlock}\n# TINYKIT_GEN_END`);
      }

      console.log('');
      console.log('✅ Successfully added gen source to ~/.zshrc');
      console.log(`   Functions will be loaded from: ${this.functionsFile}`);
      console.log('');
      console.log('🔄 Please restart your terminal or run: source ~/.zshrc');

    } catch (error) {
      console.error('❌ Failed to install zsh integration:', error.message);
      console.log('');
      console.log('   You can manually add this to your ~/.zshrc:');
      console.log(`   source "${this.functionsFile}"`);
    }
  }

  showUsage() {
    console.log('');
    console.log('🎯 Usage Examples:');
    console.log('   gen -m "find all files larger than 100MB"');
    console.log('   gen -m "compress old log files" -p gemini');
    console.log('   gen provider -list');
    console.log('   gen --help');
    console.log('');
    console.log('📚 More info: https://github.com/your-repo/gen');
    console.log('');
  }
}

module.exports = Installer;
