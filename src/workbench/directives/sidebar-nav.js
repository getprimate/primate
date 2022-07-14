/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {isObject, isText} from '../lib/core-toolkit.js';

const {document} = window;
const WATCHER_LIST = [];
const WRAPPER_LIST = [];

/**
 * Extracts hash bang #! component from the URL.
 *
 * @param {string} href - The location path.
 * @returns {string} The hash bang component
 */
function hashBang(href) {
    const index = href.indexOf('#!');

    if (index <= -1) {
        return '__none__';
    }

    const hashPath = href.substring(index + 2);
    const parts = hashPath.split('/');

    const follow = parts[1] === 'release-info' ? `/${parts[1]}` : '';

    for (let index = parts.length - 1; index >= 0; index--) {
        if (parts[index] === '__create__' || parts[index].length >= 20) {
            continue;
        }

        return `#!${follow}/${parts[index]}`;
    }

    return '__none__';
}

/**
 * Creates a section with a title.
 *
 * @param {string} title - The section title.
 * @returns {HTMLElement} The div element.
 */
function createSectionTitle(title) {
    const div = document.createElement('div');
    div.classList.add('navigation__title');
    div.innerHTML = title;

    return div;
}

/**
 * Creates a material icon span.
 *
 * @param {string|object} options - The icon options.
 * @returns {HTMLSpanElement} - The created span element.
 */
function createMaterialIcon(options) {
    const span = document.createElement('span');
    span.classList.add('material-icons');

    if (isObject(options)) {
        const {text, styles} = options;

        span.innerHTML = text;
        span.classList.add(styles);
    } else {
        span.innerHTML = options;
    }

    return span;
}

/**
 *  Builds HTML UL element from the provided template.
 *
 * @param {MenuTemplate} template - The menu template input.
 * @return {HTMLUListElement} The menu UL element.
 */
function buildMenuFromTemplate(template) {
    const ul = document.createElement('ul');
    ul.classList.add('navigation__menu');

    for (let options of template) {
        let li = document.createElement('li');
        let anchorLink = document.createElement('a');
        let labelSpan = document.createElement('span');

        if (options.active === true) {
            li.classList.add('active');
        }

        labelSpan.innerHTML = options.displayText;

        anchorLink.classList.add('navigation__link');
        anchorLink.href = li.dataset.redirect = options.listView;
        anchorLink.appendChild(createMaterialIcon(options.icon));
        anchorLink.appendChild(labelSpan);

        li.appendChild(anchorLink);

        if (isText(options.editView) && options.editView.length >= 5) {
            let anchorPlus = document.createElement('a');
            anchorPlus.classList.add('navigation__link');
            anchorPlus.href = options.editView;
            anchorPlus.appendChild(createMaterialIcon('add'));

            li.appendChild(anchorPlus);
        }

        ul.appendChild(li);
    }

    return ul;
}

/**
 * Provides a callback for menu template watcher.
 *
 * This function should not be called directly.
 * Allways create a bound function with the below context:
 *
 * @property {Object} _scope - The parent directive scope.
 * @property {HTMLElement} _navElement - The nav element.
 *
 * @param {Object} current - The current model object.
 * @returns {boolean} True if handled, false otherwise.
 */
function MenuTemplateWatcher(current) {
    if (!Array.isArray(current) || current.length === 0) {
        return false;
    }

    /* Deregister all watchers. */
    for (let watcher of WATCHER_LIST) {
        watcher();
    }

    const menu = buildMenuFromTemplate(current, 'Objects');
    this._navElement.appendChild(menu);

    WRAPPER_LIST.push(menu);

    delete this._scope.menuTemplate;
    return true;
}

/**
 * Highlights the current menu in the navbar.
 */
function highlightMenuItem() {
    const href = hashBang(window.location.href);

    for (let ul of WRAPPER_LIST) {
        for (let li of ul.children) {
            if (li.dataset.redirect === href) li.classList.add('active');
            else li.classList.remove('active');
        }
    }
}

/**
 * Initializes the sidebar nav.
 *
 * @param {Object} scope - The injected scope object.
 * @param {Object} element - The parent element wrapped as jqLite object.
 * @param {{currentView?: string}} attributes - The element attributes.
 * @return {boolean} True if linking successful, false otherwise.
 */
function link(scope, element, attributes) {
    const navElement = element[0];
    const context = {
        _scope: scope,
        _navElement: navElement
    };

    const nodeMenuTemplate = [
        {enabled: true, active: true, displayText: 'Overview', icon: 'view_quilt', listView: '#!/'},
        {enabled: true, displayText: 'Configuration', icon: 'cloud_done', listView: '#!/node-config'}
    ];

    if (isText(attributes.currentView) && attributes.currentView === 'dashboard') {
        const nodeMenu = buildMenuFromTemplate(nodeMenuTemplate);

        navElement.appendChild(createSectionTitle('Node'));
        navElement.appendChild(nodeMenu);

        navElement.appendChild(createSectionTitle('Objects'));

        WRAPPER_LIST.push(nodeMenu);
    }

    const templateWatcher = MenuTemplateWatcher.bind(context);
    WATCHER_LIST.push(scope.$watch('menuTemplate', templateWatcher, false));
    return true;
}

/**
 * Provides definitions for creating sidebar navigation directive.
 *
 * HTML Element
 * <nav data-sidebar-nav="sidebar-nav"></nav>
 *
 * Element Properties:
 * - data-current-view - The current view - bootstrap or dashboard.
 *
 * @return {Object} The directive definition.
 */
export default function SidebarNavDirective() {
    return {
        transclude: false,
        restrict: 'A',
        link
    };
}

window.addEventListener('hashchange', highlightMenuItem);
