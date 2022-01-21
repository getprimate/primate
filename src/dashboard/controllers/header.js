'use strict';

export default function HeaderController(window, scope, ajax, viewFrame, toast, logger) {
    scope.viewFrame = viewFrame;
    scope.title = 'Dashboard';

    scope.handleButtonAction = function (event) {
        const {target: button} = event;

        if (button.nodeName !== 'BUTTON') {
            return false;
        }

        const {target, endpoint, redirect} = button.dataset;

        event.preventDefault();

        if (button.classList.contains('critical') && button.classList.contains('delete')) {
            const proceed = confirm(`Proceed to delete this ${target}?`);

            if (proceed === false) {
                return false;
            }

            const request = ajax.delete({endpoint});

            request.then(({httpText}) => {
                toast.success(`${target} deleted.`);
                logger.info(httpText);

                window.location.href = redirect;
            });

            request.catch(({data: error, httpText}) => {
                toast.error(`Unable to delete ${target}.`);
                logger.exception(httpText, error);
            });
        }

        if (button.classList.contains('btn') && button.classList.contains('create')) {
            window.location.href = redirect;
        }

        return true;
    };
}
