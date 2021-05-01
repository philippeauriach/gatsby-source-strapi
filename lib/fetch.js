'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _axios = _interopRequireDefault(require('axios'));

var _lodash = require('lodash');

module.exports = async (entityDefinition, ctx) => {
  const { apiURL, queryLimit, jwtToken, reporter } = ctx;
  const { endpoint, api, loop } = entityDefinition; // Define API endpoint.

  let apiBase = `${apiURL}/${endpoint}`;
  const requestOptions = {
    method: 'GET',
    url: apiBase,
    // Place global params first, so that they can be overriden by api.qs
    params: {
      _limit: queryLimit,
      ...(api === null || api === void 0 ? void 0 : api.qs),
    },
    headers: addAuthorizationHeader({}, jwtToken),
  };
  reporter.info(
    `Starting to fetch data from Strapi - ${apiBase} with params ${JSON.stringify(
      requestOptions.params
    )}`
  );

  try {
    if (typeof loop === 'number') {
      return fetchLoop(reporter, queryLimit, requestOptions, loop);
    }

    const { data } = await (0, _axios.default)(requestOptions);
    return (0, _lodash.castArray)(data).map(clean);
  } catch (error) {
    reporter.panic(`Failed to fetch data from Strapi`, error);
  }
};

const fetchLoop = async (
  reporter,
  queryLimit,
  requestOptions,
  loop,
  resultsAggreg = [],
  _start = 0
) => {
  reporter.info(`Loop fetching from ${_start} - ${requestOptions.url}`);
  const { data } = await (0, _axios.default)({
    ...requestOptions,
    params: { ...requestOptions.params, _limit: loop, _start },
  });
  const newlyFetched = (0, _lodash.castArray)(data).map(clean);
  const newResults = resultsAggreg.concat(newlyFetched);

  if (newlyFetched.length < loop || newResults.length >= queryLimit) {
    reporter.info(`Loop fetching ended with ${newResults.length} items - ${requestOptions.url}`); //ended

    return newResults;
  }

  return fetchLoop(reporter, queryLimit, requestOptions, loop, newResults, _start + loop);
};
/**
 * Remove fields starting with `_` symbol.
 *
 * @param {object} item - Entry needing clean
 * @returns {object} output - Object cleaned
 */

const clean = (item) => {
  (0, _lodash.forEach)(item, (value, key) => {
    if (key === `__v`) {
      // Remove mongo's __v
      delete item[key];
    } else if (key === `_id`) {
      // Rename mongo's "_id" key to "id".
      delete item[key];
      item.id = value;
    } else if ((0, _lodash.startsWith)(key, '__')) {
      // Gatsby reserves double-underscore prefixes – replace prefix with "strapi"
      delete item[key];
      item[`strapi_${key.slice(2)}`] = value;
    } else if ((0, _lodash.isObject)(value)) {
      item[key] = clean(value);
    }
  });
  return item;
};

const addAuthorizationHeader = (options, token) => {
  if (token) {
    (0, _lodash.set)(options, 'headers.Authorization', `Bearer ${token}`);
  }

  return options;
};
