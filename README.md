# tinykode/gen

Generate bash commands from natural language using AI. Commands are generated directly into your terminal, ready to execute.

## Safety Warning

⚠️ **For vibecoding only** ⚠️

This tool is designed for people who copy-paste commands from StackOverflow and ChatGPT without understanding them. If that's not you, you probably don't need this.

Commands appear in your terminal input line with no explanation or confirmation. One Enter key away from execution.

## Disclaimer

Use at your own risk. This tool can generate destructive commands. But hey, you're already copy-pasting from ChatGPT anyway.

## Installation

**Step 1: Install the package**
```bash
npm install -g @tinykode/gen
```

**Step 2: Configure zsh integration (optional, zsh only)**

If you're using **zsh**, run the configuration to add the write helper as a zsh function:
```bash
gen configure
source ~/.zshrc
```

This enables commands to appear directly in your terminal input line, ready to execute.

**Without zsh setup**: Commands will be printed to the console only. You'll need to copy-paste them manually.

## Prerequisites

Install one of these AI tools:

**GitHub Copilot CLI**:
```bash
npm install -g @github/copilot
```

**Gemini CLI**:
```bash
npm install -g gemini-cli
gemini config set apiKey YOUR_API_KEY
```

## Usage

```bash
gen "find all files larger than 100MB"
# → Command appears: find . -size +100M -type f -ls
# → Press Enter to execute

gen "compress old log files" -p gemini
gen "kill all processes on port 3000"
```

## Provider Management

```bash
gen provider -list          # List available providers
gen provider -set copilot   # Set default provider
```

## How it Works

1. Uses your existing AI CLI tools (no new subscriptions)
2. Sends your prompt to AI
3. Places generated command in your terminal using `print -z`
4. You press Enter to execute

## Disclaimer

Use at your own risk. This tool can generate destructive commands. But hey, you're already copy-pasting from ChatGPT anyway.
