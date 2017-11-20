'use strict';
var dataProvider = require('../data/getAssetFile.js');

var liveAppsServices = require('../services/liveAppsServices.js');

var axios = require("axios");

/**
 * Operations on /getAssetFile
 */
module.exports = {
  /**
   * summary: 
   * description: 
   * parameters: 
   * produces: application/json
   * responses: 200
   */
  get: function getGetAssetFile(req, res, next) {
    /**
     * Get the data for response 200
     * For response `default` status 200 is used.
     */
    
    liveAppsServices.performLogin();


    var apiUrl = '/webresource/folders/64411/31/createPage.py?$download=true';
    var response = liveAppsServices.doGet(apiUrl);

    console.log("**********************************");
    console.log("Response :  " + JSON.stringify(response, null, 2));
    console.log("**********************************");

    var data = { "responses": [] };

  


    var status = 200;
    var provider = dataProvider['get']['200'];

    res.status(status).send(data && response);

  }
};
