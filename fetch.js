'use strict';

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _lodash = require('lodash');

var _pluralize = require('pluralize');

var _pluralize2 = _interopRequireDefault(_pluralize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(_ref2) {
    var apiURL = _ref2.apiURL,
        contentType = _ref2.contentType,
        singleType = _ref2.singleType,
        jwtToken = _ref2.jwtToken,
        queryLimit = _ref2.queryLimit,
        params = _ref2.params,
        reporter = _ref2.reporter,
        loop = _ref2.loop;
    var apiBase, apiEndpoint, fetchRequestConfig, documents, response;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // Define API endpoint.
            apiBase = singleType ? apiURL + '/' + singleType : apiURL + '/' + (0, _pluralize2.default)(contentType);

            if (!(typeof loop === 'number')) {
              _context.next = 3;
              break;
            }

            return _context.abrupt('return', fetchLoop(reporter, apiBase, queryLimit, params, loop));

          case 3:
            apiEndpoint = apiBase + '?_limit=' + queryLimit;


            reporter.info('Starting to fetch data from Strapi - ' + apiEndpoint);

            // Set authorization token
            fetchRequestConfig = {};

            if (jwtToken !== null) {
              fetchRequestConfig.headers = {
                Authorization: 'Bearer ' + jwtToken
              };
            }

            // Make API request.
            _context.next = 9;
            return (0, _axios2.default)(apiEndpoint, fetchRequestConfig);

          case 9:
            documents = _context.sent;


            // Make sure response is an array for single type instances
            response = Array.isArray(documents.data) ? documents.data : [documents.data];

            // Map and clean data.

            return _context.abrupt('return', response.map(function (item) {
              return clean(item);
            }));

          case 12:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();

var fetchLoop = function () {
  var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(reporter, apiEndpoint, queryLimit, params, loop) {
    var resultsAggreg = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : [];

    var _start = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;

    var _ref4, data, newlyFetched, newResults;

    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            reporter.info('Loop fetching from ' + _start + ' - ' + apiEndpoint);
            _context2.next = 3;
            return (0, _axios2.default)({
              url: apiEndpoint,
              params: (0, _extends3.default)({}, params || {}, {
                _limit: loop,
                _start: _start
              })
            });

          case 3:
            _ref4 = _context2.sent;
            data = _ref4.data;
            newlyFetched = (0, _lodash.castArray)(data).map(clean);
            newResults = resultsAggreg.concat(newlyFetched);

            if (!(newlyFetched.length < loop || newResults.length >= queryLimit)) {
              _context2.next = 10;
              break;
            }

            reporter.info('Loop fetching ended with ' + newResults.length + ' items - ' + apiEndpoint);
            //ended
            return _context2.abrupt('return', newResults);

          case 10:
            return _context2.abrupt('return', fetchLoop(reporter, apiEndpoint, queryLimit, params, loop, newResults, _start + loop));

          case 11:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function fetchLoop(_x2, _x3, _x4, _x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();

/**
 * Remove fields starting with `_` symbol.
 *
 * @param {object} item - Entry needing clean
 * @returns {object} output - Object cleaned
 */
var clean = function clean(item) {
  (0, _lodash.forEach)(item, function (value, key) {
    if ((0, _lodash.startsWith)(key, '__')) {
      delete item[key];
    } else if ((0, _lodash.startsWith)(key, '_')) {
      delete item[key];
      item[key.slice(1)] = value;
    } else if ((0, _lodash.isObject)(value)) {
      item[key] = clean(value);
    }
  });

  return item;
};