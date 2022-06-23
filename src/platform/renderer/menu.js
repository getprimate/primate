/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const {shell: electronShell} = require('electron');
const {showAboutDialog} = require('./about-dialog');

const menuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Settings',
                click: (menuItem, browserWindow) => {
                    browserWindow.webContents.send('workbench:AsyncEventPush', 'Open-Settings-View');
                }
            },
            {type: 'separator'},
            {role: 'quit'}
        ]
    },
    {
        label: 'Edit',
        submenu: [{role: 'undo'}, {role: 'redo'}, {type: 'separator'}, {role: 'cut'}, {role: 'copy'}, {role: 'paste'}]
    },
    {
        label: 'Window',
        submenu: [{role: 'togglefullscreen'}]
    },
    {
        label: 'Help',
        submenu: [
            {
                label: 'Release Notes',
                click: (menuItem, browserWindow) => {
                    browserWindow.webContents.send('workbench:AsyncEventPush', 'Open-Release-Info');
                }
            },
            {type: 'separator'},
            {
                label: 'View on GitHub',
                click: () => {
                    electronShell.openExternal('https://github.com/getprimate/primate').catch(() => {});
                }
            },
            {
                label: 'Report an Issue',
                click: () => {
                    electronShell.openExternal('https://github.com/getprimate/primate/issues').catch(() => {});
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'About Primate',
                click: (menuItem, browserWindow) => {
                    showAboutDialog(browserWindow);
                }
            }
        ]
    }
];

module.exports = {menuTemplate};
