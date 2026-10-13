---
name: CareNet UI
description: Sistema de diseño de CareNet (Tailwind v4 + shadcn/ui sobre Base UI). Usar al crear o modificar cualquier componente, pantalla o estilo en app/, componentes/ui/ o componentes/features/ — y también al revisar si un color, radio, spacing o estado interactivo cumple el sistema. Cubre tokens, convención de nombres en español, cva + cn, data-slot y el shell del dashboard.
---

# CareNet — Sistema de diseño

Este proyecto es un dashboard clínico. La UI comunica estados de salud, así que
el diseño no es decorativo: un color mal puesto puede sugerir que un paciente está
estable cuando no lo está.

## Stack (no cambiarla sin motivo)

| Capa | Tecnología |
|---|---|
| Estilos | Tailwind CSS v4, tokens en `@theme` dentro de `app/globals.css` (NO hay `tailwind.config`) |
| Primitivas | shadcn/ui estilo `base-nova` sobre **Base UI** (`@base-ui/react/*`), no Radix |
| Variantes | `class-variance-authority` (cva) |
| Iconos | `lucide-react` (`iconLibrary: "lucide"` en `components.json`) |
| Avisos | `sonner` |
| Animación | GSAP + clases CSS propias (ver skill `carenet-movimiento`) |

## Aliasos (de `components.json`)

```
@/componentes        -> componentes/
@/componentes/ui     -> componentes/ui/
@/componentes/features -> componentes/features/
@/componentes/layout -> componentes/layout/
@/lib/core/utilidades -> lib/core/utilidades.ts   (exporta cn)
```

## Regla 1 — Todo se nombra en español

Es la convención real del repo, sin excepciones. No introduzcas `button.tsx`
cuando el neighboring es `boton.tsx`.

| En vez de | Usa |
|---|---|
| `button.tsx` / `Button` | `boton.tsx` / `Boton` |
| `input.tsx` | `entrada.tsx` |
| `tabs.tsx` | `pestana.tsx` |
| `badge.tsx` | `indicador.tsx` |
| `card.tsx` | `tarjeta.tsx` |
| `modal.tsx` | `modal.tsx` |
| `loading.tsx` | `carga-bia.tsx` / `carga-datos.tsx` |
| `usePatients.ts` | `use-pacientes.ts` |

Componente en `componentes/features/<dominio>/` con el dominio en español:
`pacientes`, `medicos`, `alertas`, `solicitudes`, `administracion`,
`notificaciones-clinicas`, `panel`, `comun`.

## Regla 2 — Tokens, nunca colores crudos

`app/globals.css` define la paleta en `:root` (hex) y `.dark` (oklch).
Todo color de UI sale de un token. Valores actuales:

| Token | Claro | Uso |
|---|---|---|
| `--primary` | `#00a8a8` | teal de marca, acciones principales, `--ring` |
| `--primary-foreground` | `#ffffff` | texto sobre primary |
| `--foreground` | `#0c3535` | texto principal (verde muy oscuro, NO gris) |
| `--background` | `#f8fafc` | fondo de página |
| `--card` | `#ffffff` | superficie de tarjeta |
| `--muted-foreground` | `#64748b` | texto secundario |
| `--border` / `--input` | `#e2e8f0` | bordes y campos |
| `--destructive` | `#dc2626` | acciones destructivas |

Tokens clínicos propios (existen en `@theme`, úsalos en vez de `destructive`):

| Token | Claro | Significado |
|---|---|---|
| `--critical` | `#dc2626` | estado crítico |
| `--warning` | `#d97706` | advertencia |
| `--success` | `#4ade80` | estable / favorable |
| `--critical-muted` | `#fef2f2` | fondo de estado crítico |
| `--warning-muted` | `#fffbeb` | fondo de advertencia |
| `--success-muted` | `#ecfdf5` | fondo de éxito |

En Tailwind se usan como `bg-critical`, `text-success`, `bg-warning-muted`,
`border-critical`. El dashboard clinico debe preferir `critical/warning/success`
sobre `destructive` para estados de paciente.

Radios: `--radius: 0.75rem` genera la escala `--radius-sm|md|lg|xl|2xl|3xl|4xl`.
Usa `rounded-lg` (el radio base), no valores arbitrarios.

Detalle completo de tokens: `references/tokens.md`.

## Regla 3 — Anatomía de un componente de `componentes/ui`

Plantilla real (ver `componentes/ui/boton.tsx`):

```tsx
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/core/utilidades'

const botonVariants = cva(
  "base inline-flex items-center justify-center rounded-lg border border-transparent text-sm font-medium transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        outline: 'border-border bg-background hover:bg-muted',
        ghost: 'hover:bg-muted hover:text-foreground',
        destructive: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
      },
      size: {
        default: 'h-8 gap-1.5 px-2.5',
        sm: 'h-7 gap-1 px-2.5 text-[0.8rem]',
        lg: 'h-9 gap-1.5 px-2.5',
        icon: 'size-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

function Boton({ className, variant = 'default', size = 'default', ...props }:
  ButtonPrimitive.Props & VariantProps<typeof botonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(botonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Boton, botonVariants }
```

Obligatorio en cada componente de ui:
- primitiva de **Base UI**, no HTML pelado cuando existe
- `cva` para variantes + `cn()` para fusionar `className`
- `data-slot="<nombre>"` en la raiz
- la clase base incluye los estados: `focus-visible`, `disabled`, `aria-invalid`
- se exportan el componente **y** su objeto de variantes

## Regla 4 — Estados de foco e interaccion

El base de `boton.tsx` fija el patron; replicarlo en todo lo interactivo:

```
focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50
disabled:pointer-events-none disabled:opacity-50
aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20
```

Usa siempre `focus-visible:` (no `focus:`) para que el anillo no aparezca al
usar el mouse. `transition-all` solo si la transicion es <= 200ms.

## Regla 5 — Dimensiones del shell

`componentes/layout/estructura-app.tsx` fija el esqueleto. Cualquier pantalla
nueva vive dentro de `<main>` y debe respetar:

- `pt-[4.5rem]` (barra superior) y `lg:pl-[17rem]` (barra lateral)
- ancho util `max-w-[1480px]`, centrado
- padding de pagina `px-4 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-5`
- ritmo vertical entre bloques: `space-y-6`

No reconstruyas el shell ni dupliques el padding dentro de la pagina.

## Al revisar un cambio de UI, comprueba

1. Colores viniendo de tokens, sin hex sueltos en el `.tsx`.
2. Nombre del archivo y del componente en español.
3. Estados de foco, disabled y error presentes si es interactivo.
4. `prefers-reduced-motion` si hay animacion (ver skill `carenet-movimiento`).
5. El estado critico se distingue por texto/icono, no solo por color.
6. Contraste suficiente con `--muted-foreground` sobre `--background`.
