'use strict';

/**
 * Attaches nodes under the unordered list.
 *
 * @private
 *
 * @param {{element: function}} angular - the angular object
 * @param {{tokenList: Array}} scope - the current scope
 * @param {{append: function}} element - the jqLite wrapped instance of the element
 * @param {Array|string} tokens - tokens to be appended
 * @return {{append: function}} the element object
 */
const _attachListNodes = (angular, scope, element, tokens) => {
    const shouldAppend = typeof tokens === 'string';
    const tokenList = shouldAppend === true ? tokens.split(',') : [...scope.tokenList];

    for (let token of tokenList) {
        token = token.trim();

        let li = angular.element(`<li data-token-value="${token}"></li>`);
        li.html(`${token} <span class ="material-icons">highlight_off</span>`);

        element.append(li);

        if (shouldAppend === true) {
            scope.tokenList.push(token);
        }
    }

    return element;
};

/**
 * Directive constructor for token-input widgets.
 *
 * @constructor
 *
 * @param {window} window - the injected top level window object
 * @returns {{controller: [string, function],
 *      transclude: boolean,
 *      link({tokenList: Array, isInitialised: boolean, $watch: Function}, {find: Function, addClass: Function, on: Function}, Object): boolean,
 *      require: string,
 *      restrict: string}} the directive object
 */
export default function TokenInputDirective(window) {
    const {angular} = window;

    return {
        transclude: false,
        restrict: 'E',
        require: 'ngModel',
        template: '<textarea class="token-input__text"></textarea><ul class="token-input__list"></ul>',
        scope: {tokenList: '=ngModel'},
        controller: [
            '$scope',
            function (scope) {
                scope.isInitialised = false;
            }
        ],

        /**
         *
         * @param {{tokenList: Array, isInitialised: boolean, $watch: function}} scope - the ng-model of the element
         * @param {{find: function, addClass: function, on: function}} element - a jqLite instance of the element
         * @param {Object} attrs - the element attributes
         * @returns {boolean} true on linking, false otherwise
         */
        link(scope, element, attrs) {
            if (!Array.isArray(scope.tokenList)) {
                return false;
            }

            /**
             * The textarea for typing tokens.
             * @type {Object}
             * @property {function} attr - sets an attribute
             */
            const textNode = element.find('textarea').first();

            /**
             * The unordered list for attaching tokens.
             */
            const itemNode = element.find('ul').first();

            scope.$watch(
                'tokenList',
                (current, previous) => {
                    if (scope.isInitialised === true) {
                        return scope.isInitialised;
                    }

                    if (Array.isArray(previous) && Array.isArray(current) && previous.length !== current.length) {
                        scope.isInitialised = true;
                        return _attachListNodes(angular, scope, itemNode, scope.tokenList);
                    }

                    return scope.isInitialised;
                },
                false
            );

            element.addClass('token-input');
            element.on('click', 'li', (event) => {
                const {currentTarget: target} = event;

                if (target.nodeName !== 'LI') {
                    return false;
                }

                target.remove();

                if (Array.isArray(scope.tokenList)) {
                    scope.tokenList.splice(0);

                    for (let child of itemNode.children()) {
                        let {tokenValue} = child.dataset;

                        if (typeof tokenValue === 'string') {
                            scope.tokenList.push(tokenValue);
                        }
                    }
                }
            });

            textNode.attr(
                'placeholder',
                typeof attrs.placeholder === 'string' ? attrs.placeholder : 'Type and press enter...'
            );
            textNode.on('keyup', (event) => {
                const {target} = event;
                event.preventDefault();

                if (event.keyCode === 13) {
                    let value = target.value.trim();

                    if (value.length >= 1) {
                        _attachListNodes(angular, scope, itemNode, target.value.trim());
                    }

                    target.value = '';
                }
            });
        }
    };
}
