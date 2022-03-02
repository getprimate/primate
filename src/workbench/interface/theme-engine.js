/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import * as _ from '../lib/core-toolkit.js';
import {isNil} from '../lib/core-toolkit.js';

const {document} = window;

class ThemeEngine {
    _applyJSONTheme(styleString) {
        const themeStyle = JSON.parse(styleString);
        const components = Object.keys(themeStyle);

        for (let component of components) {
            let nodeId = this._componentMap[component];
            let styles = themeStyle[component];

            if (!_.isText(nodeId) || _.isNil(styles)) continue;

            let element = document.documentElement;

            if (nodeId !== '_documentElement') {
                element = document.getElementById(nodeId);
            }

            if (isNil(element)) {
                continue;
            }

            for (let name in styles) {
                element.style.setProperty(`--${name}`, styles[name]);
            }
        }
    }

    _attachLinkNode(styleSheet) {
        const previous = document.getElementById('themeCSSRel');

        if (_.isObject(previous)) {
            previous.remove();
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = styleSheet;
        link.type = 'text/css';

        document.head.appendChild(link);
    }

    constructor(components = null) {
        this._componentMap = {
            root: '_documentElement',
            sidebar: 'sidebarMenu',
            main: 'mainWrapper',
            header: 'mainHeader',
            footer: 'mainFooter'
        };

        if (_.isObject(components)) {
            for (let name in components) {
                this._componentMap[name] = components;
            }
        }
    }

    /**
     *
     * @param {Object} styles - The style property object.
     * @param {string?} styles.styleString - The style string if theme file is a JSON file.
     * @param {string?} styles.styleSheet - The file path if the theme file is a CSS file.
     */
    applyTheme(styles = {}) {
        if (_.isObject(styles) && _.isText(styles.styleString)) {
            this._applyJSONTheme(styles.styleString);
        }

        if (_.isObject(styles) && _.isText(styles.styleSheet)) {
            this._attachLinkNode(styles.styleSheet);
        }
    }
}

export default ThemeEngine;
