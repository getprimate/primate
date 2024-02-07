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

declare module "pt-platform" {

    type IPCActionType = "Write-Connection-Config" |
        "Create-Workbench-Session" |
        "Destroy-Workbench-Session" |
        "Read-Connection-List" |
        "Read-Default-Connection" |
        "Read-Session-Connection" |
        "Read-Workbench-Config" |
        "Read-Theme-List" |
        "Read-Theme-Style" |
        "Write-Workbench-Config" |
        "Open-External-Link";
}
