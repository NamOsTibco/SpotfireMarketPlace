'use strict';
var Mockgen = require('./mockgen.js');
/**
 * Operations on /getAssetFile
 */
module.exports = {
    /**
     * summary: 
     * description: 
     * parameters: caseRef, sandBox, fileName
     * produces: application/json
     * responses: 200
     * operationId: getGetAssetFile
     */
    get: {
        200: function (req, res, callback) {
            /**
             * Using mock data generator module.
             * Replace this by actual data for the api.
             */
            Mockgen().responses({
                path: '/isOrgUser',
                operation: 'post',
                response: '200'
            }, callback);
        }
    }
};
