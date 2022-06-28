/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import * as _ from '../lib/core-toolkit.js';

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
        li.dataset.identifier = _.randomHex();
        li.innerHTML = `${token} <span class ="material-icons clickable">highlight_off</span>`;

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
    let length = 0;

    while (listElement.firstElementChild !== null) {
        listElement.removeChild(listElement.lastElementChild);
        length++;
    }

    return length;
}

/**
 * Updates the UL element if a change in the model array is detected.
 *
 * This function should not be called directly.
 * Allways create a bound function with the below context:
 *
 * @property {{tokenModel: []}} _scope - The current directive scope.
 * @property {HTMLUListElement} _listElement - The token list element.
 *
 * @param {string[]} current - The current array of tokens.
 * @param {string[]} previous - The previous array of tokens.
 * @return {boolean} True if new LI items were added, false otherwise.
 */
function TokenModelWatcher(current, previous) {
    clearItemElements(this._listElement);

    if (!Array.isArray(current) || (_.isNil(previous) && Array.isArray(current))) {
        return false;
    }

    attachItemElements(this._listElement, current);
    return true;
}

/**
 * Handles events triggered from the textarea element.
 *
 * This function should not be called directly.
 * Allways create a bound function with the below context:
 *
 * @property {{tokenModel: []}} _scope - The current directive scope.
 * @property {Object} _scope.tokenModel - The model object.
 * @property {HTMLUListElement} _listElement - The token list element.
 *
 * @param {Event} event - The event object.
 */
function TokenTextAreaWatcher(event) {
    const {target} = event;
    event.preventDefault();

    if (event.keyCode === 13) {
        const value = target.value.trim();

        if (_.isNil(this._scope.tokenModel)) {
            this._scope.tokenModel = [];
        }

        if (value.length >= 1) {
            const tokens = this._options.disableParser ? [value] : _.explode(value, ',');
            const items = attachItemElements(this._listElement, tokens);

            this._scope.tokenModel.push(...items);
        }

        target.value = '';
    }

    return true;
}

/**
 * Handles events triggered from the UL element.
 *
 * This function should not be called directly.
 * Allways create a bound function with the below context:
 *
 * @property {{tokenModel: []}} _scope - The current directive scope.
 * @property {Object} _scope.tokenModel - The model object.
 * @property {HTMLUListElement} _listElement - The token list element.
 *
 * @param {Event} event - The event object.
 */
function TokenListItemWatcher(event) {
    const {target} = event;

    if (target.nodeName !== 'LI' && target.nodeName !== 'SPAN') {
        return false;
    }

    let itemNode = target;

    if (target.nodeName === 'SPAN' && target.classList.contains('clickable')) {
        itemNode = target.closest('li');
    }

    const index = detachItemElement(this._listElement, itemNode);
    this._scope.tokenModel.splice(index, 1);

    return true;
}

/**
 * Initializes the token input directive.
 *
 * @param {{tokenModel: [string]}} scope - The injected scope object.
 * @param {Object} element - The parent element wrapped as jqLite object.
 * @param {{disableParser?: string, placeholder?: string}} attributes - The element attributes.
 * @return {boolean} True if linking successful, false otherwise.
 */
function link(scope, element, attributes) {
    /** @type HTMLElement */
    const parentElement = element[0];
    const childElements = {
        textElement: parentElement.firstElementChild,
        listElement: parentElement.lastElementChild
    };

    const context = {
        _scope: scope,
        _options: {disableParser: _.isDefined(attributes.disableParser)},
        _textElement: childElements.textElement,
        _listElement: childElements.listElement
    };

    const tokenModelWatcher = TokenModelWatcher.bind(context);
    const keyupEventListener = TokenTextAreaWatcher.bind(context);
    const clickEventListsner = TokenListItemWatcher.bind(context);

    parentElement.classList.add('token-input');

    childElements.textElement.placeholder = _.isText(attributes.placeholder)
        ? attributes.placeholder
        : 'Type and press enter...';

    scope.$watch('tokenModel', tokenModelWatcher, false);

    childElements.textElement.addEventListener('keyup', keyupEventListener);
    childElements.listElement.addEventListener('click', clickEventListsner);

    scope.$on('$destroy', () => {
        clearItemElements(childElements.listElement);

        parentElement.removeChild(childElements.textElement);
        parentElement.removeChild(childElements.listElement);

        childElements.textElement = null;
        childElements.listElement = null;

        parentElement.remove();
    });
}

/**
 * Provides constructor for creating token input directive.
 *
 * HTML Element
 * <token-input></token-input>
 *
 * Element Properties:
 * - data-ng-model - The model reference. Should be an array.
 * - data-disable-parser - If set, tokens will not be split by comma.
 * - data-placeholder - A placeholder text to be displayed on the text area.
 *
 * @constructor
 * @return {Object} The directive definition.
 */
export default function TokenInputDirective() {
    const template = '<textarea class="token-input__text"></textarea><ul class="token-input__list"></ul>';

    return {
        transclude: false,
        restrict: 'E',
        require: 'ngModel',
        scope: {tokenModel: '=ngModel'},
        link,
        template
    };
}
