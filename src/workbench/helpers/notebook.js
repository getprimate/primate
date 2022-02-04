/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import _ from '../../lib/core-utils.js';

function switchTabHandler (event) {
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

    return true;
}

export function switchTabInitiator() {
    return switchTabHandler.bind({});
}
