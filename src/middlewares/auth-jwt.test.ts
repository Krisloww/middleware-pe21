import { jest, describe, it, expect } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { requireJWT } from './auth.js';
import { createHmac } from 'crypto';

const TEST_SECRET = process.env.JWT_SECRET ?? '';

function base64url(s: string): string {
  return Buffer.from(s).toString('base64url');
}

function signToken(header: object, payload: object): string {
  const h = base64url(JSON.stringify(header));
  const p = base64url(JSON.stringify(payload));
  const sig = createHmac('sha256', TEST_SECRET).update(`${h}.${p}`).digest('base64url');
  return `${h}.${p}.${sig}`;
}

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
}

describe('requireJWT', () => {
  it('debe retornar 401 si el token no existe', () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    requireJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token no existe' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe retornar 401 si el token esta malformado', () => {
    const req = { headers: { authorization: 'Bearer solo.dospartes' } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    requireJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token malformado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe retornar 401 si el algoritmo es none (alg:none)', () => {
    const h = base64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const p = base64url(JSON.stringify({ sub: 'x' }));
    const token = `${h}.${p}.`;
    const req = { headers: { authorization: `Bearer ${token}` } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    requireJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Algoritmo no permitido' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe retornar 401 si la firma es invalida', () => {
    const h = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const p = base64url(JSON.stringify({ sub: 'test', exp: Math.floor(Date.now() / 1000) + 3600 }));
    const token = `${h}.${p}.FIRMA_INVALIDA`;
    const req = { headers: { authorization: `Bearer ${token}` } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    requireJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Firma inválida' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe retornar 401 si el token ha expirado', () => {
    const token = signToken(
      { alg: 'HS256', typ: 'JWT' },
      { sub: 'test', exp: Math.floor(Date.now() / 1000) - 60 }
    );
    const req = { headers: { authorization: `Bearer ${token}` } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    requireJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe retornar 401 si el claim sub esta ausente', () => {
    const token = signToken(
      { alg: 'HS256', typ: 'JWT' },
      { exp: Math.floor(Date.now() / 1000) + 3600 }
    );
    const req = { headers: { authorization: `Bearer ${token}` } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    requireJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Claim sub ausente' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe invocar next() y establecer req.user con un token valido', () => {
    const token = signToken(
      { alg: 'HS256', typ: 'JWT' },
      { sub: '20251042', scope: 'inscripciones:write', exp: Math.floor(Date.now() / 1000) + 3600 }
    );
    const req = { headers: { authorization: `Bearer ${token}` } } as unknown as Request & { user?: unknown };
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    requireJWT(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(req.user).toEqual({ sub: '20251042', scope: 'inscripciones:write' });
  });
});
