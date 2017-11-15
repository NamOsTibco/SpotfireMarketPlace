'use strict';

var Http = require('http');
var Express = require('express');
var BodyParser = require('body-parser');
var Swaggerize = require('swaggerize-express');
var Path = require('path');
var Cors = require('cors');
var Logger = require('./util/logger');

var corsOptions = {};

var App = Express();

var Server = Http.createServer(App);

App.use(Cors(corsOptions));
App.use(BodyParser.json());
App.use(BodyParser.urlencoded({
    extended: true
}));

App.use(Swaggerize({
    api: Path.resolve('./config/swagger.json'),
    handlers: Path.resolve('./handlers')
}));

App.use(Express.static('public'))

Server.listen(8000, function () {
    App.swagger.api.host = this.address().address + ':' + this.address().port;
    /* eslint-disable no-console */
    Logger.log(Logger.LOG_INFO, `App running on ${this.address().address}:${this.address().port}`);
    /* eslint-disable no-console */
});
