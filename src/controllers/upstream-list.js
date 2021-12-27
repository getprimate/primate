'use strict';

/* global app:true */
(function(app) {
    const controller = 'UpstreamListController';

    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$scope', 'ajax', 'viewFactory', 'toast', function (scope, ajax, viewFactory, toast) {
        viewFactory.createAction = {redirect: '#!/upstreams/__create__', displayText: 'New Upstream'};
        viewFactory.title = 'Upstreams';
        viewFactory.prevUrl = null;

        scope.upstreamList = [];

        scope.fetchUpstreamList = (resource) => {
            ajax.get({ resource: resource }).then(({data: response}) => {
                scope.nextUrl = (typeof response.next === 'string') ? response.next.replace(new RegExp(viewFactory.host), '') : '';

                for (let upstream of response.data) {
                    scope.upstreamList.push(upstream);
                }
            }).catch(() => {
                toast.error('Could not load upstreams');
            });
        };

        scope.fetchUpstreamList('/upstreams');
    }]);
})(app);
