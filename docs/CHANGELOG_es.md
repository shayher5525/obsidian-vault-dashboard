# Registro de cambios de Vault Dashboard X

[English](../CHANGELOG.md) · [中文](CHANGELOG_zh.md) · [日本語](CHANGELOG_ja.md) · [한국어](CHANGELOG_ko.md) · [Français](CHANGELOG_fr.md) · **Español** · [Italiano](CHANGELOG_it.md)

> Esta traducción resume lo esencial de cada versión. Para el detalle de los razonamientos, consulta la [versión en inglés](../CHANGELOG.md).

## Versionado

Este proyecto sigue el versionado semántico (MAJOR.MINOR.PATCH).

| Parte | Cuándo sube | Ejemplo |
| --- | --- | --- |
| MAJOR | Cambio incompatible: `data.json` o ajustes incompatibles, migración manual necesaria, función eliminada | Renombrar un ajuste sin lectura de compatibilidad |
| MINOR | Nueva función, nuevo panel o pestaña, rediseño visible de interacción o aspecto | Añadir los bloques de acceso rápido |
| PATCH | Corrección, cambio de texto, ajuste de estilo — sin alterar lo que hace el plugin | Corregir un nivel de color sobrescrito; ajustar espaciado |

La fuente de verdad de la versión es `version` en `manifest.json`; la etiqueta de publicación es idéntica, sin prefijo `v`.

---

## [0.16.0] — 2026-09-02

### Añadido

- Nueva apariencia **Cielo azul** (`nio`), construida según la spec visual estilo NIO `AA_WorkMaterial 工作资料/91_DesignFiles 设计文件/2026-09-02_蔚来风格视觉设计规范.md` v1.0 (tomada de una presentación pública del manual NIO Visual Identity System 1.4). Solo se toma prestada la gramática visual: un único acento turquesa sobre un blanco de marca teñido de azul, lienzo oscuro Nocturnal Black y escalones de luminosidad azul-verde de la misma familia. Sin logotipo, sin eslogan y sin tipografía con licencia: Blue Sky se sustituye por una pila Montserrat / Inter / Source Han Sans. Un solo acento por pantalla: Tonal Teal `#004B64` en modo claro (≈7,0:1 sobre blanco) y Teal `#00BEBE` en modo oscuro (≈8,3:1 sobre negro); el Teal vivo `#00BEBE` queda reservado a la énfasis gráfica: barras de progreso, pico del mapa de calor y subrayado deslizante de 2px. Las grandes superficies usan Soft Blue y blancos azulados, el gris se queda en el texto, las esquinas son medianamente redondeadas (8–16px) con sombras suaves de baja opacidad, y el mapa de calor sigue una sola rampa de luminosidad Teal. La pestaña activa es un subrayado turquesa de 2px; las pestañas de acceso rápido son cápsulas con borde y estado activo teñido de turquesa.
- La prueba sin conexión suma quince guardas de Cielo azul: paleta HEX cerrada, ocho colores base declarados, alpha de las sombras primitivas ≤ 0,30, subrayado de la pestaña principal conforme a la regla de 2px, pico de calor en el Teal de marca, radios ≤ 16px, y el id `nio` más los ocho nombres localizados registrados. 42/42 comprobaciones pasan.

### Cambiado

- Los siete README pasan a listar seis temas.

## [0.15.1] — 2026-09-02

### Corregido

- Fast Food Pop, modo claro: los días sin actividad eran invisibles en el mapa de calor. El color de las celdas vacías y el fondo tras ellas eran ambos el dorado claro `#FFF4D6` — el mismo valor, un contraste de 1,00:1. Las celdas vacías pasan a blanco, lo que conserva el fondo dorado («el oro hace la superficie») y se lee como un hueco abierto en él. El modo oscuro ya se distinguía y no cambia.

## [0.15.0] — 2026-09-02

### Añadido

- Nueva apariencia **Escena negra** (`sony`), construida según la spec visual estilo Sony `AA_WorkMaterial 工作资料/91_DesignFiles 设计文件/2026-09-02_索尼风格视觉设计规范.md` v1.0 (tomada a su vez del manual de identidad de Sony Electronics USA de 2007). Solo se toma prestada la gramática visual: fondo negro, marco abierto, sans-serif geométrica y un único punto de luz de color. Sin logotipo, sin eslogan y sin tipografía con licencia: ITC Avant Garde se sustituye por una pila Poppins / Jost / Questrial / Source Han Sans. La base es negro puro `#000000`, no un negro suavizado; la profundidad procede de tres escalones de luminosidad (`#000000` → `#0D0D0D` → `#1A1A1A`) en lugar de sombras, y las esquinas son rectas (como máximo 2px en los controles). Un solo color de acento por pantalla: ocean `#00A4E8` en modo oscuro (7,4:1 sobre negro) y slate `#165B65` en modo claro. El claro no reutiliza ocean porque cae a unos 2,7:1 sobre blanco y no puede sostener texto: la spec exige revisar el contraste en vez de invertir la paleta oscura. El acento nunca rellena un bloque, así que la pestaña activa es un subrayado deslizante de 2px y no una píldora rellena, las cifras de las tarjetas siguen en negro o blanco, y los enlaces son el único texto con color. El modo oscuro es la forma canónica de la spec; el claro sigue su propia regla de inversión para páginas densas en texto.
- La prueba sin conexión suma cinco guardas de Escena negra, cada una tomada de una regla dura de la spec: paleta HEX cerrada, sin tintado con `rgba()` (los colores se usan al 100%), sin sombras, radios ≤ 2px y los ocho colores base realmente declarados.

