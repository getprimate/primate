/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const path = require('node:path');
const fs = require('node:fs/promises');

const {RESOURCES_PATH} = require('../constant/paths');

/**
 * @property {Object} _themeList - The theme definitions.
 */
class ThemeScanner {
    async _loadThemeDefs(location) {
        const themeJson = path.join(location, 'theme.json');

        try {
            const contents = await fs.readFile(themeJson, {encoding: 'utf-8'});
            const themeDef = JSON.parse(contents);

            themeDef.absPath = location;

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

    constructor(locations = null) {
        this._locations = [path.join(RESOURCES_PATH, 'themes')];

        if (Array.isArray(locations)) {
            this._locations.push(...locations);
        }

        this._themeList = {};
    }

    async scanThemes() {
        for (let location of this._locations) {
            try {
                let stats = await fs.lstat(location);

                if (!stats.isDirectory()) continue;

                let directories = await this._listDirectories(location);

                for (let directory of directories) {
                    let themeDefs = await this._loadThemeDefs(directory);

                    if (typeof themeDefs.themeUID === 'string') {
                        this._themeList[themeDefs.themeUID] = themeDefs;
                    }
                }
            } catch (ignored) {
                // Ignore the error. Simply skip the directory.
            }
        }

        return this._themeList;
    }

    getTheme(themeUID) {
        return typeof this._themeList[themeUID] === 'undefined' ? null : this._themeList[themeUID];
    }

    async readStyle(themeUID) {
        if (typeof this._themeList[themeUID] === 'undefined') return null;

        const themeDef = this._themeList[themeUID];
        const fileType = themeDef.fileType === 'css' ? 'css' : 'json';

        if (fileType === 'css') {
            return {styleSheet: path.join(themeDef.absPath, themeDef.styles)};
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
