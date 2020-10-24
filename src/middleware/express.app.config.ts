'use strict';

import * as express from 'express';
import {SwaggerUI} from './swagger.ui';
import {SwaggerRouter} from './swagger.router';
import {SwaggerParameters} from './swagger.parameters';
import * as logger from 'morgan';
import * as fs from 'fs';
import * as jsyaml from 'js-yaml';
import {middleware} from 'express-openapi-validator';
import cookieParser = require('cookie-parser');
import bodyParser = require('body-parser');
import cors = require('cors');

export class ExpressAppConfig {
    private app: express.Application;
    private definitionPath: string;
    private routingOptions: any;
    private appOptions: any;
    private oasValidatorOptions: any;

    constructor(definitionPath: string, appOptions) {
        this.definitionPath = definitionPath;
        this.routingOptions = appOptions.routing;
        this.appOptions = appOptions.app;
        this.oasValidatorOptions = appOptions.oasValidatorOptions;
        this.app = express();
        if (appOptions.app.preInitFn != null) {
            appOptions.app.preInitFn(this.app);
        }

        const spec = fs.readFileSync(definitionPath, 'utf8');
        const swaggerDoc = jsyaml.safeLoad(spec);

        this.app.use(this.configureLogger(appOptions.logging));

        //Adding support for various body types and parameters
        this.app.use(bodyParser.urlencoded({
            extended: true
        }));
        this.app.use(bodyParser.text());
        this.app.use(bodyParser.json());
        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: false}));
        this.app.use(cookieParser());

        //If cors filters have to be installed do so.
        if (appOptions.app.cors && appOptions.app.cors.use) {
            if (appOptions.app.cors.filter === undefined) {
                this.app.use(cors());
            } else {
                this.app.use(cors({
                    origin: function (origin, callback) {
                        // allow requests with no origin
                        // (like mobile apps or curl requests)
                        if (!origin) return callback(null, true);
                        if (appOptions.app.cors.filter.indexOf(origin) === -1) {
                            var msg = 'The CORS policy for this site does not ' +
                                'allow access from the specified Origin.';
                            return callback(new Error(msg), false);
                        }
                        return callback(null, true);
                    }
                }));
            }

        }

        //We should deploy documentation by default or if requested by the application
        if (appOptions.deploySwaggerUi) {
            let swaggerUiOptions = undefined;
            if ('swaggerUiOptions' in appOptions) {
                swaggerUiOptions = appOptions.swaggerUiOptions;
            }

            const swaggerUi = new SwaggerUI(swaggerDoc, swaggerUiOptions);
            if (appOptions.protectDocumentation) {
                appOptions.protectDocumentation(this.app);
            }

            this.app.use(swaggerUi.serveStaticContent());
        }
    }

    private isFunction(functionToCheck) {
        return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
    }

    public addValidator() {

        let defaultValidatorOptions = {
            apiSpec: this.definitionPath
        };
        let options = {...defaultValidatorOptions, ...this.oasValidatorOptions};
        this.app.use(middleware(options))

        this.app.use(new SwaggerParameters().checkParameters());
        this.app.use(new SwaggerRouter().initialize(this.routingOptions));
        if (this.appOptions != null && this.appOptions.appDefinedRouters != null) {
            this.appOptions.appDefinedRouters.forEach(appDefinedRouter => {
                if (this.isFunction(appDefinedRouter)) {
                    if (appDefinedRouter.length == 0) {
                        const [route, router] = appDefinedRouter(this.app);
                        this.app.use(route, router);
                    } else {
                        this.app.use(appDefinedRouter);
                    }
                }
            });
        }
        if (this.appOptions != null && this.appOptions.errorHandler != null) {
            this.app.use(this.appOptions.errorHandler);
        } else {
            this.app.use((err, req, res, next) => {
                // format errors
                res.status(err.status || 500).json({
                    message: err.message,
                    errors: err.errors,
                });
            });
        }
        if (this.appOptions != null && this.appOptions.catchAllHandler != null) {
            this.app.use(this.appOptions.catchAllHandler);
        }

    }

    public configureLogger(loggerOptions) {
        let format = 'dev';
        let options: {} = {};
        if (loggerOptions !== undefined) {


            if (loggerOptions.format != undefined
                && typeof loggerOptions.format === 'string') {
                format = loggerOptions.format;
            }


            if (loggerOptions.errorLimit != undefined
                && (typeof loggerOptions.errorLimit === 'string' || typeof loggerOptions.errorLimit === 'number')) {
                options['skip'] = function (req, res) {
                    return res.statusCode < parseInt(loggerOptions.errorLimit);
                };
            }
        }

        return logger(format, options);
    }

    public getApp(): express.Application {
        return this.app;
    }
}