### Cambiado

- Los siete README pasan a listar cinco temas.

## [0.14.0] — 2026-09-01

### Añadido

- Nueva apariencia **Fast Food Pop** (`fastfood`), construida según la spec visual estilo McDonald's v1.0. Paleta limitada a Gold `#FFBC0D`, Red `#DB0007`, White y neutros adaptados (`#1A1A1A`, `#5C5C5C`, `#E6E6E6`, `#242424`) — sin Speedee, arcos ni wordmark, solo la gramática del color. Light: White + barra Gold + texto negro, Red reservado para estados activos, datos clave y picos de calor (« el oro hace la superficie, el rojo el punto »). Dark: `#1A1A1A` + `#242424` + Gold como acento y única excepción de texto en oro. Gradiente de calor gold-tint → gold → red.

### Cambiado

- La apariencia `modern` renombrada **Apple → Tech minimalista** (y equivalentes localizados). El id interno `modern` y la clase CSS `vdash-style-modern` no cambian, las selecciones existentes en `data.json` se conservan.
- La apariencia `starbucks` renombrada **Starbucks Café → Casa del Café**. El id interno y la clase CSS no cambian.
- Los siete README (inglés + zh/ja/ko/fr/es/it) actualizados para listar cuatro temas y los nuevos nombres.

## [0.13.0] — 2026-09-01

### Añadido

- La prueba sin conexión protege ahora la gama Starbucks: deben declararse los ocho HEX estándar, no puede aparecer ningún otro HEX y cada color translúcido debe derivarse del RGB de uno de esos ocho colores.

### Cambiado

- **La apariencia «Starbucks Café» se reconstruyó según la norma visual v2.0.** Las primitivas quedan limitadas a `#006241`, `#00754A`, `#D4E9E2`, `#1E3932`, negro, `#F2F0EB`, `#F9F9F9` y blanco. Se eliminaron los verdes inventados, marrones café, beiges y colores de gráfico ajenos. Los tokens semánticos y de componente, el modo oscuro, las sombras y transparencias derivan solo de esta paleta. También se alinearon la escala de 8px y la altura mínima de 44px; las celdas del mapa de calor tienen nombres accesibles y admiten teclado cuando son interactivas.

## [0.12.1] — 2026-09-01

### Cambiado

- Los textos de ajustes ya no aluden a la bóveda personal del autor. «Registro de cambios» se describe ahora por a quién sirve y cómo cuenta. Se limpiaron tres comentarios de código con la misma suposición: el plugin no tiene paso de compilación, así que `main.js` es lo que la gente lee.
- Se añadieron registros traducidos en `docs/`, uno por idioma de README, enlazados desde cada README. El `CHANGELOG.md` raíz pasa a estar en inglés.

## [0.12.0] — 2026-09-01

### Cambiado

- **`useMtime` ahora está activado por defecto.** En la mayoría de bóvedas las notas no tienen fecha ni en el frontmatter ni en el nombre de archivo: desactivado, el mapa de calor queda casi vacío y una instalación nueva muestra una página en blanco. Un pico falso por sincronización, en cambio, se ve, se explica y se puede desactivar. **Las configuraciones existentes no cambian.**
- Con un solo bloque configurado, el título pasa a ser «Acceso rápido · nombre del bloque». Antes, un único bloque no dibujaba pestañas de primer nivel, así que el nombre de esa carpeta no aparecía en ningún sitio.

## [0.11.0] — 2026-09-01

### Añadido

- Botones «Seleccionar todo» y «Desmarcar todo» en el selector de subcarpetas.

### Cambiado

- Los README traducidos se movieron a `docs/`; en la raíz queda solo el inglés. Todos los README se actualizaron.

## [0.10.0] — 2026-09-01

### Añadido

- Bajo la ruta de cada bloque de acceso rápido se listan sus subcarpetas inmediatas con casillas que deciden cuáles se convierten en pestañas de segundo nivel. Si se marcan todas, las añadidas después aparecen automáticamente.
- El selector va dentro de un panel `<details>`, plegado por defecto, cuyo resumen indica «Todas (N)» o «n de N seleccionadas».

