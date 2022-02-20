/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const path = require('path');

const PLATFORM_PATH = path.dirname(__dirname);

const APP_PATH = path.dirname(PLATFORM_PATH);
const ROOT_PATH = path.dirname(APP_PATH);
const WORKBENCH_PATH = path.join(APP_PATH, 'workbench');

module.exports = {ROOT_PATH, APP_PATH, PLATFORM_PATH, WORKBENCH_PATH};
