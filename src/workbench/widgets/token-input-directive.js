/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {explode, isNil, isText, randomHex} from '../../lib/core-toolkit.js';

/**
 * Creates LI nodes with token values under the specified UL element.
 *
 * @param {HTMLUListElement} listElement - The parent UL element.
 * @param {string[]} tokens - An array of tokens to be added.
 * @return {string[]} The added token array.
 */
function attachItemElements(listElement, tokens = []) {
    for (let token of tokens) {
        let li = document.createElement('li');

        li.dataset.displayText = token;
        li.dataset.identifier = randomHex();
        li.innerHTML = `${token} <span class ="material-icons">highlight_off</span>`;

        listElement.appendChild(li);
    }

    return tokens;
}

/**
 * Removes the specified LI node from the UL element.
 *
 * @param {HTMLUListElement} listElement - The parent UL element.
 * @param {HTMLLIElement} itemElement - The LI element to be removed.
 * @return {number} The index of the removed element.
 */
function detachItemElement(listElement, itemElement) {
    const {identifier} = itemElement.dataset;
    let index = 0;

    for (let li of listElement.children) {
        if (li.dataset.identifier === identifier) {
            break;
        }

        index++;
    }

    itemElement.remove();

    return index;
}

/**
 * Removes all LI nodes from the UL element.
 *
 * @param {HTMLUListElement} listElement - The parent UL element.
 * @return {number} - The number of items removed.
 */
function clearItemElements(listElement) {
    const length = listElement.children.length;

    for (let li of listElement.children) {
        li.remove();
    }

    return length;
}

function link(scope, jqElement, attributes) {
    /** @type HTMLElement */
    const parentElement = jqElement[0];

    /* Abort linking if the provided ngModel is not an array. */
    if (!Array.isArray(scope.tokenList)) {
        return false;
    }

    const textElement = parentElement.querySelector('textarea.token-input__text');
    const listElement = parentElement.querySelector('ul.token-input__list');

    /**
     * Updates the UL element if a change in the model array is detected.
     *
     * @param {string[]} current - The current array of tokens.
     * @param {string[]} previous - The previous array of tokens.
     * @return {boolean} True if new LI items were added, false otherwise.
     */
    const onTokenListUpdated = (current, previous) => {
        clearItemElements(listElement);

        if (!Array.isArray(current) || current.length === 0) {
            return false;
        }

        if (!Array.isArray(previous) || current.length !== previous.length) {
            attachItemElements(listElement, current);
        }

        return true;
    };

    parentElement.classList.add('token-input');

    textElement.placeholder = isText(attributes.placeholder) ? attributes.placeholder : 'Type and press enter...';

    textElement.addEventListener('keyup', (event) => {
        event.preventDefault();

        const {target} = event;

        if (event.keyCode === 13) {
            let value = target.value.trim();

            if (value.length >= 1) {
                const tokens = isNil(attributes['disableParser']) ? explode(value, ',') : [value];
                const items = attachItemElements(listElement, tokens);

                scope.tokenList.push(...items);
            }

            target.value = '';
        }
    });

    listElement.addEventListener('click', (event) => {
        const {target} = event;

        if (target.nodeName !== 'LI' && target.nodeName !== 'SPAN') {
            return false;
        }

        let itemNode = target;

        if (target.nodeName === 'SPAN' && target.classList.contains('material-icons')) {
            itemNode = target.closest('li');
        }

        const index = detachItemElement(listElement, itemNode);
        scope.tokenList.splice(index, 1);
    });

    scope.$watch('tokenList', onTokenListUpdated, false);

    scope.$on('$destroy', () => {
        clearItemElements(listElement);
    });
}

function controller(scope) {
    scope.isInitialised = false;
}

export default function TokenInputDirective() {
    return {
        transclude: false,
        restrict: 'E',
        require: 'ngModel',
        template: '<textarea class="token-input__text"></textarea><ul class="token-input__list"></ul>',
        scope: {tokenList: '=ngModel'},
        controller: ['$scope', controller],
        link
    };
}
