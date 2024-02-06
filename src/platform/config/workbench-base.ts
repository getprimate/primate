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

export interface WorkbenchBase {
    dateFormat: string;
    themeUID: string;
    showFooter: boolean;
    showBreadcrumbs: boolean;
}

const base: WorkbenchBase = {
    dateFormat: "standard",
    themeUID: "dark-v1.0.0@getprimate.xyz",
    showFooter: true,
    showBreadcrumbs: true
};

export default base;
