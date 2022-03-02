/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * A callback to be executed on completion.
 *
 * @callback NotebookSwitchCb
 * @param {Object} properties - The element dataset.
 */

import * as _ from '../lib/core-toolkit.js';

/**
 * Switches the notebook pages upon clicking the tabs.
 *
 * @param {Event} event - Click event on notebook tabs.
 * @return {boolean} True if pages switched, false otherwise.
 * @property {NotebookSwitchCb} _onComplete - A callback function to be executed after switching the pages.
 */
function switchTabHandler(event) {
    const {target, currentTarget: tabList} = event;

    if (target.nodeName !== 'LI' || _.isNil(target.dataset.pageId)) {
        return false;
    }

    const {parentNode: notebook, children: pages} = tabList;
    const {pageId} = target.dataset;

    for (let page of pages) {
        page.classList.remove('active');
    }

    target.classList.add('active');

    for (let section of notebook.children) {
        if (section.nodeName !== 'SECTION' || !section.classList.contains('notebook__page')) continue;

        if (pageId === `#${section.id}`) section.classList.add('active');
        else section.classList.remove('active');
    }

    if (typeof this._onComplete === 'function') {
        this._onComplete.call(null, target.dataset);
    }

    return true;
}

/**
 * Binds {@link switchTabHandler} with the provided parameters.
 *
 * @param {NotebookSwitchCb|null} onComplete - A callback to be executed on completion.
 * @return {(function(Event): boolean)} The event handler function.
 */
export function switchTabInitiator(onComplete = null) {
    return switchTabHandler.bind({_onComplete: onComplete});
}
