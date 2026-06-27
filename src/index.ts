import express, { type Request, type Response, type NextFunction } from 'express';
import { requestLogger } from './middlewares/logger.js';
import { requireJWT } from './middlewares/auth.js';
import { rateLimiter } from './middlewares/rateLimiter.js';

import v1Inscripciones from './routes/v1/inscripciones.js';
import v2Inscripciones from './routes/v2/inscripciones.js';

const app = express();

app.use(express.json());
app.use(requestLogger);

// Ruta pública de salud
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        ts: new Date().toISOString()
    });
});

// Middleware de autenticación JWT
app.use(requireJWT);

// Rate limiting
app.use(rateLimiter);

// Rutas versionadas
app.use('/v1/inscripciones', v1Inscripciones);
app.use('/v2/inscripciones', v2Inscripciones);

// Manejador de errores
app.use(
    (_err: Error, _req: Request, res: Response, _next: NextFunction) => {
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
);

app.listen(3000, () => {
    console.log('Servidor en puerto 3000');
});
