/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {isText} from '../lib/core-toolkit.js';
import {urlQuery, simplifyObjectId} from '../helpers/rest-toolkit.js';

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
        displayIcon: 'local_police',
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
                    let createdAt = date.toJSON().substring(0, 19).replace('T', ' ');

                    searchResults.push({
                        id: entity.id,
                        redirect: `${entityType.redirect}/${entity.id}`,
                        displayIcon: entityType.displayIcon,
                        displayText: isText(entity.name) ? entity.name : simplifyObjectId(entity.id),
                        entityType: entityType.displayText.substring(0, entityType.displayText.length - 1),
                        tags: entity.tags.join(', '),
                        createdAt
                    });
                }
            }

            scope.$apply((scope) => {
                scope.searchResults = searchResults;
            });
        });

        requests.finally(() => {
            viewFrame.incrementLoader();
        });
    };

    scope.searchByTags = function (event) {
        const queryText = scope.filterModel.queryText.trim();
        event.preventDefault();

        if (queryText.length === 0) {
            return false;
        }

        const request = restClient.get(`/tags/${queryText}`);

        scope.searchResults = [];
        viewFrame.setLoaderSteps(3);

        request.then(({data: response}) => {
            const typeList = new Set([]);
            const typeMap = {};

            if (!Array.isArray(response.data)) {
                const emptyResult = {
                    displayIcon: 'hourglass_empty',
                    entityType: `No entities found for tag "${queryText}"`
                };

                for (let field of ['displayText', 'redirect', 'tags', 'createdAt']) {
                    emptyResult[field] = '';
                    viewFrame.incrementLoader();
                }

                scope.searchResults = [emptyResult];
                return true;
            }

            for (let entity of response.data) {
                typeList.add(entity.entity_name);
                typeMap[entity.entity_id] = entity.entity_name;
            }

            const filtered = Array.from(typeList).filter((type) => {
                return scope.filterModel.entityList.indexOf(type) >= 0;
            });

            scope._fetchEntitiesByName({typeList: filtered, typeMap});

            return true;
        });

        request.catch(() => {
            toast.error('Unable to populate search results.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });
    };

    viewFrame.clearBreadcrumbs();
    viewFrame.setTitle('Tag Search');
    viewFrame.addBreadcrumb('/tag-search', 'Tag Search');
}
