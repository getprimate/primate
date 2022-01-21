'use strict';

export default function HeaderController(scope, viewFrame) {
    scope.viewFrame = viewFrame;
    scope.title = 'Dashboard';

    scope.handleButtonAction = function (event) {
        const {target} = event;

        if (target.classList.contains('critical') && target.classList.contains('delete')) {
        }
    };
}
