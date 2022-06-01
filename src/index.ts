'use strict';
import { ExpressAppConfig } from "./middleware/express.app.config";
import {SwaggerUiOptions} from "./middleware/swagger.ui.options";
import {ValidatingExpressOptions} from "./middleware/validating.express.options";

export function expressAppBuilder(definitionPath: string, appOptions: ValidatingExpressOptions): ExpressAppConfig {
  return new ExpressAppConfig(definitionPath, appOptions);
}

export function optionsFromObject(options: object){
  return new ValidatingExpressOptions(options);
}
