import { jest, describe, it, expect } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { requireApiKey } from './auth.js';

describe('requireApiKey', () => {
  function mockRes() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
  }

  it('debe retornar 401 si x-api-key esta ausente', () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    requireApiKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'API key inválida o ausente' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe retornar 401 si la clave es incorrecta', () => {
    const req = { headers: { 'x-api-key': 'clave-incorrecta' } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    requireApiKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'API key inválida o ausente' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe invocar next() si la clave es valida', () => {
    const req = { headers: { 'x-api-key': 'secreto-demo' } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    requireApiKey(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
