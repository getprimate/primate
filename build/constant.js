/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const path = require('node:path');

const ROOT_DIR = path.dirname(__dirname);
const ICON_DIR = path.join(ROOT_DIR, 'resources', 'icons');

module.exports = {ROOT_DIR, ICON_DIR};
