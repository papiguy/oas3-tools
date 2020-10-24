'use strict';
import { ExpressAppConfig } from "./middleware/express.app.config";
import {SwaggerUiOptions} from "./middleware/swagger.ui.options";

export function expressAppConfig(definitionPath: string, appOptions): ExpressAppConfig {
  return new ExpressAppConfig(definitionPath, appOptions);
}

export function expressSwaggerUiOptions(apiDocsPath : string, swaggerUiPath: string, swaggerUiDir: string) : SwaggerUiOptions {
  return new SwaggerUiOptions(apiDocsPath, swaggerUiPath, swaggerUiDir);
}
