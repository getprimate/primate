/**
 * Copyright (c) 2022-present Ajay Sreedhar.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

"use strict";

import path from "node:path";
import os from "node:os";

const platform = os.type();

export function home(): string {
    if (typeof os.homedir === "function") {
        return os.homedir();
    }

    switch (platform) {
        case "Windows_NT":
            return path.resolve(process.env.USERPROFILE);

        case "Linux":
        case "Darwin":
            return path.resolve(process.env.HOME);

        default:
            throw new Error(`Unsupported operating system: ${platform}.`);
    }
}

export function desktop(): string {
    return path.join(home(), "Desktop");
}

export function appData(): string {
    switch (platform) {
        case "Windows_NT":
            return typeof process.env.APPDATA === "string"
                ? path.resolve(process.env.APPDATA)
                : path.join(home(), "AppData");

        case "Linux":
            return typeof process.env.XDG_CONFIG_HOME === "string"
                ? path.resolve(process.env.XDG_CONFIG_HOME)
                : path.resolve(path.join(home(), ".config"));

        case "Darwin":
            return path.resolve(path.join(home(), "Library", "Application Support"));
    }
}

export function temp(): string {
    if (typeof os.tmpdir === "function") {
        return os.tmpdir();
    }

    switch (platform) {
        case "Windows_NT":
            return path.resolve(process.env.TEMP);

        case "Linux":
        case "Darwin":
            return path.resolve("/tmp");

        default:
            throw new Error(`Unsupported operating system: ${platform}.`);
    }
}
