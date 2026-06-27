import express, { type Request, type Response, type NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';

const JWT_SECRET=  process.env.JWT_SECRET ?? '';

function base64UrlDecode (str: string): string {
    return Buffer.from(str.replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString('utf8')
}  

export function requireJWT (req: Request , res: Response , next: NextFunction){
    const authHeader = req.headers['authorization'] ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7): '';
    if (!token) return res.status (401).json ({error: 'Token no existe'});

    const parts = token.split('.');

    if (parts.length!==3) return res.status(401).json ({error : 'Token malformado'})
    
    const headersB64 = parts[0]!;
    const payloadB64 = parts[1]!;
    const signatureB64 = parts[2]!;

    const header = JSON.parse(base64UrlDecode(headersB64 as string));
    if (header.alg!== 'HS256') return res.status(401).json({error: 'Algoritmo no permitido'})

    // Verificar firma con HMAC-SHA256 y timingSafeEqual
    const expectedSig = createHmac('sha256', JWT_SECRET)
        .update(`${headersB64}.${payloadB64}`)
        .digest();
    let receivedSig: Buffer;
    try {
        receivedSig = Buffer.from(signatureB64, 'base64url');
    } catch {
        return res.status(401).json({ error: 'Firma inválida' });
    }
    if (expectedSig.length !== receivedSig.length || !timingSafeEqual(expectedSig, receivedSig)) {
        return res.status(401).json({ error: 'Firma inválida' });
    }

    const claims =JSON.parse(base64UrlDecode(payloadB64));
     // Validar claims obligatorios
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp && claims.exp < now) return res.status(401).json({ error: 'Token expirado' });
    if (!claims.sub) return res.status(401).json({ error: 'Claim sub ausente' });

    (req as Request & { user?: unknown }).user = { sub: claims.sub, scope: claims.scope ?? '' };
    next();
}


    
    /*export function requireApiKey(req: Request, res: Response, next:
NextFunction): void {
const key = req.headers['x-api-key'];
if (key !== 'secreto-demo') {
res.status(401).json({ error: 'API key inválida o ausente' });
return;
}
next();
}
*/
