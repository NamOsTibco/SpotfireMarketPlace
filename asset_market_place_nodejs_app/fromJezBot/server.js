var restify = require('restify');
var builder = require('botbuilder');
var https = require('https');
var request = require('sync-request');

// ----------------------------------------------------------
// Config
// ----------------------------------------------------------

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

// Luis Config params
var luisUrl = process.env.luis_url || process.env.LUIS_URL || 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/069e0029-4504-423b-afd1-ca0bc26c0d8b?subscription-key=b64ecfd4a6554c6ba8f5e07742891ca8&verbose=true&timezoneOffset=0&q=';

// ----------------------------------------------------------
// Setup
// ----------------------------------------------------------

// Setup Restify Server
var server = restify.createServer();
//server.listen(process.env.port || process.env.PORT || 3978, function () {
server.listen(3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat bot
// App Id and PW generate on MS bot framework site. Then set in azure as app properties.

var chatConnector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// this tells the bot to listen on the chatConnector channel for messages
server.post('/api/messages', chatConnector.listen());

// this creates the chatBot instance
var chatBot = new builder.UniversalBot(chatConnector);

// Set so that we format for webchat when using the emulator
var emulatorDefaultType = 'webchat';

// the recognizer handles sending the chat messages to luis
var recognizer = new builder.LuisRecognizer(luisUrl);

// ----------------------------------------------------------
// Intents and Dialogs
// ----------------------------------------------------------

// Bots Dialogs
// this is linking the luis recognizer to the intents
var intents = new builder.IntentDialog({ recognizers: [recognizer] });

// Set all the intents to point to the correct dialogs
// First parameter is intent that luis knows about, second parameter is the dialog handler
intents.matches('Welcome', '/welcome');
intents.matches('Assist', '/assist');
intents.matches('Status', '/status');
intents.matches('Help', '/help');

// configure the chatBot with the intents
chatBot.dialog('/', intents);

// ?? this appears to tell it to run these dialogs if you click a button
chatBot.beginDialogAction('welcome', '/welcome');
chatBot.beginDialogAction('assist', '/assist');
chatBot.beginDialogAction('status', '/status');
chatBot.beginDialogAction('help', '/help');

// this will be triggered when we don't recognise the user input
intents.onDefault([
    function (session, results) {
            session.beginDialog('/welcome');
    }
]);

// this is a waterfall dialog - so basically when this dialog is executed each function runs in order - expecting a response between each function. If you do endDialog thats the end of the waterfall.
chatBot.dialog('/assist', [
    function (session, results, next) {
        if (!session.userData.clientType) {
            // MS: emulator, webchat
            // Facebook: facebook
            // Skype: skype
            session.userData.clientType = session.message.source;
            console.log('Client type detected as ' + session.userData.clientType);
            if (session.userData.clientType == 'emulator') {
                session.userData.clientType = emulatorDefaultType;
            }
        }

        // make sure we can login before we offer to create a case!
        
        // now login
        session.userData.loginDetails = performLogin();
        if (session.userData.loginDetails.errorCode != 200) {
            session.endDialog("Apologies - I am unable to do that for you right now. Please try again later");
        }
        var displayName = session.userData.loginDetails.firstName + ' ' + session.userData.loginDetails.lastName;


        // Next triggers the next function in the waterfall without waiting for a response
        // Send typing gives the ... message so the user knows the bot is doing something
            session.sendTyping();
            next();
    },
    function (session, results, next) {
        // Ask whether to create an assistance case request
        session.dialogData.description = results.response;
        var caseStartOptions = ['Yes', 'No'];
        builder.Prompts.choice(session, "We are sorry to hear that you have not received the service you expected. We would really like to resolve this issue for you - would you be happy for an agent to contact you to resolve this matter?", caseStartOptions, { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        if (!results.response) {
            session.endDialog('???');
        } else {
            switch (results.response.index) {
                case 0:
                    session.dialogData.caseStartOptions = 'Yes';
                    break;
                case 1:
                    session.dialogData.caseStartOptions = 'No';
                    break;
                default:
                    session.endDialog('Agent contact cancelled.');
                    break;
            }
            if (session.dialogData.caseStartOptions == 'Yes') {
                // get full name
                builder.Prompts.text(session, "OK I need to collect some information about your issue first - if at any point you want to cancel this request - just type 'stop'. What is your full name?");
            } else {
                session.endDialog('Ok sorry to trouble you, have a nice day');
            }
        }
    },
    function (session, results) {
        if (!results.response) {
            session.endDialog('???');
        } else {
            session.dialogData.fullName = results.response;
            session.send('Thanks ' + session.dialogData.fullName);
            builder.Prompts.text(session, "Can I take a contact email address or phone number please?");
        }
    },
    function (session, results) {
        if (!results.response) {
            session.endDialog('???');
        } else {
            session.dialogData.contact = results.response;
            builder.Prompts.number(session, "Please provide a reference number for your order");
        }
    },
    function (session, results) {
        if (!results.response) {
            session.endDialog('???');
        } else {
            session.dialogData.reference = results.response;

            // select an issue type
            var issueTypeOptions = ['Faulty Product', 'Wrong Product', 'Customer Service', 'Billing', 'Other'];
            builder.Prompts.choice(session, "Please select an issue type", issueTypeOptions, { listStyle: builder.ListStyle.button });
        }
    },
    function (session, results) {
        if (!results.response) {
            session.endDialog('???');
        } else {
            switch (results.response.index) {
                case 0:
                    session.dialogData.issueType = 'Faulty Product';
                    break;
                case 1:
                    session.dialogData.issueType = 'Wrong Product';
                    break;
                case 2:
                    session.dialogData.issueType = 'Customer Service';
                    break;
                case 3:
                    session.dialogData.issueType = 'Billing';
                    break;
                case 4:
                    session.dialogData.issueType = 'Other';
                    break;
                default:
                    session.endDialog('Agent contact cancelled.');
                    break;
            }
            if (session.dialogData.issueType != undefined) {
                // get full name
                builder.Prompts.text(session, "OK -  can you provide a title/summary for your issue? You will be able to provide a more detailed description after...");
            }
            //session.send('You said ' + session.dialogData.caseStartOptions);
        }
    },
    function (session, results) {
        if (!results.response) {
            session.endDialog('???');
        } else {
            session.dialogData.summary = results.response;
            builder.Prompts.text(session, "Ok now can you enter a more detailed description about the problem?");
        }
    },
    function (session, results) {
        if (!results.response) {
            session.endDialog('???');
        } else {
            session.dialogData.description = results.response;
            // Display a summary of what is doing to be created and primpt the user
            // to confirm it is OK
            //if (session.userData.clientType == 'webchat') {
            // for some reason the emulator isnt detected as webchat
            if (session.userData.clientType == 'webchat') {
                var createFacts = [];
                createFacts.push(builder.Fact.create(session, session.dialogData.fullName, 'Full Name'));
                createFacts.push(builder.Fact.create(session, session.dialogData.contact, 'Contact'));
                createFacts.push(builder.Fact.create(session, session.dialogData.reference, 'Reference'));
                createFacts.push(builder.Fact.create(session, session.dialogData.issueType, 'Issue Type'));
                createFacts.push(builder.Fact.create(session, session.dialogData.summary, 'Summary'));
                createFacts.push(builder.Fact.create(session, session.dialogData.description, 'Description'));
                
                var caseCard = new builder.ReceiptCard(session).title('Create Case').facts(createFacts);
                msg = new builder.Message(session).addAttachment(caseCard);
            } else {
                var msgTxt = '**Create Case** \n';
                msgTxt += '* Description: ' + session.dialogData.description + ' \n';
                msg = new builder.Message(session).textFormat('markdown').text(msgTxt);
            }
            session.send(msg);
            builder.Prompts.confirm(session, 'Create this case?', { listStyle: builder.ListStyle.button });

        }
    },
    function (session, results, next) {
        if (!results.response) {
            session.endDialog('Agent contact cancelled. Let me know if you change your mind!');
        } else {
            session.sendTyping();
			// Go ahead and create the case
            next();
        }
    },
    function (session, results, next) {
        // Make calls to create the case - due to no createCase API at present we have to run a case creator process and handle submitting the form.
        if (createAssistanceCase(session.dialogData.reference, session.dialogData.fullName, session.dialogData.contact, session.dialogData.issueType, session.dialogData.summary, session.dialogData.description, session.userData.loginDetails.cookie)) {
            next();
        } else {
            // couldnt create a case
            session.endDialog("Apologies - I am unable to do that for you right now. Please try again later");
        }  
    },
    function (session, results, next) {
            session.send('I have created a case '+ session.dialogData.reference + ' to handle your concern. We will be in touch shortly.');
        session.endDialog();
    }
]).endConversationAction(
    // This is an endConversation action which can be triggered at any time to stop this dialog.
    "endAssistance", "Ok, let me know if you change your mind!", {
    matches: /^stop$/i,
    confirmPrompt: "Are you sure you want to cancel this request?"
}
);

chatBot.dialog('/status', [
    function (session, args, next) {
        // Save off the client type
        if (!session.userData.clientType) {
            // MS: emulator, webchat
            // Facebook: facebook
            // Skype: skype
            session.userData.clientType = session.message.source;
            if (session.userData.clientType == 'emulator') {
                session.userData.clientType = emulatorDefaultType;
            }
        }

        // make sure we can login before we offer to create a case
        // now login
        session.userData.loginDetails = performLogin();
        if (session.userData.loginDetails.errorCode != 200) {
            session.endDialog("Apologies - I am unable to do that for you right now. Please try again later");
        }

        // we might get passed the reference if luis understood the intent and entities
        var referenceId = null;
        if (args && args.entities) {
            entityTaskId = builder.EntityRecognizer.findEntity(args.entities, 'ReferenceId');
        }
        if (referenceId == null) {
            // we didnt get the reference so ask for it
            // Next triggers the next function in the waterfall without waiting for a response
            // Send typing gives the ... message so the user knows the bot is doing something
            builder.Prompts.number(session, "request status: OK please give me your request reference");
        }
    },
    function (session, results, next) {
        // Get status and respond
        session.dialogData.requestId = results.response;
        if (session.dialogData.requestId == undefined || session.dialogData.requestId == '' ) {
            session.send('Request status check cancelled. Let me know if you change your mind!');
            session.endDialog();
        } else {
            session.beginDialog('getMatchingCases', session.dialogData.requestId);
        }
        session.send('Thanks for using the Live Apps Chat Bot');
        session.endDialog();
    }
]).endConversationAction(
    // This is an endConversation action which can be triggered at any time to stop this dialog.
    "endAssistance", "Ok, let me know if you change your mind!", {
        matches: /^stop$/i,
        confirmPrompt: "Are you sure you want to cancel this request?"
    }
);

// This is called as a utility dialog by the status dialog
chatBot.dialog('getMatchingCases', [
    function (session, requestId, next) {
        session.send("Just checking those cases...");
        var cases = getMatchingCases(requestId, session.userData.loginDetails.cookie);
        if (cases.length == 0) {
            session.endDialog("Sorry I couldnt find any matching cases");
        }
        else if (cases.length == 1) {
            session.send('OK I found your case. The status is: ' + cases[0].status);
        }
        else if (cases.length > 1) {
            session.send('I found multiple cases');        
            var caseFacts = [];
            for (var x = 0; x < cases.length; x++) {
                //caseFacts.push(builder.Fact.create(session, cases[x].name, cases[x].reference, cases[x].caseType, cases[x].status));
                caseFacts.push(builder.Fact.create(session, cases[x].status, cases[x].reference + ': ' + cases[x].name));
            }
            var caseCard = new builder.ReceiptCard(session).title('Case Status').facts(caseFacts);
            msg = new builder.Message(session).addAttachment(caseCard);
            session.endDialog(msg);
        }
    }
])

chatBot.dialog('/welcome', function (session, args, next) {
    // Save off the client type
    if (!session.userData.clientType) {
        // MS: emulator, webchat
        // Facebook: facebook
        // Skype: skype
        session.userData.clientType = session.message.source;
        if (session.userData.clientType == 'emulator') {
            session.userData.clientType = emulatorDefaultType;
        }
    }
    var card = new builder.HeroCard(session)
            .title('Welcome to the Customer Service Bot')
            .subtitle('Powered by Tibco Live Apps')
            .images([
                builder.CardImage.create(session, 'https://s3.amazonaws.com/applogosjezrsmith/tibco-logo-620x360.jpg')
            ])
            .buttons([
                builder.CardAction.dialogAction(session, 'welcome', '', 'Welcome'),
                builder.CardAction.dialogAction(session, 'assist', '', 'Request Assistance'),
                builder.CardAction.dialogAction(session, 'status', '', 'Check Request Status'),
                builder.CardAction.openUrl(session, 'https://eu.liveapps.cloud.tibco.com/apps/case-app/index.html', 'Open Case Manager'),
				builder.CardAction.dialogAction(session, 'help', '', 'Help')
				
            ]);
    var msg = new builder.Message(session).addAttachment(card);
    session.send(msg);
    session.endDialog();
});

chatBot.dialog('/help', function (session, args, next) {
    // Save off the client type
    if (!session.userData.clientType) {
        // MS: emulator, webchat
        // Facebook: facebook
        // Skype: skype
        session.userData.clientType = session.message.source;
        if (session.userData.clientType == 'emulator') {
            session.userData.clientType = emulatorDefaultType;
        }
    }

    var card = new builder.HeroCard(session)
        .title('Help')
        .subtitle('I can help you with these activities')
        .buttons([
            builder.CardAction.dialogAction(session, 'assist', '', 'Request Assistance'),
        ]);

    var msg = new builder.Message(session).addAttachment(card);
    session.endDialog(msg);
});



// ----------------------------------------------------------
// Live Apps API Calls
// ----------------------------------------------------------

function performLogin() {
    var loginDetails = {
        login: liveAppsUser,
        password: liveAppsPw,
		cookie: null,
		claims: null,
		firstName: '',
		lastName: '',
		errorCode: 200,
		errorMsg: ''
	};
	// Get OAuth Token from Tibco Accounts
    var requestUrl = tibcoAccountUrl + '/as/token.oauth2?username=' + loginDetails.login
		+ '&password=' + loginDetails.password + '&client_id=ropc_ipass&grant_type=password';
	var resSSO = request('POST', requestUrl, {
		'headers': {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	});
	console.log('OAuth Token Request Status Code = ' + resSSO.statusCode);
	if( resSSO.statusCode != 200 ) {
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
	if( resOAuth.statusCode != 200 ) {
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

    // Load the claims for this user
    var requestUrl = liveAppsUrl + '/organisation/claims/';
    var resClaims = request('GET', requestUrl, {
		'headers': {
			'Content-Type': 'application/json',
			'Cookie': loginDetails.cookie
		}
	});
	console.log('Get Claims Status Code = ' + resClaims.statusCode);
	if( resClaims.statusCode != 200 ) {
		loginDetails.errorCode = resOAuth.statusCode;
		loginDetails.errorMsg = resOAuth.body.toString('utf-8');
		console.log('Failed to get Claims: ' + loginDetails.errorMsg);
		return loginDetails;
	}
	console.log('Claims: ' + resClaims.body.toString('utf-8'));
	loginDetails.claims = JSON.parse(resClaims.body.toString('utf-8'));

	return loginDetails;
}

function getMatchingCases(requestRef, cookie) {
    var cases = [];
    // Make call to find matching cases

    var options = {
        'headers': {
            'Content-Type': 'application/json',
            'Cookie': cookie
        }
    };
    var requestUrl = liveAppsUrl + '/case/cases?$sandbox=' + sandboxId + '&$filter=applicationId eq ' + 193 + ' and typeId eq 1&$select=caseReference, summary&$skip=0&$top=5&$search=' + requestRef;

    var res = request('GET', requestUrl, options);
    if (res.statusCode == 419) {
        // Session has timed out - need to login again
        console.log('Failed to start process, timeout ');
        return (false);
    }
    if (res.statusCode != 200) {
        console.log('Failed to start process, error: ' + res.body.toString('utf-8'));
        return (false);
    }
    if (res.statusCode == 200) {
        // ok now enter data and submit the task
        // parse the response
        //var responseText = JSON.stringify(res.body.toString('utf-8'));
        var response = JSON.parse(res.body.toString('utf-8'));
        //console.log('Response: ' + responseText);

        for (var x = 0; x < response.length;x++) {
            //console.log('Case: ' + JSON.stringify(response[x]));
            var assistCase = {}
            assistCase.caseRef = response[x].caseReference;
            var summary = JSON.parse(response[x].summary);
            assistCase.name = summary.Name_v1;
            assistCase.reference = summary.Reference_v1;
            assistCase.caseType = summary.Type_v1;
            assistCase.status = summary.state;
            cases.push(assistCase);
        }   
        return cases;
    }

}

function createAssistanceCase(reference, fullName, contact, issueType, summary, description, cookie) {
    // Make calls to create the case - due to no createCase API at present we have to run a case creator process and handle submitting the form.

    //Start the case creator process for create complaint
    // You can get these details by using firebug when you create a case creator in Case Manager UI
    var payload = {};
    payload.id = liveAppsCreatorId;
    payload.name = 'EnterComplaint1';
    payload.label = 'Enter Complaint';
    payload.version = liveAppsAppVersion;
    payload.applicationId = liveAppsAppId;
    payload.applicationName = 'CustomerComplaint1';
    payload.activityId = liveAppsActivityId;
    payload.activityName = 'Task';
    payload.roles = [];

    var options = {
        'headers': {
            'Content-Type': 'application/json',
            'Cookie': cookie
        },
        'body': JSON.stringify(payload)
    };

    var requestUrl = liveAppsUrl + '/pageflow/start?$sandbox=' + sandboxId;
    var res = request('POST', requestUrl, options);
    if (res.statusCode == 419) {
        // Session has timed out - need to login again
        console.log('Failed to start process, timeout ');
        return (false);
    }
    if (res.statusCode != 200) {
        console.log('Failed to start process, error: ' + res.body.toString('utf-8'));
        return (false);
    }
    if (res.statusCode == 200) {
        // ok now enter data and submit the task
        // parse the response
        var response = JSON.parse(res.body.toString('utf-8'));
        console.log('Returned body: ' + res.body.toString('utf-8'));

        // set data

        var payload = {};
        var complaint = [];
        var referenceObj = {};
        referenceObj.op = 'add';
        referenceObj.path = '/Reference_v1/';
        referenceObj.rank = 0;
        referenceObj.value = reference;
        complaint.push(referenceObj);

        var nameObj = {};
        nameObj.op = 'add';
        nameObj.path = '/Name_v1/';
        nameObj.rank = 3;
        nameObj.value = fullName;
        complaint.push(nameObj);

        var contactObj = {};
        contactObj.op = 'add';
        contactObj.path = '/Contact_v1/';
        contactObj.rank = 4;
        contactObj.value = contact;
        complaint.push(contactObj);

        var issueTypeObj = {};
        issueTypeObj.op = 'add';
        issueTypeObj.path = '/Type_v1/';
        issueTypeObj.rank = 5;
        issueTypeObj.value = issueType;
        complaint.push(issueTypeObj);

        var summaryObj = {};
        summaryObj.op = 'add';
        summaryObj.path = '/Summary_v1/';
        summaryObj.rank = 6;
        summaryObj.value = summary;
        complaint.push(summaryObj);

        var descriptionObj = {};
        descriptionObj.op = 'add';
        descriptionObj.path = '/Description_v1/';
        descriptionObj.rank = 7;
        descriptionObj.value = description;
        complaint.push(descriptionObj);

        // Data is actually a JSON string inside this JSON payload
        var data = {};
        data.CustomerComplaint1 = complaint;
        payload.data = JSON.stringify(data);

        payload.id = response.id;

        payloadString = JSON.stringify(payload);

        console.log('Sending case info as : ' + payloadString);
        //var reqBody = { payload: payload };

        //var caseInfo = bpmRestCall(session.userData.loginDetails.auth, requestUrl, reqBody);
        var options = {
            'headers': {
                'Content-Type': 'application/json',
                'Cookie': cookie
            },
            'body': payloadString
        };
        var requestUrl = liveAppsUrl + '/pageflow/update?$sandbox=' + sandboxId;
        var res = request('POST', requestUrl, options);
        if (res.statusCode == 419) {
            // Session has timed out - need to login again
            console.log('Failed to start process, timeout ');
            return (false);
        }
        if (res.statusCode != 200) {
            console.log('Failed to start process, error: ' + res.body.toString('utf-8'));
            return false;
        }
        if (res.statusCode == 200) {
            return true;
        }

    }
    // shouldnt ever get here!
    return false;
}