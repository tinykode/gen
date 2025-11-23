const os = require('os');
const path = require('path');
const fs = require('fs');

class Context {
    constructor() {
        this.os = this.getOS();
        this.shell = this.getShell();
        this.cwd = this.getCWD();
    }

    getOS() {
        return {
            platform: os.platform(),
            release: os.release(),
            type: os.type(),
            arch: os.arch()
        };
    }

    getShell() {
        return process.env.SHELL || (process.platform === 'win32' ? process.env.COMSPEC : '/bin/sh');
    }

    getCWD() {
        return process.cwd();
    }

    getDirectoryContent() {
        try {
            const files = fs.readdirSync(this.cwd, { withFileTypes: true });
            return files
                .filter(dirent => !dirent.name.startsWith('.') && dirent.name !== 'node_modules')
                .map(dirent => {
                    return {
                        name: dirent.name,
                        type: dirent.isDirectory() ? 'directory' : 'file'
                    }
                });
        } catch (error) {
            return [];
        }
    }

    gather() {
        return {
            os: this.os,
            shell: this.shell,
            cwd: this.cwd,
            directoryContent: this.getDirectoryContent()
        };
    }
}

module.exports = Context;
