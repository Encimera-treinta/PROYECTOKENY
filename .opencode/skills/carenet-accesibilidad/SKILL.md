---
name: CareNet Accesibilidad
description: Accesibilidad y seguridad de la informacion clinica en CareNet. Usar al revisar o crear formularios, tablas, estados de paciente (critico/urgencia/prioridad), modales, avisos, navegacion por teclado o cualquier elemento que comunique un dato medico. Cubre el estado nunca-solo-por-color, foco visible, nombres acessibles, contraste y los tokens semanticos.
---

# CareNet — Accesibilidad y estados clínicos

En un dashboard clínico, un error de accesibilidad no es un detalle de diseño:
un estado `critical` que solo se distingue por el rojo es un paciente que
puede no ser detectado. Aplica este skill a **cualquier** elemento que muestre o
pida informacion medica.

## Regla 1 — Un estado nunca se comunica solo con color

Es la regla mas importante del proyecto. `--critical`, `--warning` y
`success` van **siempre** acompanados de al menos dos señales mas:

1. **Texto** que nombra el estado (`CRITICO`, `EN OBSERVACION`, `ESTABLE`).
2. **Icono o forma** distinta por estado (de `lucide-react`).
3. Opcionalmente, la banda de fondo `-muted` correspondiente.

```tsx
// Incorrecto: solo color
<span className="bg-critical-muted text-critical" />

// Correcto: color + texto + icono
<span className="inline-flex items-center gap-1.5 rounded-md bg-critical-muted px-2 py-1 text-xs font-medium text-critical-foreground">
  <TriangleAlert className="size-3.5" aria-hidden="true" />
  CRITICO
</span>
```

Revisa en particular: `aura-prioridad` y `aura-urgencia` (usan color para
codificar urgencia) y cualquier aura/estado de `pacientes`. Si la urgencia se
comunica con color de fondo de una tarjeta, anade etiqueta textual.

## Regla 2 — Contraste real, no supuesto

`--success` es `#4ade80` (verde claro) y sobre blanco no llega a 4.5:1. Por eso
existe `--success-foreground` (`#14532d`). Regla practica:

- Texto pequeno o normal: `--*-foreground`.
- Fondos de chip o banda: `--*-muted` con el `--*-foreground` del texto.
- `--success` suelto solo para bordes, iconos grandes o relleno.

`--muted-foreground` (`#64748b`) sobre `--background` (`#f8fafc`) es aceptable
para texto secundario, pero nunca para el dato principal de una fila.

## Regla 3 — Foco siempre visible y navegable

Base UI ya gestiona focus trap y `Escape` en sus primitivas: **usa la primitiva
de Base UI en vez de un `<div>` con handlers a mano**. Si montas un modal
propio, no puede quedar nunca sin foco, se cierra con `Escape` y devuelve el
foco al elemento que lo abrio.

El anillo de foco del proyecto sale de los tokens, nunca de un color fijo:

```
focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50
```

`--ring` es `#00a8a8`, el mismo teal que `--primary`, asi que el foco es
visible sobre superficies claras. Nunca `outline: none` sin reemplazo.

## Regla 4 — Cada control tiene nombre accesible

- Icono sin texto -> `aria-label` en el icono o en el boton.
- Icono decorativo dentro de un control con texto -> `aria-hidden="true"`.
- Campo de formulario -> `<label>` real ligado por `htmlFor`/`id`; no solo
  `placeholder`. `componentes/ui/entrada.tsx` es la base.
- Tabla de datos -> `<th scope="col">` en la cabecera.
- Region de la pagina -> `aria-label` en el `<nav>` o `<section>` que lo
  identifica (el shell ya lo hace en la barra lateral).

## Regla 5 — Estados announced, no solo pintados

Cuando un guardado, error o carga termine, el usuario tiene que enterarse sin
mirar. El proyecto ya tiene el provider de avisos (`ProveedorAvisos`,
`componentes/ui/avisos.tsx`, sobre `sonner`):

- Usa ese provider para exito/error; no hagas banners propios.
- Las transiciones de estado deben tener texto, no solo cambiar de color.
- Un `aria-live="polite"` para la region que cambie (contadores, resultados).

## Regla 6 — Movimiento y carga

Ver el skill `carenet-movimiento` para el guard obligatorio. En carga:

- Los skeletons/loaders (`.bia-loading-*`, `carga-datos.tsx`) deberian exponer
  un texto de estado, no solo la animacion.
- No uses un spinner para un contenido que cabe en menos de ~200ms: produce
  parpadeo.

## Al revisar un cambio, comprueba

1. Ningun estado depende solo del color.
2. Contraste 4.5:1 en texto pequeno; `--*-foreground` en los semanticos claros.
3. Foco visible con anillo de token, y `focus-visible` (no `focus`).
4. Todo control con nombre accesible; iconos decorativos con `aria-hidden`.
5. Modales: primitiva Base UI, `Escape`, foco devuelto.
6. `<th scope="col">` en tablas.
7. Guard de `prefers-reduced-motion` si hay animacion.
8. Errores y confirmaciones anunciados, no solo visibles.
