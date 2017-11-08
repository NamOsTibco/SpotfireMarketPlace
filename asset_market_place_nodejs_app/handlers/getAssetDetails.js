'use strict';
var dataProvider = require('../data/getAssetDetails.js');
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




        var getCaseUrl = "https://eu.liveapps.cloud.tibco.com/case/cases?%24filter=applicationId%20eq%20740%20and%20typeId%20eq%201&%24sandbox=31";

        
        const url =
        "https://eu.liveapps.cloud.tibco.com/case/cases?%24filter=applicationId%20eq%20740%20and%20typeId%20eq%201&%24sandbox=31";
        
        axios
          .get(url)
          .then(response => {
            console.log(
              `Data: ${response.data.results[0]} -`
            );
          })
          .catch(error => {
            console.log(error);
          });


        var data ={ "responses" : [{
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
          }]};



        var status = 200;
        var provider = dataProvider['get']['200'];
 
            res.status(status).send(data && data.responses);

    }
};
