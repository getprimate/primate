'use strict';

/* global angular:true ipcRenderer:true */
(function (window, angular, content, ipcRenderer) {
    ipcRenderer.on('open-settings-view', () => {
        /* TODO: use $location */
        window.location.href = '#!/settings';
    });

    /**
     * Open all external links in default browser.
     */
    content.on('click', 'a[href^="http"]', (event) => {
        event.preventDefault();
        ipcRenderer.send('open-external', event.target.href);
    });

    /**
     * Deletes a resource when a delete button is pressed.
     */
    content.on('click', '.delete', (event) => {
        event.preventDefault();

        const target = angular.element(event.target);
        const action = target.hasClass('disable') ? 'Disable' : 'Delete';

        if (confirm(action + ' this ' + target.data('target') + '?')) {
            let ajax = angular.element('html').injector().get('ajax');
            let toast = angular.element('body').injector().get('toast');

            ajax.delete({resource: target.data('url')}).then(
                () => {
                    toast.success(target.data('target') + ' ' + action.toLowerCase() + 'd');

                    if (event.target.nodeName === 'I' || event.target.nodeName === 'SPAN') {
                        const tr = target.parents('tr');
                        tr.remove();
                    } else {
                        window.location.href = target.data('redirect');
                    }
                },
                (response) => {
                    toast.error(response.data);
                }
            );
        }
    });

    /**
     * Redirects to specified action page.
     */
    content.on('click', 'button.btn.create', (event) => {
        event.preventDefault();

        let target = angular.element(event.target);
        window.location.href = target.data('redirect');
    });
})(window, window.angular, angular.element('main.content'), ipcRenderer);
