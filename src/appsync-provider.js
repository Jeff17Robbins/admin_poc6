import Amplify from '@aws-amplify/core';
import '@aws-amplify/auth';
import awsconfig from './aws-exports';
import { schema } from './models/schema';
import { API, graphqlOperation } from 'aws-amplify';
import * as queries from './graphql/queries';
import * as mutations from './graphql/mutations';
import { HttpError } from 'react-admin';

Amplify.configure(awsconfig);

// for testing
window.addEventListener('unhandledrejection', function (event) {
    // the event object has two special properties:
    console.log(event.promise); // [object Promise] - the promise that generated the error
    console.log(event.reason); // Error: Whoops! - the unhandled error object
    console.log(event);
});

// https://github.com/marmelab/FakeRest/blob/8397d21b8c8e3a847f80a362dddb1da5cf5a0f5e/src/Collection.js
const every = (array, predicate) =>
    array.reduce((acc, value) => acc && predicate(value), true);

const some = (array, predicate) =>
    array.reduce((acc, value) => acc || predicate(value), false);

function filterItems(items, filter) {
    if (typeof filter === 'function') {
        return items.filter(filter);
    }
    if (filter instanceof Object) {
        // turn filter properties to functions
        var filterFunctions = Object.keys(filter).map(key => {
            if (key === 'q') {
                let regex = new RegExp(filter.q, 'i');
                // full-text filter
                return item => {
                    for (let itemKey in item) {
                        if (
                            item[itemKey] &&
                            item[itemKey].match &&
                            item[itemKey].match(regex) !== null
                        )
                            return true;
                    }
                    return false;
                };
            }
            let value = filter[key];
            if (key.indexOf('_lte') !== -1) {
                // less than or equal
                let realKey = key.replace(/(_lte)$/, '');
                return item => item[realKey] <= value;
            }
            if (key.indexOf('_gte') !== -1) {
                // less than or equal
                let realKey = key.replace(/(_gte)$/, '');
                return item => item[realKey] >= value;
            }
            if (key.indexOf('_lt') !== -1) {
                // less than or equal
                let realKey = key.replace(/(_lt)$/, '');
                return item => item[realKey] < value;
            }
            if (key.indexOf('_gt') !== -1) {
                // less than or equal
                let realKey = key.replace(/(_gt)$/, '');
                return item => item[realKey] > value;
            }
            if (Array.isArray(value)) {
                return item => {
                    if (Array.isArray(item[key])) {
                        // array filter and array item value: where all items in values
                        return every(value, v =>
                            some(item[key], itemValue => itemValue === v)
                        );
                    }
                    // where item in values
                    return value.filter(v => v === item[key]).length > 0;
                };
            }
            return item => {
                if (Array.isArray(item[key]) && typeof value == 'string') {
                    // simple filter but array item value: where value in item
                    return item[key].indexOf(value) !== -1;
                }
                if (typeof item[key] == 'boolean' && typeof value == 'string') {
                    // simple filter but boolean item value: boolean where
                    return item[key] === (value === 'true' ? true : false);
                }
                // simple filter
                return item[key] === value;
            };
        });
        // only the items matching all filters functions are in (AND logic)
        return items.filter(item =>
            filterFunctions.reduce(
                (selected, filterFunction) => selected && filterFunction(item),
                true
            )
        );
    }
    throw new Error('Unsupported filter type');
}

// https://stackoverflow.com/questions/979256/sorting-an-array-of-objects-by-property-values
const sort_primers = {
    Int: parseInt,
    Float: parseFloat,
};
const sort_by = (field, reverse, primer) => {
    const key = primer
        ? function (x) {
              return primer(x[field]);
          }
        : function (x) {
              return x[field];
          };

    reverse = !reverse ? 1 : -1;

    return function (a, b) {
        a = key(a);
        b = key(b);
        return reverse * ((a > b) - (b > a));
    };
};

// https://stackoverflow.com/questions/42761068/paginate-javascript-array
function paginate(arr, size) {
    return arr.reduce((acc, val, i) => {
        let idx = Math.floor(i / size);
        let page = acc[idx] || (acc[idx] = []);
        page.push(val);

        return acc;
    }, []);
}

// helpers for data provider

async function create(model_schema, data) {
    const op = `create${model_schema.name}`;
    const draft = {};
    for (const key of Object.keys(model_schema.fields)) {
        draft[key] = data[key];
    }
    const result = await API.graphql(
        graphqlOperation(mutations[op], { input: { ...draft } })
    );
    const item = result.data[op];
    return item;
}

// updateMany can't work as-is -- need a _version for each id's record...
async function updateOne(model_schema, id, data) {
    const op = `update${model_schema.name}`;
    const draft = { id: id, _version: data._version };

    for (const key of Object.keys(model_schema.fields)) {
        if (key !== 'id') draft[key] = data[key];
    }

    try {
        const result = await API.graphql(
            graphqlOperation(mutations[op], { input: { ...draft } })
        );
        const item = result.data[op];
        return item;
    } catch (error) {
        const inner_error = error.errors[0];
        let err;
        if (inner_error.errorType === 'ConflictUnhandled')
            err = new HttpError(
                'another user has changed this record; please reconcile and try again.',
                409,
                JSON.stringify({
                    message: inner_error.message,
                    ...inner_error.data,
                })
            );
        else
            err = new HttpError(
                inner_error.message,
                500,
                JSON.stringify(inner_error.data)
            );
        throw err;
    }
}

async function getOne(model_schema, id) {
    const op = `get${model_schema.name}`;
    const result = await API.graphql(graphqlOperation(queries[op], { id: id }));
    const item = result.data[op];
    return item;
}

