# SportCrz — migración a Next.js

Migración del proyecto ASP.NET + HTML/CSS/JS a Next.js con App Router y TypeScript.

## Ejecutar

```bash
npm install
npm run dev
```

Luego abre http://localhost:3000.

## Base de datos e inicio de sesión

En desarrollo local, la aplicación usa SQLite en `data/sportcrz.db` si no se
define `TURSO_DATABASE_URL`. En producción, configura `TURSO_DATABASE_URL` y
`TURSO_AUTH_TOKEN` como variables **Secret** del entorno Production en Vercel;
no uses el prefijo `NEXT_PUBLIC_` para ninguna de ellas. La aplicación crea el
esquema al recibir la primera solicitud que usa la base.

En el panel de Turso, abre la base `sportcrz`, copia su URL y crea un token de
base de datos con lectura y escritura. En Vercel → `sportcrz-shop` → Settings →
Environment Variables, guarda `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` como
variables **Secret** de Production. Guarda el token directamente en Vercel; no
lo subas a GitHub ni lo pegues en el chat. Para desarrollo local, deja
`TURSO_DATABASE_URL` vacía y conserva SQLite local, evitando modificar la base
de producción.

1. Copia `.env.example` como `.env.local` y cambia `ADMIN_SESSION_SECRET`.
2. Crea o actualiza el administrador de la base SQLite local:

```bash
npm run admin:create -- admin@tudominio.com
```

3. Inicia la aplicación y entra en http://localhost:3000/admin/login.

Si la migración anterior ya tenía `ADMIN_EMAIL` y `ADMIN_PASSWORD_HASH`, ese
administrador se importa automáticamente la primera vez y conserva su contraseña.
También se puede importar manualmente con `npm run admin:migrate`. Estos dos
scripts administran el SQLite local; no los uses para modificar una base Turso.

Al usar ngrok, expón solamente el puerto de Next.js (`3000`). Nunca compartas el
archivo `.env.local` ni el archivo `data/sportcrz.db`.

## Incluido
- Inicio migrado
- Catálogos Mujeres, Hombres, Niños y Rebajas
- Productos extraídos de los HTML originales
- Carrito React persistente en localStorage
- Assets locales en public/img

## Publicación en Vercel

El proyecto `sportcrz-shop` debe estar conectado al repositorio
`Encimera-treinta/PROYECTOKENY`, con `main` como rama de producción. Cuando esa
conexión está activa, cada `git push` a `main` crea un nuevo despliegue. Revisa
el resultado en Vercel → Deployments antes de dar el cambio por publicado.

## Pagos con TiloPay (tarjetas y Yappy)

El checkout usa la plataforma **TiloPay**, que procesa tarjetas, Yappy y
Banco General en Panamá. El cliente paga en la página segura de TiloPay;
los datos de tarjeta nunca pasan por este servidor.

1. Crea tu cuenta en [admin.tilopay.com](https://admin.tilopay.com/) y
   obtén tus credenciales en *Admin · Tilopay Checkout*.
2. Añade a `.env.local`:

```
TILOPAY_CHECKOUT_KEY=tu_key
TILOPAY_API_USER=tu_usuario
TILOPAY_API_PASSWORD=tu_password
TILOPAY_CURRENCY=USD
```

3. Reinicia la app. El carrito → *Finalizar compra* → `/checkout`
   completa los datos y redirige a TiloPay.

Al aprobarse el pago, TiloPay redirige a `/checkout/resultado`, la
orden queda `paid`, se guarda la referencia y se descuenta el stock.
Si el pago falla, la orden se cancela y el stock no cambia.

## Pendiente para la siguiente fase
- Webhooks de TiloPay (confirmación servidor a servidor)
- Envío de correos de confirmación
