'use strict';

var path = require('path');
var http = require('http');

var oas3Tools = require('oas3-tools');
var serverPort = 8080;

// swaggerRouter configuration
var options = {
    deploySwaggerUi : true,
    routing: {
        controllers: path.join(__dirname, './controllers')
    },
    logging: {
        format: 'combined',
        dontReportStatusCodesBelow: 400
    },
    swaggerUiOptions: {
        apiDocsPath: '/api/rest',
        swaggerUIPath: '/api/rest-spec',
        swaggerUiDir: undefined
    }
};

var expressAppConfig = oas3Tools.expressAppBuilder(path.join(__dirname, 'api/petstore.yaml'),oas3Tools.optionsFromObject(options));
expressAppConfig.addValidator();
var app = expressAppConfig.getApp();

// Initialize the Swagger middleware
http.createServer(app).listen(serverPort, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
});