async function deleteOne(model_schema, id) {
    const op = `delete${model_schema.name}`;
    const result1 = await getOne(model_schema, id);
    const mutation = mutations[op];
    const result2 = await API.graphql(
        graphqlOperation(mutation, {
            input: { id: id, _version: result1._version },
        })
    );
    const item = result2.data[op];
    return item;
}

// need to handle paging via nextToken, startingAt protocol
async function listAll(model_schema) {
    const op = `list${model_schema.pluralName}`;
    const result = await API.graphql(graphqlOperation(queries[op]));
    const items = result.data[op].items;
    return items;
}

//
// data provider
//
export default (loggingEnabled = false) => {
    const models_schema = {};

    for (const value of Object.values(schema.models)) {
        models_schema[value['pluralName']] = value;
    }

    if (loggingEnabled)
        console.log('ds-provider: models_schema=', models_schema);

    async function getResponse(type, model_schema, params) {
        switch (type) {
            case 'getList': {
                let items = await listAll(model_schema);

                // (1) filter
                if (params.filter) {
                    items = filterItems(items, params.filter);
                }

                const count_items = items.length;

                if (count_items) {
                    const { field, order } = params.sort;
                    // (2) sort
                    if (field) {
                        const field_type = model_schema.fields[field]
                            ? model_schema.fields[field].type
                            : field === '_version'
                            ? 'Int'
                            : 'String';
                        if (sort_primers.hasOwnProperty(field_type))
                            items.sort(
                                sort_by(
                                    field,
                                    order === 'ASC' ? false : true,
                                    sort_primers[field_type]
                                )
                            );
                        else
                            items.sort(
                                sort_by(field, order === 'ASC' ? false : true)
                            );
                    }

                    // (3) paginate
                    const { page, perPage } = params.pagination;
                    if (page) {
                        items = paginate(items, perPage);
                        items = items[page - 1] ? items[page - 1] : null;
                    }
                }

                return {
                    data: items,
                    total: count_items,
                };
            }

            case 'getOne': {
                const item = await getOne(model_schema, params.id);
                return { data: item };
            }

            // would be better to send filter to backend; GraphQL supports that
            case 'getMany': {
                let items = await listAll(model_schema);
                items = filterItems(items, { id: params.ids });
                return { data: items };
            }

            // not tested
            case 'getManyReference': {
                let items = await listAll(model_schema);

                // (1) filter
                if (params.filter) {
                    const filter = {
                        ...params.filter,
                        [params.target]: params.id,
                    };
                    items = filterItems(items, filter);
                }

                const count_items = items.length;

                if (count_items) {
                    const { field, order } = params.sort;
                    // (2) sort
                    if (field) {
                        const field_type = model_schema.fields[field]
                            ? model_schema.fields[field].type
                            : field === '_version'
                            ? 'Int'
                            : 'String';
                        if (sort_primers.hasOwnProperty(field_type))
                            items.sort(
                                sort_by(
                                    field,
                                    order === 'ASC' ? false : true,
                                    sort_primers[field_type]
                                )
                            );
                        else
                            items.sort(
                                sort_by(field, order === 'ASC' ? false : true)
                            );
                    }

                    // (3) paginate
                    const { page, perPage } = params.pagination;
                    if (page) {
                        items = paginate(items, perPage);
                        items = items[page - 1] ? items[page - 1] : null;
                    }
                }

                return {
                    data: items,
                    total: count_items,
                };
            }

            case 'update': {
                const item = await updateOne(
                    model_schema,
                    params.id,
                    params.data
                );
                return { data: item };
            }

            // not done -- seems difficult given optimistic concurrency control
            // JSR this won't work since updateOne assumes that data has the original getOne Model in it...
            case 'updateMany': {
                await Promise.all(
                    params.ids.map(async id => {
                        await updateOne(model_schema, id, params.data);
                    })
                );
                return { data: params.ids };
            }

            case 'create': {
                const item = await create(model_schema, params.data);
                return { data: item };
            }

            case 'delete': {
                const deleted = await deleteOne(model_schema, params.id);
                return { data: deleted };
            }

            case 'deleteMany': {
                await Promise.all(
                    params.ids.map(async id => {
                        await deleteOne(model_schema, id);
                    })
                );
                return { data: params.ids };
            }

            default:
                return false;
        }
    }
    /**
     * @param {String} type One of the data Provider methods, e.g. 'getList'
     * @param {String} resource Name of the resource to fetch, e.g. 'posts'
     * @param {Object} params The data request params, depending on the type
     * @returns {Promise} The response
     */
    const handle = async (type, resource, params) => {
        let model_schema;

        if (!models_schema.hasOwnProperty(resource)) {
            return Promise.reject(new Error(`Undefined entity "${resource}"`));
        } else {
            model_schema = models_schema[resource];
        }

        let response;
        try {
            if (loggingEnabled) {
                console.log('handle enter:', type, resource, params);
            }
            response = await getResponse(type, model_schema, params);
        } catch (error) {
            if (loggingEnabled) {
                console.log('handle error:', error);
            }
            throw error;
        }

        if (loggingEnabled) {
            console.log('handle exit:', type, resource, params, response);
        }

        return response;
    };
    return {
        getList: (resource, params) => handle('getList', resource, params),
        getOne: (resource, params) => handle('getOne', resource, params),
        getMany: (resource, params) => handle('getMany', resource, params),
        getManyReference: (resource, params) => handle('getManyReference', resource, params),
        update: (resource, params) => handle('update', resource, params),
        updateMany: (resource, params) => handle('updateMany', resource, params),
        create: (resource, params) => handle('create', resource, params),
        delete: (resource, params) => handle('delete', resource, params),
        deleteMany: (resource, params) => handle('deleteMany', resource, params),
    };
};
