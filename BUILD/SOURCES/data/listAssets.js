'use strict';
var Mockgen = require('./mockgen.js');
/**
 * Operations on /listAssets
 */
module.exports = {
    /**
     * summary: 
     * description: 
     * parameters: 
     * produces: application/json
     * responses: 200
     * operationId: getGetAssets
     */
    get: {
        200: function (req, res, callback) {
            /**
             * Using mock data generator module.
             * Replace this by actual data for the api.
             */
            Mockgen().responses({
                path: '/listAssets',
                operation: 'get',
                response: '200'
            }, callback);
        }
    }
};
