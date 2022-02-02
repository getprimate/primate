/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import _ from '../../lib/core-utils.js';
import {urlQuery} from '../../lib/rest-utils.js';

const entityList = {
    services: {
        nodeValue: 'services',
        displayText: 'Services',
        displayIcon: 'settings_input_component',
        redirect: '#!/services'
    },

    routes: {
        nodeValue: 'routes',
        displayText: 'Routes',
        displayIcon: 'directions',
        redirect: '#!/routes'
    },

    plugins: {
        nodeValue: 'plugins',
        displayText: 'Plugins',
        displayIcon: 'directions',
        redirect: '#!/plugins'
    },

    certificates: {
        nodeValue: 'certificates',
        displayText: 'Certificates',
        displayIcon: 'verified_user',
        redirect: '#!/certificates'
    },

    ca_certificates: {
        nodeValue: 'ca_certificates',
        displayText: 'CA Certificates',
        displayIcon: 'security',
        redirect: '#!/trusted-cas'
    },

    upstreams: {
        nodeValue: 'upstreams',
        displayText: 'Upstreams',
        displayIcon: 'directions',
        redirect: '#!/upstreams'
    },

    consumers: {
        nodeValue: 'consumers',
        displayText: 'Consumers',
        displayIcon: 'directions',
        redirect: '#!/consumers'
    }
};

/**
 * Provides controller constructor for searching objects by tags.
 *
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function TagSearchController(scope, restClient, viewFrame, toast) {
    scope.ENUM_ENTITY_LIST = Object.values(entityList);

    scope.filterModel = {
        queryText: '',
        entityList: Object.keys(entityList)
    };

    scope.searchResults = [];

    scope._fetchEntitiesByName = function (entities = {typeList: [], typeMap: {}}) {
        const tags = urlQuery({tags: scope.filterModel.queryText});
        const {typeList, typeMap} = entities;

        const promises = typeList.map((type) => {
            return restClient.get(`/${type}${tags}`);
        });

        const requests = Promise.all(promises);

        viewFrame.incrementLoader();
        requests.then((resolvedList = []) => {
            const searchResults = [];
            for (let resolvedItem of resolvedList) {
                const {data: response} = resolvedItem;

                for (let entity of response.data) {
                    let entityType = entityList[typeMap[entity.id]];
                    let date = new Date(entity.created_at * 1000);
                    let createdAt = date.toJSON().substr(0, 19).replace('T', ' ');

                    searchResults.push({
                        id: entity.id,
                        redirect: `${entityType.redirect}/${entity.id}`,
                        displayIcon: entityType.displayIcon,
                        displayText: _.isText(entity.name) ? entity.name : _.objectName(entity.id),
                        entityType: entityType.displayText.substring(0, entityType.displayText.length - 1),
                        tags: entity.tags.join(', '),
                        createdAt
                    });
                }
            }

            scope.$apply((scope) => {
                scope.searchResults = searchResults;
            });

            viewFrame.incrementLoader();
        });

        requests.finally(() => {
            viewFrame.resetLoader();
        });
    };

    scope.searchByTags = function (event) {
        const queryText = scope.filterModel.queryText.trim();

        if (queryText.length === 0) return false;

        /** FIXME : Loader steps are not working properly. */
        viewFrame.resetLoader();
        viewFrame.setLoaderSteps(3);

        const request = restClient.get(`/tags/${queryText}`);

        event.preventDefault();
        request.then(({data: response}) => {
            const typeList = new Set([]);
            const typeMap = {};

            for (let entity of response.data) {
                typeList.add(entity.entity_name);
                typeMap[entity.entity_id] = entity.entity_name;
            }

            const filtered = Array.from(typeList).filter((type) => {
                return scope.filterModel.entityList.indexOf(type) >= 0;
            });

            scope._fetchEntitiesByName({typeList: filtered, typeMap});
        });

        request.catch(() => {
            toast.error('Unable to populate search results.');
        });

        request.finally(() => {
            console.log('Inc 1');
            viewFrame.incrementLoader();
        });
    };

    viewFrame.clearBreadcrumbs();
    viewFrame.setTitle('Tag Search');
    viewFrame.addBreadcrumb('#!/tag-search', 'Tag Search');
}
