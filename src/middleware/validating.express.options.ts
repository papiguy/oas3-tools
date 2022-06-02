import {OpenApiValidatorOpts} from "express-openapi-validator/dist/openapi.validator";
import {SwaggerUiOptions} from "./swagger.ui.options";
import {defaults} from 'lodash';

export class CorsOptions {
    filter: string;
    use: boolean;

}

export class ExpressOptions {
    constructor(options: any) {
        options = defaults(options, {

        });
        this.preInitFn = options.preInitFn;
        this.cors = options.cors;
        this.errorHandler = options.errorHandler;
        this.appDefinedRouters = options.appDefinedRouters;
    }

    public readonly preInitFn: Function;
    public readonly cors: CorsOptions;
    public readonly errorHandler: Function;
    public readonly appDefinedRouters: Function[];
    public readonly catchAllHandler: Function;
}

export class LoggerOptions {
    constructor(options: any) {
        options = defaults(options, {
            format: 'dev',
            dontReportStatusCodesBelow: undefined
        });
        this.dontReportStatusCodesBelow = options.dontReportStatusCodesBelow;
        this.format = options.format;
    }

    public readonly format: string;
    public readonly dontReportStatusCodesBelow: number | string;
}

export class RoutingOptions {
    //if object the key is the handlerName and func for the handler is the function to be called
    public readonly controllers: object | string;
    //if true stubs will be used. false by default
    public readonly useStubs: boolean;
    public readonly ignoreMissingHandlers: boolean;

    constructor (options : any){
        options  = defaults(options, {
            controllers: {},
            useStubs: false,
            ignoreMissingHandlers: false
        });
        this.controllers = options.controllers;
        this.useStubs = options.useStubs;
        this.ignoreMissingHandlers = options.ignoreMissingHandlers
    }
}

export class ValidatingExpressOptions {
    public readonly routing: RoutingOptions;
    public readonly expressOptions: ExpressOptions;
    public readonly oasValidatorOptions: OpenApiValidatorOpts;
    public readonly loggerOptions: LoggerOptions;
    public readonly deploySwaggerUi: boolean;
    public readonly swaggerUiOptions: SwaggerUiOptions;
    protectDocumentation: Function;

    constructor(options) {
        if (!options){
            throw new Error("options should be specified.");
        }
        this.routing = new RoutingOptions(options.routing);
        this.expressOptions = new ExpressOptions(options.expressOptions);
        this.oasValidatorOptions = options.oasValidatorOptions;
        this.loggerOptions = new LoggerOptions(options.loggerOptions);
        this.deploySwaggerUi = options.deploySwaggerUi || false;
        this.swaggerUiOptions = new SwaggerUiOptions(options.swaggerUiOptions.apiDocsPath,
            options.swaggerUiOptions.swaggerUIPath, options.swaggerUiOptions.swaggerUiDir);
        this.protectDocumentation = options.protectDocumentation;
    }

}
