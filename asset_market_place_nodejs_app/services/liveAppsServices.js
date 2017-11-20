
'use strict';

var https = require('https');
var request = require('sync-request');


/*
** Configuration to MOVE / REFACTOR
*/
//TODO refactor config

// LiveApps Config params
var liveAppsUser = process.env.LIVEAPPSUSER || 'segliveapps@outlook.com';
var liveAppsPw = process.env.LIVEAPPSPW || 'Tibco123.';
var tibcoAccountUrl = process.env.TIBCOACCOUNTURL || 'https://sso-ext.tibco.com';
var liveAppsUrl = process.env.LIVEAPPSURL || 'https://eu.liveapps.cloud.tibco.com:443';

// LiveApps App Config
var sandboxId = process.env.SANDBOXID || '31';
var liveAppsAppId = process.env.LIVEAPPSAPPID || 193;
var liveAppsAppVersion = process.env.LIVEAPPSAPPVERSION || 3;
var liveAppsCreatorId = process.env.LIVEAPPSCREATORID || 908;
var liveAppsActivityId = process.env.LIVEAPPSACTIVITYID || 'Z83CGdFT4Eeec68g_fwbarg';



/*
** Implementation
*/


var loginDetails = {
	login: liveAppsUser,
	password: liveAppsPw,
	cookie: null,
	firstName: '',
	lastName: '',
	errorCode: 200,
	errorMsg: ''
};

module.exports = {
	/*
	** Perform Login and retrieve cookie
	*/
	performLogin: function performLogin() {

		// Get OAuth Token from Tibco Accounts
		var requestUrl = tibcoAccountUrl + '/as/token.oauth2?username=' + loginDetails.login
			+ '&password=' + loginDetails.password + '&client_id=ropc_ipass&grant_type=password';
		var resSSO = request('POST', requestUrl, {
			'headers': {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		});
		console.log('OAuth Token Request Status Code = ' + resSSO.statusCode);
		if (resSSO.statusCode != 200) {
			loginDetails.errorCode = resSSO.statusCode;
			loginDetails.errorMsg = resSSO.body.toString('utf-8');
			console.log('Failed to get OAuth Token: ' + loginDetails.errorMsg);
			return loginDetails;
		}
		var resSSOObject = JSON.parse(resSSO.body.toString('utf-8'));
		console.log('Access Token: ' + resSSOObject.access_token);

		// Now make the call to lofin with the OAuth token
		var requestUrl = liveAppsUrl + '/idm/v1/login-oauth';
		var resOAuth = request('POST', requestUrl, {
			'headers': {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			'body': 'TenantId=BPM&AccessToken=' + resSSOObject.access_token
		});
		console.log('OAuth Login Status Code = ' + resOAuth.statusCode);
		if (resOAuth.statusCode != 200) {
			loginDetails.errorCode = resOAuth.statusCode;
			loginDetails.errorMsg = resOAuth.body.toString('utf-8');
			console.log('Failed to OAuth login: ' + loginDetails.errorMsg);
			return loginDetails;
		}
		// Save off the cookie, that will be required later
		loginDetails.cookie = resOAuth.headers['set-cookie'];
		console.log(resOAuth.body.toString('utf-8'));
		var authDetails = JSON.parse(resOAuth.body.toString('utf-8'));
		loginDetails.firstName = authDetails.firstName;
		loginDetails.lastName = authDetails.lastName;


		return loginDetails;
	},


	/*
	** Clean version informations (_vX strings)
	*/
	doCleanResponse: function doCleanResponse(stringObj) {
		//Remove any version suffix
		stringObj = stringObj.replace(/_v./g, "");
		//TODO not sure necessary
		stringObj = stringObj.replace(/\n/g, "");

		console.log("**********************************");
		console.log("stringObj :  " + stringObj);
		console.log("**********************************");
		console.log("**********************************");

		return JSON.parse(stringObj);
	},

	doGet: function doGet(apiUrl) {
		// Load the claims for this user
		var requestUrl = liveAppsUrl + apiUrl;
		console.log("**********************************");
		console.log("Request to be done : " + requestUrl);
		console.log("**********************************");

		var curRequest = request('GET', requestUrl, {
			'headers': {
				'Content-Type': 'application/json',
				'Cookie': loginDetails.cookie
			}
		});
		console.log('request Status Code = ' + curRequest.statusCode);
		if (curRequest.statusCode != 200) {
			loginDetails.errorCode = resOAuth.statusCode;
			loginDetails.errorMsg = resOAuth.body.toString('utf-8');
			console.log('Failed to request apiURL(' + apiURL + '): ' + loginDetails.errorMsg);
			return loginDetails;
		}
		console.log('Request Response: ' + curRequest.body.toString('utf-8'));

		

		return (curRequest.body.toString('utf-8'));
	},

	doGetJson: function doGetJson(apiUrl) {
		
		 var response = this.doGet(apiUrl);
		 var responseObj = JSON.parse(response);


		return (responseObj);
	},

	doGetCase: function doGetCase(apiUrl) {
		
		 var responseObj = this.doGetJson(apiUrl);

		for (var i = 0; i < responseObj.length; i++) {
			//TODO refactor curObject to reduce access=> performance
			responseObj[i].casedata = this.doCleanResponse(responseObj[i].casedata);
			responseObj[i].summary = this.doCleanResponse(responseObj[i].summary);
		}

		return (responseObj);
	}

};