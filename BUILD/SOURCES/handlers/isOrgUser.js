'use strict';
var dataProvider = require('../data/isOrgUser.js');

var liveAppsServices = require('../services/liveAppsServices.js');

var axios = require("axios");

/**
 * Operations on /isOrgUser
 */
module.exports = {
  /**
   * summary: 
   * description: 
   * parameters: 
   * produces: application/json
   * responses: 200
   */
  get: function getIsOrgUser(req, res, next) {
      /**
       * Get the data for response 200
       * For response `default` status 200 is used.
       */
    
      

    var apiUrl = '/tsc-utd/v1/accounts/01BHEWGDNHCPGS8PYZMMGKBAMN/users';
    var response = liveAppsServices.doGetJson("account", apiUrl);

    console.log("**********************************");
    console.log("Response :  " + JSON.stringify(response, null, 2));
    console.log("**********************************");

    var isOrgUserFlag = false;
    var userEmail = req.query.email;

    console.log("******* Searching for userEmail : " + userEmail);

    var users = response.users;
    //TODO make this more performant with a while
    for (var i=0; i < users.length; i++) {
    //TODO can be more performant without assigning .. just debuggin now
        var user = users[i];
        console.log("UserEmail : " + user.email);
        if (user.email == userEmail){
          isOrgUserFlag = true;
        }
    }

    var data = { "isOrgUser": isOrgUserFlag.toString()};

  


    var status = 200;
    var provider = dataProvider['get']['200'];

    res.status(status).send(data && data);

  }
};
