import axios from 'axios'
import { isObject, startsWith, forEach, castArray } from 'lodash'
import pluralize from 'pluralize'

module.exports = async ({
  apiURL,
  contentType,
  singleType,
  jwtToken,
  queryLimit,
  params,
  reporter,
  loop,
}) => {
  // Define API endpoint.
  let apiBase = singleType
    ? `${apiURL}/${singleType}`
    : `${apiURL}/${pluralize(contentType)}`

  if (typeof loop === 'number') {
    return fetchLoop(reporter, apiBase, queryLimit, params, loop)
  }

  const apiEndpoint = `${apiBase}?_limit=${queryLimit}`

  reporter.info(`Starting to fetch data from Strapi - ${apiEndpoint}`)

  // Set authorization token
  let fetchRequestConfig = {}
  if (jwtToken !== null) {
    fetchRequestConfig.headers = {
      Authorization: `Bearer ${jwtToken}`,
    }
  }

  // Make API request.
  const documents = await axios(apiEndpoint, fetchRequestConfig)

  // Make sure response is an array for single type instances
  const response = Array.isArray(documents.data)
    ? documents.data
    : [documents.data]

  // Map and clean data.
  return response.map(item => clean(item))
}

const fetchLoop = async (
  reporter,
  apiEndpoint,
  queryLimit,
  params,
  loop,
  resultsAggreg = [],
  _start = 0
) => {
  reporter.info(`Loop fetching from ${_start} - ${apiEndpoint}`)
  const { data } = await axios({
    url: apiEndpoint,
    params: {
      ...(params || {}),
      _limit: loop,
      _start,
    },
  })
  const newlyFetched = castArray(data).map(clean)
  const newResults = resultsAggreg.concat(newlyFetched)
  if (newlyFetched.length < loop || newResults.length >= queryLimit) {
    reporter.info(
      `Loop fetching ended with ${newResults.length} items - ${apiEndpoint}`
    )
    //ended
    return newResults
  }
  return fetchLoop(
    reporter,
    apiEndpoint,
    queryLimit,
    params,
    loop,
    newResults,
    _start + loop
  )
}

/**
 * Remove fields starting with `_` symbol.
 *
 * @param {object} item - Entry needing clean
 * @returns {object} output - Object cleaned
 */
const clean = item => {
  forEach(item, (value, key) => {
    if (startsWith(key, `__`)) {
      delete item[key]
    } else if (startsWith(key, `_`)) {
      delete item[key]
      item[key.slice(1)] = value
    } else if (isObject(value)) {
      item[key] = clean(value)
    }
  })

  return item
}
