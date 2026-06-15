import { jest, describe, it, expect } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { requestLogger } from './logger.js';

describe('requestLogger', () => {
  it('debe invocar next() al recibir una peticion', () => {
    const req = {} as Request;
    const res = { on: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;

    requestLogger(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('debe registrar el metodo y la ruta correctamente', () => {
    let finishCb: Function;
    const req = { method: 'GET', path: '/test' } as Request;
    const res = {
      on: jest.fn((_e: string, cb: Function) => { finishCb = cb; }),
      statusCode: 200,
    } as unknown as Response;
    const next = jest.fn() as NextFunction;
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});

    requestLogger(req, res, next);
    finishCb!();

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('GET /test'));
    spy.mockRestore();
  });
});
