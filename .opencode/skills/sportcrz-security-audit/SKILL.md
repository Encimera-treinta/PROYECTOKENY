---
name: sportcrz-security-audit
description: Auditoria de seguridad del proyecto SportCrz (Next.js 15 App Router + libsql + cookies HMAC + server actions). Usar al revisar o crear auth, sesiones, API routes, server actions, carritos, pedidos, links magicos, archivos subidos o cualquier cosa que toque datos de clientes. Cubre los patrones que este repo ya usa y los trampoles que tiene.
---

# Auditoria de seguridad — SportCrz

Este proyecto NO usa NextAuth ni ORM. Todo es propio, asi que
la seguridad depende de que cada endpoint se proteja a mano.
Esa es la fuente numero uno de huecos.

## Stack (no cambiar sin motivo)

| Capa | Tecnologia |
|---|---|
| Framework | Next.js 15 App Router (route handlers + server actions) |
| Base | SQLite/libsql, **siempre parametrizado** (`args: []`) |
| Sesion admin | Cookie HMAC-SHA256 firmada con `ADMIN_SESSION_SECRET` (`src/lib/admin-auth.ts`) |
| Sesion cliente | Igual patron, cookie propia (`src/lib/customer-auth.ts`) |
| Secretos | `.env.local` (nunca commitear, ya esta en `.gitignore`) |
| Passwords | scrypt con salt por usuario |

## Checklist por endpoint

Toda route handler y toda server action DEBE cumplir:

1. **Sesion**: si toca datos de una persona o la tienda, exigir
   sesion en el SERVIDOR. La pagina puede redirigir, pero eso
   no alcanza: el endpoint se llama directo con curl.
2. **Rate limit**: login, magic links, checkout y creacion de
   recursos necesitan freno por IP. Sin esto se hace fuerza
   bruta o se llena la base de basura.
3. **No confiar en el cliente**: precios, stock y estados se
   releen de la base. Nunca se usa lo que manda el navegador.
4. **Validar entrada**: tipo, rango y longitud. Normalizar en
   vez de rechazar el lote entero.
5. **Mensajes utiles**: el error dice QUE fallo, sin filtrar
   datos internos.

## Trampoles yaevichos en este repo

### `SCHEMA_SQL` se parte por punto y coma

`src/lib/database.ts` hace `SCHEMA_SQL.split(";")`. Un `;`
dentro de un comentario rompe el esquema entero y deja la
peticion en500. **Ni el comentario ni el SQL pueden traer uno.**

### `Number(null)` devuelve 0, no null

Al mapear filas, `Number(row.stock)` convierte `NULL` en `0`.
Para columnas donde `NULL` significa algo (stock sin control,
imagen ausente) hay que chequear antes.

### Rutas publicas por diseno

- `/orden/[code]` y `/pedido/[code]` son publicas a proposito:
  el codigo es aleatorio. Es correcto, pero implica que el codigo
  **no** puede ser corto ni predecible.
- `/entrar/[token]` da session de admin: es la mas sensible.

### Server actions

Las de `/admin/*/actions.ts` corren en el servidor pero se
invocan desde el navegador. Sin `requireAdmin()` adentro, son
publicas.

### `NEXT_PUBLIC_*` va al bundle del cliente

Cualquier variable con ese prefijo viaja al navegador. No poner
ahi nada secreto (un numero de WhatsApp si, una clave no).

## Al auditar

1. Listar todas las rutas: `src/app/**/route.ts` y
   `src/app/**/actions.ts`.
2. Para cada una: ¿exige sesion? ¿tiene rate limit? ¿valida?
3. Buscar SQL concatenado: `sql: \`... ${`. Debe ser `args:`.
4. Buscar `dangerouslySetInnerHTML`.
5. Probar de verdad: pedir sin cookie y ver si devuelve401 o200.
   Un endpoint que responde 200 sin sesion es un hole.
6. Verificar path traversal en `/uploads/[name]`.

## Regla de oro

Si un endpoint devuelve200 sin sesion y modifica algo, es un
bug critico. Arreglarlo antes que cualquier otra cosa.