'use strict';
var dataProvider = require('../data/getAssetDetails.js');

var liveAppsServices = require('../services/liveAppsServices.js');

var axios = require("axios");

/**
 * Operations on /getAssetDetails
 */
module.exports = {
  /**
   * summary: 
   * description: 
   * parameters: 
   * produces: application/json
   * responses: 200
   */
  get: function getGetAssetDetails(req, res, next) {
    /**
     * Get the data for response 200
     * For response `default` status 200 is used.
     */




    liveAppsServices.performLogin();


    var apiUrl = '/case/cases?$filter=applicationId eq 740 and typeId eq 1&%24sandbox=31';
    var response = liveAppsServices.doGet(apiUrl);

    console.log("**********************************");
    console.log("Response :  " + JSON.stringify(response, null, 2));
    console.log("**********************************");

    var data = { "responses": [] };

    for (var i = 0; i < response.length; i++) {
        data.responses.push(response[i].casedata.Asset);
    }

   

    /*data ={ "responses" : [{
        "name" : "Simple Page layout Template 1",
        "description" : "Simple Page layout Template 1",
        "icon" : "layout1.png",
        "category" : "Template",
        "subcategory" : "",
        "tags" : [],
        "date" : "10/10/2017",
        "author" : "NamOs",
        "version" : "1.0"	,
        "imageDesc" : "layout1.png",
        "implementationType" : "PYTHON",
        "like" : 1,
        "implementationFile" : "http://localhost:8888/spotfireFramework/customLibs/ironPythonLib/templateLayout1.py"
      }]};*/



    var status = 200;
    var provider = dataProvider['get']['200'];

    res.status(status).send(data && data.responses);

  }
};