### Cambiado

- **Los nombres de carpeta ya no pierden su prefijo numérico: se muestra el nombre completo.** El tratamiento anterior seguía la convención de nombres del autor; para los demás, `2024_Q1 Reports` se mostraba como `Reports` — desaparecía no solo el número sino también la primera palabra. Si quieres un nombre corto, escríbelo en «Nombre visible».
- Página de ajustes: la zona de acceso rápido queda alineada a la izquierda con el título y las filas de ajustes nativas.

## [0.9.0] — 2026-08-29

### Añadido

- La apariencia Starbucks también usa el resaltado deslizante.
- La barra de navegación superior pasa a vidrio esmerilado (`backdrop-filter`). Es sticky: el contenido se desplaza por debajo, que es lo que da sentido al desenfoque.

### Cambiado

- **El mapa de calor se invierte: de izquierda a derecha, de lo más reciente a lo más antiguo.** Cuando es más ancho que su contenedor, la barra de desplazamiento en el extremo izquierdo ya muestra los datos recientes.
- La parte superior de la barra de navegación queda sellada: al desplazarse ya no asoma contenido por encima.

### Corregido

- El color del texto ya no cambia antes de que llegue el deslizador al cambiar de pestaña. Antes, texto blanco quedaba unos 0,2 s sobre fondo blanco, ilegible.

## [0.8.1] — 2026-08-29

### Cambiado

- `column-gap` y `row-gap` de la cuadrícula se fusionan en `gap`, evitando un falso positivo del lint CSS del directorio comunitario.

## [0.8.0] — 2026-08-29

### Añadido

- Idiomas de la interfaz de 3 a 8 (se añaden francés, italiano, japonés, coreano y español; las 63 cadenas están en todos).
- Resaltado deslizante en cuatro grupos de pestañas. Se desactiva automáticamente con `prefers-reduced-motion: reduce`.

### Cambiado

- «Carpetas visuales» pasa a «Acceso rápido» en los 8 idiomas.
- Apariencia Apple revisada: mapa de calor y acceso rápido sobre fondo blanco con esquinas redondeadas y borde fino; espaciados más ajustados; pestañas sin contorno ni anillo de selección.

### Corregido

- El fondo propio de las pestañas tapaba el deslizador durante el recorrido.
- Cambiar `excludedPrefixes` no actualizaba el total de notas.

## [0.7.1] — 2026-08-26

### Corregido

- **Dos reglas de `styles.css` dañadas por una reescritura masiva con expresiones regulares.** Por eso las transiciones y los estilos `:hover` de las pestañas nunca habían funcionado.

### Cambiado

- El flujo de publicación genera atestaciones de artefactos y notas de versión automáticas; se añadió `package-lock.json`.

## [0.7.0] — 2026-08-24

### Añadido

- Selector de idioma en los ajustes (entonces solo afectaba a la página de ajustes).

### Cambiado

- El nombre visible del plugin pasa a `Vault Dashboard`; la zona de ajustes de bloques adopta una cuadrícula de tres columnas.

## [0.6.0] — 2026-08-24

### Añadido

- Los bloques pasan a ser configurables: hasta 5, cada uno apuntando a cualquier carpeta con su nombre visible. La ruta se valida al escribir.

### Cambiado

- La lista adopta una estructura única: bloque seleccionado → pestañas de sus subcarpetas → lista de notas.

## [0.5.0] — 2026-08-24

### Añadido

- Tercera apariencia, «Café Starbucks».

### Cambiado

- Nombres de apariencia acortados a «Apple» y «Consola Y2K» (el valor por defecto no cambia).

### Corregido

- En Starbucks, el texto de la pestaña seleccionada era invisible y las celdas sin actividad se fundían con el fondo.

## [0.4.0] — 2026-08-24

### Añadido

- Selector de apariencia en los ajustes y nueva apariencia «Consola Y2K»; la apariencia original también se reelaboró.

### Cambiado

- Se aplica una clase de apariencia en el elemento raíz; el antiguo ajuste `universal` migra automáticamente a `y2k`.

## [0.3.0] — 2026-08-24

### Añadido

- Bloque de acceso rápido al final de la vista de resumen. Los enlaces de notas siempre se abren en una pestaña nueva.

### Cambiado

- Rediseño completo sobre un sistema de tokens; el mapa de calor pasa a una escala de cinco colores sólidos.

### Corregido

- Las cinco reglas de nivel del mapa de calor no llevaban su prefijo de ámbito, así que todas las celdas se dibujaban con el color del nivel más alto.

## [0.2.1] y anteriores

Sin registros. Este archivo se mantiene desde 0.3.0.
