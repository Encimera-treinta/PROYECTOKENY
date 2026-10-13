# Tokens de CareNet

Fuente de verdad: `app/globals.css`. Este archivo es una guia de lectura rapida;
si algo aqui no coincide con `globals.css`, **gana `globals.css`**.

Tailwind v4 expone los tokens en dos capas: los valores crudos viven en
`:root` / `.dark`, y `@theme` los publica como utilidades de Tailwind
(`bg-primary`, `text-critical`, `rounded-lg`, ...).

## Orden de las secciones en globals.css

| Lineas aprox. | Seccion |
|---|---|
| 1-5 | `@import 'tailwindcss'`, `tw-animate-css`, `shadcn/tailwind.css`, variante `dark` |
| 7-72 | `@theme` — publica los tokens como utilidades |
| 74-~740 | `@keyframes` y clases utilitarias propias |
| ~749-803 | `:root` — tema claro (hex) |
| ~814-870 | `.dark` — tema oscuro (oklch) |
| ~961+ | utilidades `prefers-reduced-motion` |

## Escala de radios

Derivada de un solo valor, `--radius: 0.75rem` (12px):

| Token | Formula | Valor |
|---|---|---|
| `--radius-sm` | `radius * 0.6` | 0.45rem |
| `--radius-md` | `radius * 0.8` | 0.6rem |
| `--radius-lg` | `radius` | 0.75rem |
| `--radius-xl` | `radius * 1.4` | 1.05rem |
| `--radius-2xl` | `radius * 1.8` | 1.35rem |
| `--radius-3xl` | `radius * 2.2` | 1.65rem |
| `--radius-4xl` | `radius * 2.6` | 1.95rem |

Usa `rounded-lg` como default. Cambiar `--radius` reescala todo.

## Semanticos clinicos

Definidos solo en `:root`. Cada uno tiene su variante `-foreground` (color del
texto/icono) y `-muted` (fondo suave de una banda o chip).

```
--critical: #dc2626    --critical-foreground: #dc2626    --critical-muted: #fef2f2
--warning:  #d97706    --warning-foreground:  #d97706    --warning-muted:  #fffbeb
--success:  #4ade80    --success-foreground:  #14532d    --success-muted:  #ecfdf5
```

Ojo al contraste: `--success` es un verde claro (`#4ade80`) y
`--success-foreground` es verde oscuro (`#14532d`). Para texto pequeno sobre
fondo blanco usa siempre `text-success-foreground`, no `text-success`.

## Trampa conocida: modo oscuro incompleto

`componentes/layout/estructura-app.tsx` fuerza el shell a claro:

```tsx
style={{ backgroundColor: "#ffffff", colorScheme: "light" }}
```

Consecuencias al trabajar en UI:

- El tema `.dark` existe y esta definido, pero la app se renderiza en claro.
- Los tokens `critical/warning/success` **no estan redefinidos** en `.dark`, asi
  que en oscuro caerian en los hex del tema claro.
- No añadas estilos oscuros "por si acaso": primero hay que quitar el
  `colorScheme: "light"` forzado y definir los semanticos en `.dark`.

Si te piden soporte oscuro real, es un cambio de tres partes: quitar el estilo
inline del shell, completar los semanticos clinicos en `.dark`, y revisar los
componentes con `dark:`.

## Clases propias de `globals.css`

No son utilidades de Tailwind; son animaciones y efectos del proyecto.

| Clase | Que hace |
|---|---|
| `clinical-card-expand-in` / `-out` | apertura/cierre de una tarjeta clínica (420ms / 240ms) |
| `clinical-card-backdrop-in` / `-out` | fondo del overlay |
| `animate-panel-in` | entrada del panel |
| `carenet-liquid-button`, `carenet-liquid-slide` | boton liquido |
| `carenet-button-feedback` | feedback tactile del boton |
| `carenet-logo-pulse`, `carenet-order-enter` | logo y entrada de ordenes |
| `aura-prioridad`, `aura-urgencia`, `aura-humo-1/2` | auras de estado clinico |
| `bia-*` (orb, cara, ojo, loading) | avatar/loader de BiA Care Net |
| `campana-viva` | notificacion viva |
| `icono-agua`, `icono-fuego`, `icono-latido` | iconos tematicos |

Todas las animaciones tienen su bloque `prefers-reduced-motion` en `globals.css`.
Al añadir una nueva, replica ese bloque.
