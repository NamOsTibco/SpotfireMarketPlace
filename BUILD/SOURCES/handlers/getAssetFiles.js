'use strict';
var dataProvider = require('../data/getAssetFiles.js');

var liveAppsServices = require('../services/liveAppsServices.js');

var axios = require("axios");

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
   */
  get: function getGetAssetFiles(req, res, next) {
    /**
     * Get the data for response 200
     * For response `default` status 200 is used.
     */
    
    liveAppsServices.performLogin();


    var apiUrl = '/webresource/rest/folders/cases/64411/artifacts/?$sandbox=31';
    var response = liveAppsServices.doGetJson(apiUrl);

    console.log("**********************************");
    console.log("Response :  " + JSON.stringify(response, null, 2));
    console.log("**********************************");

    var data = { "responses": [] };

    data.responses.push(response);


    var status = 200;
    var provider = dataProvider['get']['200'];

    res.status(status).send(data && data.responses);

  }
};
