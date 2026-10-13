---
name: CareNet Movimiento
description: Animaciones, microinteracciones y gestos en CareNet (GSAP + CSS propio). Usar al añadir o revisar cualquier animacion, transicion, gesto tactil, avatar animado, apertura de modal o efecto de scroll — y siempre que se toque prefers-reduced-motion. Define el guard obligatorio de reduced-motion, los patrones de GSAP ya usados en el repo y las clases CSS propias disponibles.
---

# CareNet — Movimiento y microinteracciones

El movimiento de este proyecto es parte de la identidad (avatar BiA, auras de
estado, tarjeta clínica que se expande, botón líquido). No es decoración, pero
tampoco puede imponerse: en un hospital, una animación de 2 segundos entre un
estado y su confirmación es un problema de usabilidad.

## Regla 1 — Toda animación respeta `prefers-reduced-motion`

No es opcional. Ya esta implementado en 8 puntos de `app/globals.css` y en
`componentes/ui/aura-clinica.tsx`, `componentes/ui/gestos-tactiles.tsx`,
`componentes/features/pacientes/paciente-avatar.tsx` y
`modal-detalle-paciente.tsx`.

En CSS, replica el bloque que ya existe en `globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  .mi-clase {
    animation: none;
    transition: none;
  }
}
```

En JS/TSX, **todo** hook o efecto con GSAP debe empezar con el guard:

```tsx
useEffect(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  // ... animacion
}, [])
```

El proyecto ya usa esta forma en `gestos-tactiles.ts`, `paciente-avatar.tsx` y
`modal-detalle-paciente.tsx`. Copiala, no la reescribas con un timeout.

Si añades un listener de `matchMedia`, lilita el listener en el cleanup.

## Regla 2 — Preferir CSS antes que JS

Para entrada, salida, hover y cambios de opacidad/transform, usa las clases
propias de `globals.css` o una `@keyframes` nueva. GSAP queda para lo que CSS
no puede: gestos, timelines encadenadas, animaciones ligadas a datos o scroll.

Animaciones ya definidas que debes reutilizar antes de inventar una:

| Clase | Uso tipico |
|---|---|
| `clinical-card-expand-in` | entrada de tarjeta que se expande (420ms) |
| `clinical-card-expand-out` | salida (240ms) |
| `clinical-card-backdrop-in` / `-out` | overlay detras |
| `animate-panel-in` | entrada de un panel |
| `carenet-button-feedback` | feedback tactil de boton |
| `carenet-liquid-slide` | deslizamiento del boton liquido |
| `carenet-order-enter` | entrada de una orden |
| `carenet-logo-pulse` | pulso del logo |
| `bia-loading-*`, `bia-orb-*` | loader / avatar BiA |

## Regla 3 — Presets de easing del proyecto

Para que dos animaciones se sientan del mismo sistema, usa estas curvas:

| Proposito | Curva | Duracion |
|---|---|---|
| Entrada con rebote suave | `cubic-bezier(0.22, 1, 0.36, 1)` | 420ms |
| Salida rapida | `cubic-bezier(0.4, 0, 1, 1)` | 240ms |
| Simple (hover, color) | `ease-out` / `transition-all` | 150-200ms |

No inventes curvas nuevas sin motivo. Si una animacion se siente "rara",
normalmente es porque la duracion no corresponde a la curva.

## Regla 4 — GSAP: como se usa aqui

Archivos que ya usan GSAP (copia su estructura):

- `componentes/features/pacientes/modal-detalle-paciente.tsx`
- `componentes/features/pacientes/paciente-avatar.tsx`
- `componentes/ui/gestos-tactiles.ts`

Puntos a respetar:

- `gsap.context()` + `useGSAP`-style, o limpia los tween en el cleanup del
  `useEffect`; nada de tweens huerfanos al desmontar.
- Un solo `gsap.matchMedia()` por componente para el guard de reduced-motion.
- Anima `transform` y `opacity`, no `width/height/top/left` (provoca layout).
- Un unico `transform` por elemento: si CSS ya anima `transform`, no lo pises
  con GSAP en el mismo elemento.
- Nada de animaciones criticas de bloque (`position: fixed` + durations largas)
  sin reduced-motion.

## Regla 5 — Los gestos tactiles ya existen

`componentes/ui/gestos-tactiles.ts` centraliza gestos y ya exporta lo necesario.
**No reimplementes swipe o drag desde cero** en un componente nuevo: reutiliza
ese modulo, y añadelo ahí si falta.

Aspectos que ese módulo ya resuelve y que debes conservar:

- Cada gesto tiene su bloque `prefers-reduced-motion` y su listener `matchMedia`.
- Siguen el patron Base UI del proyecto, no librerias sueltas.

## Al revisar un cambio de movimiento, comprueba

1. Guard de `prefers-reduced-motion` presente (CSS o JS).
2. Si es JS, el listener se limpia en el cleanup.
3. Anima `transform`/`opacity`, no propiedades de layout.
4. No pisa un `transform` que CSS ya anima.
5. Duracion coherente con el preset de la tabla.
6. En movil, el gesto no compite con el scroll vertical.
