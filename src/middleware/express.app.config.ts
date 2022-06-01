'use strict';

import * as express from 'express';
import {SwaggerUI} from './swagger.ui';
import {SwaggerRouter} from './swagger.router';
import {SwaggerParameters} from './swagger.parameters';
import * as logger from 'morgan';
import * as fs from 'fs';
import * as jsyaml from 'js-yaml';
import * as OpenApiValidator from 'express-openapi-validator';
import cookieParser = require('cookie-parser');
import cors = require('cors');
import {CorsOptions, ExpressOptions, RoutingOptions, ValidatingExpressOptions} from "./validating.express.options";

export class ExpressAppConfig {
    private readonly app: express.Application;
    private readonly definitionPath: string;
    private readonly routingOptions: RoutingOptions;
    private readonly appOptions: ExpressOptions;
    private readonly oasValidatorOptions: any;

    constructor(definitionPath: string, appOptions: ValidatingExpressOptions) {
        this.definitionPath = definitionPath;
        this.routingOptions = appOptions.routing;
        this.appOptions = appOptions.expressOptions;
        this.oasValidatorOptions = appOptions.oasValidatorOptions;

        this.app = ExpressAppConfig.setupExpress(appOptions.expressOptions);
        this.configureLogger(appOptions.loggerOptions);
        this.configureCors(appOptions.expressOptions.cors);

        //We should deploy documentation by default or if requested by the application
        if (appOptions.deploySwaggerUi) {
            let swaggerUiOptions = undefined;
            if ('swaggerUiOptions' in appOptions) {
                swaggerUiOptions = appOptions.swaggerUiOptions;
            }

            const spec = fs.readFileSync(definitionPath, 'utf8');
            const swaggerDoc = jsyaml.load(spec);

            const swaggerUi = new SwaggerUI(swaggerDoc, swaggerUiOptions);
            if (appOptions.protectDocumentation) {
                appOptions.protectDocumentation(this.app);
            }

            this.app.use(swaggerUi.serveStaticContent());
        }
    }

    private static isFunction(functionToCheck) {
        return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
    }

    private configureCors(corsOptions: CorsOptions) {
        //If cors filters have to be installed do so.
        if (!corsOptions?.use) {
            return;
        }
        if (!corsOptions?.filter) {
            this.app.use(cors());
            return;
        }
        this.app.use(cors({
            origin: function (origin, callback) {
                // allow requests with no origin
                // (like mobile apps or curl requests)
                if (!origin) return callback(null, true);
                if (corsOptions.filter.indexOf(origin) === -1) {
                    var msg = 'The CORS policy for this site does not ' +
                        'allow access from the specified Origin.';
                    return callback(new Error(msg), false);
                }
                return callback(null, true);
            }
        }));
    }

    private static setupExpress(expressOptions: ExpressOptions) {
        const app = express();
        if (expressOptions && expressOptions.preInitFn) {
            expressOptions.preInitFn(app);
        }

        //Adding support for various body types and parameters
        app.use(express.text())
        app.use(express.json({limit: '2MB'}));
        app.use(express.urlencoded({extended: true, limit: '2MB'}));
        app.use(cookieParser());

        return app;
    }

    public addValidator() {

        let defaultValidatorOptions = {
            apiSpec: this.definitionPath,
            validateResponses: false
        };
        let options = {...defaultValidatorOptions, ...this.oasValidatorOptions};
        const middleware = OpenApiValidator.middleware(options);
        this.app.use(middleware);
        this.app.use(new SwaggerParameters().checkParameters());
        this.app.use(new SwaggerRouter().initialize(this.routingOptions));
        if (this.appOptions != null && this.appOptions.appDefinedRouters != null) {
            this.appOptions.appDefinedRouters.forEach(appDefinedRouter => {
                if (ExpressAppConfig.isFunction(appDefinedRouter)) {
                    if (appDefinedRouter.length == 0) {
                        const [route, router] = appDefinedRouter();
                        this.app.use(route, router);
                    } else {
                        // @ts-ignore
                        this.app.use(appDefinedRouter);
                    }
                }
            });
        }
        if (this.appOptions != null && this.appOptions.errorHandler != null) {
            // @ts-ignore
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
            // @ts-ignore
            this.app.use(this.appOptions.catchAllHandler);
        }
    }

    public configureLogger(loggerOptions) {
        let format = 'dev';
        let options: {} = {};
        if (loggerOptions?.format !== undefined) {
            format = loggerOptions.format;
        }
        if (loggerOptions?.dontReportStatusCodesBelow != undefined) {
            options['skip'] = function (req, res) {
                return res.statusCode < parseInt(loggerOptions.dontReportStatusCodesBelow);
            };
        }
        this.app.use(logger(format, options));
    }

    public getApp(): express.Application {
        return this.app;
    }
}
