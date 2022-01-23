'use strict';

const _refresh = (angular, element, scope) => {
    const {available, selected} = scope;
    const ul = element.children().first();

    const inputStyle = typeof element.data('input-style') === 'string' ? element.data('input-style') : 'success';

    /* Remove previously existing nodes */
    ul.empty();

    for (let item of available) {
        let {nodeValue, displayText} = typeof item === 'object' ? item : {nodeValue: item, displayText: item};

        let li = angular.element('<li></li>');
        let input = angular.element('<input>', {
            type: 'checkbox',
            class: `multi-check__input ${inputStyle}`,
            'data-node-value': nodeValue
        });

        let label = angular.element('<label></label>');

        if (selected.indexOf(nodeValue) >= 0) {
            input.attr('checked', 'checked');
        }

        label.append(input);
        label.append(`&nbsp; ${displayText}`);

        li.append(label);
        ul.append(li);
    }

    return element;
};

export default function MultiCheckDirective(window) {
    const {angular} = window;

    return {
        transclude: false,
        restrict: 'E',
        require: ['ngModel'],
        template: '<ul></ul>',
        scope: {selected: '=ngModel', available: '=optionList'},
        controller: [
            '$scope',
            function (scope) {
                scope.isInitialised = false;
            }
        ],
        link(scope, element) {
            if (!Array.isArray(scope.selected) || !Array.isArray(scope.available)) {
                return false;
            }

            _refresh(angular, element, scope);

            scope.$watch(
                'selected',
                (current, previous) => {
                    if (Array.isArray(previous) && Array.isArray(current) && previous.length !== current.length) {
                        return _refresh(angular, element, scope);
                    }
                },
                false
            );

            scope.$watch(
                'available',
                (current, previous) => {
                    if (Array.isArray(previous) && Array.isArray(current) && previous.length !== current.length) {
                        return _refresh(angular, element, scope);
                    }
                },
                false
            );

            element.on('change', 'input.multi-check__input', (event) => {
                const {currentTarget: target} = event;
                if (target.nodeName !== 'INPUT') {
                    return false;
                }

                const {nodeValue} = target.dataset;

                if (target.checked === true) {
                    scope.selected.push(nodeValue);
                } else {
                    let position = scope.selected.indexOf(nodeValue);
                    scope.selected.splice(position, 1);
                }
            });

            scope.isInitialised = true;
        }
    };
}
