/**
 * Copyright (c) 2022-present Ajay Sreedhar.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

import path from "node:path";
import directory from "../system/directory";

import {app} from "electron";

const PLATFORM_PATH = path.dirname(__dirname);

const APP_PATH = path.dirname(PLATFORM_PATH);
const ROOT_PATH = path.dirname(APP_PATH);
const WORKBENCH_PATH = path.join(APP_PATH, "workbench");

const RESOURCES_PATH = app.isPackaged ? ROOT_PATH : path.join(ROOT_PATH, "resources");

const DATA_PATH = path.join(directory.appData(), "primate-ce");

export default {
    ROOT_PATH,
    DATA_PATH,
    APP_PATH,
    PLATFORM_PATH,
    WORKBENCH_PATH,
    RESOURCES_PATH
};
