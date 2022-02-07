'use strict';

const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

/**
 * @property {Object} _themeDefs - The theme definitions.
 * @property {string} _themeDefs.fileType - CSS or JSON file type.
 */
class ThemeScanner {
    async _loadThemeDefs(location) {
        const themeJson = path.join(location, 'theme.json');

        try {
            const contents = await fs.readFile(themeJson, {encoding: 'utf-8'});
            const themeDef = JSON.parse(contents);

            themeDef.absPath = location;
            themeDef.nonce = crypto.randomBytes(8).toString('hex');

            return themeDef;

        } catch (error) {
            throw `Unable to read ${themeJson}. ${error}`;
        }
    }

    async _listDirectories(location) {
        let contents = await fs.readdir(location);
        let filtered = [];

        for (let directory of contents) {
            let currentPath = path.join(location, directory);

            let stat = await fs.lstat(currentPath);

            if (stat.isFile()) continue;

            try {
                let stat = await fs.lstat(path.join(currentPath, 'theme.json'));

                if (stat.isFile()) filtered.push(currentPath);

            } catch (ignored) {
                // eslint-disable no-empty
            }
        }

        return filtered;
    }

    constructor(locations, options = {}) {
        this._locations = Array.isArray(locations) ? locations : [];
        this._themeDefs = {};
    }

    async scanThemes() {
        let location;

        try {
            for (location of this._locations) {
                let stats = await fs.lstat(location);

                if (!stats.isDirectory()) continue;

                let directories = await this._listDirectories(location);

                for (let directory of directories) {
                    let themeDefs = await this._loadThemeDefs(directory);
                    this._themeDefs[themeDefs.nonce] = themeDefs;
                }
            }

        } catch (error) {
            throw new Error(`Can not read directory ${location}. ${error}`);
        }

        return this._themeDefs;
    }

    async readStyle(nonce) {
        if (typeof this._themeDefs[nonce] === 'undefined') return null;

        const themeDef = this._themeDefs[nonce];
        const fileType = (themeDef.fileType === 'css') ? 'css' : 'json';

        if (fileType === 'css') {
            return { styleSheet: path.join(themeDef.absPath, themeDef.styles) };

        } else {
            const filePath = path.join(themeDef.absPath, themeDef.styles);

            try {
                const contents = await fs.readFile(filePath, {encoding: 'utf-8'});
                return {styleString: contents};

            } catch (error) {
                throw new Error(`Unable to read contents of ${filePath}. ${error}`);
            }
        }
    }
}

module.exports = ThemeScanner;
