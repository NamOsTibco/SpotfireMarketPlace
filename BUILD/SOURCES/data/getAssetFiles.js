'use strict';
var Mockgen = require('./mockgen.js');
/**
 * Operations on /getAssetFiles
 */
module.exports = {
    /**
     * summary: 
     * description: 
     * parameters: 
     * produces: application/json
     * responses: 200
     * operationId: getGetAssetFiles
     */
    get: {
        200: function (req, res, callback) {
            /**
             * Using mock data generator module.
             * Replace this by actual data for the api.
             */
            Mockgen().responses({
                path: '/getAssetFiles',
                operation: 'get',
                response: '200'
            }, callback);
        }
    }
};
