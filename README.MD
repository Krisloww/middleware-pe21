# Probar y documentar

levantar el servidor, probar los tres escenarios y registrar la salida real en el README.md

## Escenarios de Prueba

A continuación se documentan los resultados obtenidos al probar los endpoints definidos:

### (a) Sin API key -> esperado: 401
* **Comando:** `curl http://localhost:3000/health`
* **Salida Real:** `{"error":"API key inválida o ausente"}`
* **Explicación:** El servidor deniega el acceso con un código **401** al no detectar la cabecera `x-api-key`.

### (b) Con clave válida -> esperado: 200
* **Comando:** `curl -H "x-api-key: secreto-demo" http://localhost:3000/health`
* **Salida Real:** `{"status":"ok","ts":"2026-06-12T04:14:49.685Z"}`
* **Explicación:** El middleware valida correctamente la clave y permite el acceso, devolviendo un código **200**.

### (c) Ruta inexistente -> esperado: 404
* **Comando:** `curl -H "x-api-key: secreto-demo" http://localhost:3000/noexiste`
* **Salida Real:** :3000/noexiste
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /noexiste</pre>
</body>
</html>

* **Explicación:** Al intentar acceder a una ruta no definida en el servidor, este responde con un código **404**.

## Testing

Las pruebas unitarias se ejecutan con:
`npm test`:

```
PASS src/middlewares/auth.test.ts
PASS src/middlewares/logger.test.ts

Test Suites: 2 passed, 2 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        0.571 s
Ran all test suites.
```