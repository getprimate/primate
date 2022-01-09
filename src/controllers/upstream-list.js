'use strict';

/**
 *
 * @param scope
 * @param ajax
 * @param viewFrame
 * @param toast
 * @constructor
 */
export default function UpstreamListController(scope, ajax, viewFrame, toast) {
    viewFrame.title = 'Upstreams';
    viewFrame.prevUrl = '';

    scope.upstreamList = [];

    scope.fetchUpstreamList = (resource) => {
        ajax.get({ resource: resource }).then(({data: response}) => {
            scope.nextUrl = (typeof response.next === 'string') ? response.next.replace(new RegExp(viewFrame.host), '') : '';

            for (let upstream of response.data) {
                scope.upstreamList.push(upstream);
            }
        }).catch(() => {
            toast.error('Could not load upstreams');
        });
    };

    viewFrame.actionButtons.push({ displayText: 'New Upstream', target: '', url: '', redirect: '#!/upstreams/__create__', styles: 'btn success create' });

    scope.fetchUpstreamList('/upstreams');
}
