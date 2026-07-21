# Kitten Verbs

Practico los 15 verbos irregulares en inglés que entran en mi evaluación:
`infinitive · past tense · past participle`, más el significado en español.

Tres formas de preguntar, todas mezcladas: **escribir** la forma que falta,
**elegir** entre cuatro opciones, y **completar la fila** entera como en el
examen escrito. Hay también un simulacro cronometrado.

## Los verbos

spell · spend · stand · steal · swim · take · teach · tell · think · throw ·
understand · wake · wear · win · write

Ocho son ABB (`spend / spent / spent`) y siete ABC (`swim / swam / swum`), y se
pueden practicar por separado.

Inglés americano: `spelled` es la forma canónica; `spelt` es británica, se
acepta al escribir pero no es la que se muestra.

## Decisiones

**La corrección es asimétrica.** El inglés se corrige con la escritura exacta,
porque la escritura *es* lo que se evalúa: perdonar `writen` sería enseñar el
error. El español se corrige sin tildes y acepta sinónimos, porque escribir
`enseñar` sin la tilde es un problema de teclado, no de conocimiento.

**Los distractores salen de verbos reales.** Las opciones falsas se toman del
mismo campo de otros verbos, prefiriendo los del mismo patrón. Confundir
`stolen` con `swum` es el error que de verdad se comete; una palabra inventada
se descarta de un vistazo y no enseña nada.

**El simulacro no revela nada hasta el final.** Sin opción múltiple y sin
corrección por pregunta, para que un acierto por suerte no infle la nota. Si se
acaba el tiempo, lo que no se respondió cuenta como fallado.

**Cada verbo entra antes de que se repita otro.** Un sorteo puramente aleatorio
preguntaría `write` cuatro veces y se saltaría `swim`.

## Correr el proyecto

```bash
bun install
bun dev
```

```bash
bun run build   # tsc -b && vite build
bun run lint
```

## Stack

Vite · React · TypeScript · CSS nativo con custom properties · cero
dependencias de UI y cero librerías de animación. El progreso vive en
`localStorage`; no hay backend.

Tema claro y oscuro según el sistema. El gatito es un SVG en línea, así que
cambia de humor sin pedir una imagen nueva.

## Lo nativo antes que la librería

Cada una de estas es una API del navegador haciendo el trabajo por el que
normalmente se pagan kilobytes:

| Para | Uso |
|---|---|
| Sonidos y ronroneo | Osciladores de Web Audio, sin archivos |
| Pronunciación | `speechSynthesis` con `lang` fijado a `en-US` a mano |
| Rutas y botón atrás | History API, enrutador propio de sesenta líneas |
| Transición entre pantallas | View Transitions API |
| Revelar al hacer scroll | `animation-timeline: view()` |
| Diálogos | `<dialog>` nativo: foco atrapado y Escape de fábrica |
| Vibración al responder | `navigator.vibrate`, solo donde existe |

Todas se comprueban antes de usarse y degradan solas donde no estén.

## Accesibilidad

`prefers-reduced-motion: reduce` apaga **todo** el movimiento: transiciones de
pantalla, revelados, contadores, partículas y el gato del fondo. Medido: cero
animaciones en marcha y ningún elemento atrapado invisible o desplazado.

Contraste AA verificado sobre elementos renderizados en ambos temas, foco
visible comprobado con Tab real, y objetivos táctiles de 44px o más.
