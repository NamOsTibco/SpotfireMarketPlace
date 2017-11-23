'use strict';
var dataProvider = require('../data/getAssetDetails.js');
var Logger = require('./../util/logger');

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


    Logger.log(Logger.LOG_INFO, "**************************************");
    Logger.log(Logger.LOG_INFO, "*** Req URL : " + JSON.stringify(req.headers));
    Logger.log(Logger.LOG_INFO, "*** Req parsedUrl : " + JSON.stringify(req._parsedUrl));
    Logger.log(Logger.LOG_INFO, "**************************************");

    //liveAppsServices.performLogin();


    var apiUrl = '/case/cases?$filter=applicationId eq 740 and typeId eq 1&%24sandbox=31&%24search=Provision';
    var response = liveAppsServices.doGetCase(apiUrl);

    console.log("**********************************");
    console.log("Response :  " + JSON.stringify(response, null, 2));
    console.log("**********************************");

    var data = { "responses": [] };

    for (var i = 0; i < response.length; i++) {
        //TODO make this more performant
        var curAsset = response[i].casedata.Asset;
        curAsset.caseReference = response[i].caseReference;

        //TODO add req.hostname + req.path
        //curAsset.ImplementationFile = "https://eu-west-1.integration.cloud.tibcoapps.com/sm5q2ml2hdharerbhmr6i2mawodtciri/getAssetFile";
        //curAsset.ImplementationFile = req.hostname + ":"  + req.socket.localPort + req.path + "/getAssetFile";
        
        data.responses.push(curAsset);
    }

    console.log("OooooOOO");

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
