/**
 * ------------------------------------------------------------
 * 
 * Copyright (c) 2022-present Ajay Sreedhar.
 *
 * Licensed under the MIT License.
 * See LICENSE file located in the root directory.
 * 
 * ============================================================
 */

import {
    BrowserWindow,
    shell as electronShell, 
    MenuItem, 
    MenuItemConstructorOptions
} from "electron";

import {showAboutDialog} from "./about-dialog";

export const menuTemplate: MenuItemConstructorOptions[] = [
    {
        label: "File",
        submenu: [
            {
                label: "Settings",
                click: (_item: MenuItem, window: BrowserWindow | undefined): void => {
                    if (window instanceof BrowserWindow) {
                        window.webContents.send("workbench:AsyncEventPush", "Open-Settings-View");
                    }
                }
            },
            {type: "separator"},
            {role: "quit"}
        ]
    },
    {
        label: "Edit",
        submenu: [{role: "undo"}, {role: "redo"}, {type: "separator"}, {role: "cut"}, {role: "copy"}, {role: "paste"}]
    },
    {
        label: "Window",
        submenu: [{role: "togglefullscreen"}]
    },
    {
        label: "Help",
        submenu: [
            {
                label: "Release Notes",
                click: (_item: MenuItem, window: BrowserWindow | undefined) => {
                    if (window instanceof BrowserWindow) {
                        window.webContents.send("workbench:AsyncEventPush", "Open-Release-Info");
                    }
                }
            },
            {type: "separator"},
            {
                label: "View on GitHub",
                click: () => {
                    electronShell.openExternal("https://github.com/getprimate/primate").catch(() => {});
                }
            },
            {
                label: "Report an Issue",
                click: () => {
                    electronShell.openExternal("https://github.com/getprimate/primate/issues").catch(() => {});
                }
            },
            {
                type: "separator"
            },
            {
                label: "About Primate",
                click: (_item: MenuItem, window: BrowserWindow | undefined) => {
                    if (window instanceof BrowserWindow) {
                        showAboutDialog(window);
                    }
                }
            }
        ]
    }
];
