import os from 'os';
import fs from 'fs';
import path from 'path';
import logger from './logger.js';

class Config {
    constructor() {
        this.homeDir = os.homedir();
        this.configPath = path.join(this.homeDir, '.tinykode/gen-config');
        this.config = this.loadConfig();
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const content = fs.readFileSync(this.configPath, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            logger.warn('Warning: Could not load config file, using defaults');
        }

        return {
            provider: null, // null means auto-detect
            providers: {}
        };
    }

    saveConfig() {
        // create a directory if it doesn't exist
        try {
            fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
        } catch (error) {
            throw new Error(`Could not save config: ${error.message}`);
        }
    }

    getProvider() {
        return this.config.provider;
    }

    setProvider(provider) {
        this.config.provider = provider;
        this.saveConfig();
    }

    listProviders() {
        return ['gh', 'gemini'];
    }
}

export default Config;
