import { Express } from 'express';
import morgan from 'morgan';

export default function setupMiddleware(app: Express) {
    app.use(morgan('dev'));

    // Future: Add Tenant Resolver here
    // app.use(resolveTenant);
}
