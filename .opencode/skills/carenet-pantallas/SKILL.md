---
name: CareNet Pantallas
description: Como crear y colocar una pantalla nueva en el dashboard de CareNet. Usar al anadir una ruta, seccion o vista en app/(dashboard)/, al decidir donde va un componente, o al trabajar con la carga de datos (lib/domain, lib/infra, use-carga-pagina, carga-estandar). Cubre el grupo de rutas, la composicion de providers del layout, el patron de pagina y las capas de datos.
---

# CareNet — Pantallas y rutas

El dashboard usa un **grupo de rutas** en Next App Router, no un `/dashboard`
real. Confundir esto lleva a crear rutas que no aparecen en la URL esperada.

## Regla 1 — La ruta es `app/(dashboard)/<seccion>/`, la URL no lleva `(dashboard)`

`(dashboard)` es un *route group*: organiza archivos sin alterar la URL.

| Archivo | URL |
|---|---|
| `app/(dashboard)/page.tsx` | `/` |
| `app/(dashboard)/pacientes/page.tsx` | `/pacientes` |
| `app/(auth)/login/page.tsx` | `/login` |

Secciones existentes: `administracion`, `alertas`, `analitica`, `configuracion`,
`medicos`, `pacientes`, `solicitudes`.

Para una pantalla nueva: crea `app/(dashboard)/<seccion>/page.tsx` en el idioma
del dominio, y registrala en la navegacion
(`componentes/layout/barra-lateral.tsx`).

## Regla 2 — No toques el layout para añadir una pagina

`app/(dashboard)/layout.tsx` ya compone los providers en este orden:

```
ProveedorSesionDesarrollo        (sesion de desarrollo)
└── ProveedorAvisos               (sonner)
    └── ProveedorNotificacionesClinicas
        └── EstructuraApp         (shell: barra lateral + superior)
            └── {children}
```

Una pantalla nueva solo aporta su `page.tsx`. Los providers son del layout; si
crees un provider nuevo, va en el layout y en orden de dependencia, no dentro de
la pagina.

## Regla 3 — Anatomia de una pagina

Patron real (`app/(dashboard)/page.tsx`):

```tsx
import { Suspense } from "react"
import { AdministradorDeAlertas } from "@/componentes/features/alertas"

export const metadata = {
  title: "Alertas — Panel clínico",
  description: "Bandeja de alertas clínicas como pantalla de inicio.",
}

function ContenidoAlertas() {
  return (
    <Suspense>
      <AdministradorDeAlertas />
    </Suspense>
  )
}

export default function PaginaAlertasInicio() {
  return (
    <div className="space-y-6">
      <ContenidoAlertas />
    </div>
  )
}
```

Convenciones:
- `metadata` con `title` y `description`, en español, en cada pagina.
- Componente de pagina en PascalCase español: `PaginaAlertasInicio`,
  `PaginaPacientes`.
- El contenido que carga datos va dentro de `<Suspense>` para que la pagina
  pueda pintar el shell mientras resuelve.
- Ritmo vertical con `space-y-6`.
- El shell ya aporta padding y ancho maximo: no los repitas aqui.

## Regla 4 — Las capas de datos ya existen

No escribas acceso a datos dentro de un componente. El proyecto esta partido en
capas y el nombre del archivo dice en que capa va:

| Capa | Carpeta | Que va ahi |
|---|---|---|
| UI / features | `componentes/features/<dominio>/` | componentes de dominio |
| Hooks de carga | `lib/features-hooks/<dominio>/` | `use-*` por feature; `use-carga-pagina.ts` es la base |
| Dominio | `lib/domain/*.model.ts` | tipos y modelos (`paciente.model.ts`, `alerta.model.ts`, ...) |
| Infraestructura | `lib/infra/*` | repositorios y clientes (`api-client.ts`, `*.repository.ts`, `carenet-client.ts`) |
| Nucleo | `lib/core/` | `utilidades.ts` (`cn`), `carga-estandar.ts`, `localizacion*.ts`, `nombres-pagina-dashboard.ts` |

Flujo esperado: componente -> hook de `lib/features-hooks/` -> repositorio de
`lib/infra/` -> backend. Los modelos de `lib/domain/` son la frontera de tipos.

Para listas y paginacion, parte de `lib/features-hooks/use-carga-pagina.ts` y de
`lib/core/carga-estandar.ts` en vez de inventar un patron de carga nuevo.

## Regla 5 — Apenda la navegacion, no la reconstruyas

Al añadir una seccion, actualiza:
- `componentes/layout/barra-lateral.tsx` (enlaces y etiqueta)
- `componentes/layout/barra-superior.tsx` si aplica
- `lib/core/nombres-pagina-dashboard.ts` (titulo por ruta)
- `lib/core/localizacion-dashboard.ts` si hay textos de la seccion

## Antes de dar por buena una pantalla nueva

1. La ruta cuelga de `app/(dashboard)/` y la URL es la esperada.
2. `metadata` presente, en español.
3. El contenido con datos esta dentro de `<Suspense>`.
4. No se toco el layout ni los providers.
5. El acceso a datos va por `lib/infra`/`lib/domain`, no desde el componente.
6. Los estados criticos se distinguen sin depender solo del color.
7. Cumple el shell: sin padding duplicado, ancho dentro de `max-w-[1480px]`.
