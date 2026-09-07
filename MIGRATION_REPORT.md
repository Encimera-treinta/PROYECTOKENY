# Reporte de migración SportCrz

## Migrado
- `index.html` -> `src/app/page.tsx`
- `index2.html` -> `src/app/mujeres/page.tsx`
- `index3.html` -> `src/app/hombres/page.tsx`
- `index4.html` -> `src/app/ninos/page.tsx`
- `index5.html` -> `src/app/rebajas/page.tsx`
- Productos de los HTML -> `src/data/catalog.ts`
- `carrito.js` / lógica repetida de `jsMujeres.js` -> `CartProvider.tsx`
- Imágenes y video locales -> `public/img`
- Navegación HTML -> App Router de Next.js
- Estado del carrito -> React + localStorage

## No conectado todavía (intencional)
- Código ASP.NET/C# (`Program.cs`, controladores, repositorios y modelos)
- SQLite / Prisma
- API Yappy
- Órdenes persistentes y panel administrativo

La siguiente fase puede reemplazar la capa C# por Route Handlers/Server Actions de Next.js y Prisma.
