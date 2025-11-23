import Installer from '../src/installer.js';

const installer = new Installer();
installer.install().catch(console.error);