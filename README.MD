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

## Pruebas de los endpoints (PE-2.2)

Servidor corriendo en `http://localhost:3000`. Autenticacion: header `x-api-key: secreto-demo`.

### Escenario 1 — POST /v1/inscripciones con campos válidos (esperado: 201)

![v1 201 Created](docs/screenshots/01-v1-201.png)

### Escenario 2 — POST /v2/inscripciones con payment_method válido (esperado: 201)

![v2 201 Created](docs/screenshots/02-v2-201.png)

### Escenario 3 — POST /v2/inscripciones sin payment_method (esperado: 400)

![v2 400 campo faltante](docs/screenshots/03-v2-400-faltante.png)

### Escenario 4 — POST /v2/inscripciones con payment_method inválido (esperado: 400)

![v2 400 valor inválido](docs/screenshots/04-v2-400-inválido.png)

Resultado de `npx @redocly/cli lint openapi.yaml`:

![Redocly lint sin errores](docs/screenshots/lint-sin-errores.png)

## Seguridad JWT (PE-2.3)

### Generar un token de prueba

```bash
# Con el secreto por defecto del laboratorio:
TOKEN=$(node generate-token.mjs)

# Con secreto personalizado:
JWT_SECRET=mi-secreto-largo node generate-token.mjs
```

### Probar el servicio

```bash
# Peticion valida (esperado: 201)
curl -X POST http://localhost:3000/v2/inscripciones \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"estudianteId":"uuid-123","materias":["LTI_05A_458"],"periodoId":"2026-1","payment_method":"scholarship"}'

# Firma invalida (esperado: 401)
curl -X POST http://localhost:3000/v2/inscripciones \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.FIRMA_INVALIDA" \
  -H "Content-Type: application/json" \
  -d '{}'

# alg:none (esperado: 401)
curl -X POST http://localhost:3000/v2/inscripciones \
  -H "Authorization: Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0." \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Resultados de las pruebas

#### Prueba 1 — Token válido (esperado: 201)

![PE-2.3 Prueba 1 - 201 Created](docs/screenshots/PE23_prueba1_201.png)

#### Prueba 2 — Firma inválida (esperado: 401)

![PE-2.3 Prueba 2 - 401](docs/screenshots/PE23_prueba2_401.png)

#### Prueba 3 — alg:none (esperado: 401)

![PE-2.3 Prueba 3 - 401](docs/screenshots/PE23_prueba3_401.png)

### Variables de entorno

Copia `.env.example` a `.env` y configura `JWT_SECRET` con un valor secreto largo.

**Reflexión:**
Creo que lo primero que se tendria que realizar seria una estandarizacion para los codigos de error con algun formato uniforme, tambien la parte de autenticacion por API key en lugar que sea una clave única compartida, tambien documentar todo lo que se va realizando dentro del 
código, y algunos filtros para futuros endpoints 