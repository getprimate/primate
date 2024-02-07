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

import os from "node:os";
import {app, dialog, BrowserWindow, MessageBoxOptions} from "electron";

const extended: Record<string, string> = {
    Version: app.getVersion(),
    Electron: process.versions.electron,
    Date: "September 10, 2023",
    Platform: os.release()
};

function buildDetails(details: Record<string, string>): string {
    const keys: string[] = Object.keys(details);
    const list: string[] = [];

    for (const key of keys) {
        list.push(`${key}: ${details[key]}`);
    }

    return list.join("\n");
}

const options: MessageBoxOptions = {
    title: "Primate",
    message: "About Primate",
    type: "info",
    detail: buildDetails(extended)
};

function showAboutDialog(window: BrowserWindow): void {
    dialog.showMessageBox(window, options).finally(() => { /* Do notihing. */ });
}

export default {showAboutDialog};
