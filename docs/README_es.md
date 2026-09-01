# Vault Dashboard X

[English](../README.md) · [中文](README_zh.md) · **Español** · [日本語](README_ja.md) · [한국어](README_ko.md) · [Français](README_fr.md) · [Italiano](README_it.md)

Un panel para tu bóveda de Obsidian: un mapa de calor de actividad, una vista de distribución por carpetas y accesos rápidos configurables, todo en un solo panel.

## Características

- **Mapa de calor de actividad** — una cuadrícula de contribuciones estilo GitHub que muestra cuán activa está tu bóveda (o un changelog) a lo largo del tiempo, con rangos `Todo / 30 días / 7 días`. Las semanas más recientes están a la izquierda.
- **Distribución por carpetas** — un desglose de tus notas por carpeta de primer nivel, con filas expandibles, barras de proporción sobre el padre y conteos de «nuevo este mes».
- **Acceso rápido** — hasta 5 bloques configurables. Cada uno apunta a una carpeta, lista sus notas modificadas más recientemente y muestra como pestañas de segundo nivel las subcarpetas que marques. Los nombres de carpeta se muestran tal cual.
- **Dos fuentes de datos** — una fuente genérica de «actividad de notas» (funciona en cualquier bóveda) y un analizador «changelog» opcional para changelogs de Markdown.
- **Tres temas** — Apple, Y2K Console y Starbucks Café.
- **Internacionalización** — inglés (predeterminado), chino simplificado, chino tradicional, japonés, coreano, francés, español e italiano.

## Fuentes de datos

### Actividad de notas (predeterminada)

Cada nota contribuye con un «día de actividad», resuelto con esta cadena de respaldo:

1. El campo `updated` del frontmatter (el nombre del campo es configurable).
2. `created` / `date` del frontmatter.
3. Un prefijo `YYYY-MM-DD` en el nombre del archivo.
4. La hora de modificación del archivo (`mtime`) — **activada por defecto**. En la mayoría de bóvedas las notas no tienen fecha ni en el frontmatter ni en el nombre de archivo; sin este recurso el mapa de calor quedaría casi vacío. Si un servicio de sincronización actualiza las fechas en bloque y crea un pico falso, desactívala en los ajustes.

La actividad de notas funciona de inmediato en cualquier bóveda, sin configuración adicional.

### Changelog

Cuenta las entradas de uno o más archivos de changelog. Un analizador lee las secciones `## YYYY-MM-DD` y cuenta los elementos de lista de primer nivel bajo cada fecha:

```markdown
## 2026-08-23

- Publicar el informe de julio
- Corregir una errata en la guía de estilo

> Nota: las citas en bloque bajo una sección de fecha se ignoran.
```

Cada archivo puede ser una nota única o una carpeta (todos los archivos `.md` de su interior, sin recursión).

## Uso

Abre el panel desde el icono de la cinta o el comando **«Abrir panel»**.

- Pestaña **Resumen** — mapa de calor y tarjetas de resumen.
- Pestaña **Carpetas** — distribución por carpetas.
- Haz clic en una celda del mapa de calor del changelog para saltar a la sección de ese día (solo en modo changelog).
- Haz clic en una fila de carpeta para expandir.

## Ajustes

| Ajuste | Descripción |
| --- | --- |
| Idioma | Idioma de la interfaz para la página de ajustes y el panel. |
| Apariencia | Estilo visual: Apple, Y2K Console o Starbucks Café. |
| Fuente de datos de actividad | Actividad de notas o Changelog. |
| Campo de fecha de actividad | Campo del frontmatter usado primero en la cadena de respaldo de actividad de notas. |
| Recurrir a la hora de modificación del archivo | Usar `mtime` como último recurso (activado por defecto). |
| Rutas de changelog | Archivos/carpetas analizados en modo changelog. |
| Acceso rápido | Hasta 5 bloques; cada uno apunta a una carpeta y lista sus notas recientes. |
| Subcarpetas a mostrar | Por bloque: marca qué subcarpetas se convierten en pestañas de segundo nivel. Si las marcas todas, las añadidas después aparecen automáticamente. |

## Instalación

### Desde el directorio de la comunidad (una vez publicado)

Instala «Vault Dashboard X» desde **Ajustes → Plugins de la comunidad** y luego actívalo.

### Manual

1. Descarga `main.js`, `manifest.json` y `styles.css` desde la última versión.
2. Crea `.obsidian/plugins/vault-dashboard-x/` en tu bóveda.
3. Copia los tres archivos en esa carpeta.
4. Activa el plugin en **Ajustes → Plugins de la comunidad**.

## Registro de cambios

[Registro completo](CHANGELOG_es.md) — qué cambió en cada versión y por qué.

## Licencia

[GNU General Public License v3.0](../LICENSE)

## Desarrollo

**No hay paso de compilación** — `main.js` es el artefacto del plugin. Después de editar, desactiva y reactiva el plugin (o ejecuta `Reload app`) en Obsidian para que se apliquen los cambios.

- Sube las versiones con `npm version <patch|minor|major>`; sincroniza `manifest.json` y `versions.json` automáticamente.
- Ejecuta las comprobaciones de cordura de la capa de datos sin conexión con `node test/harness.js`.

La etiqueta de versión **debe ser igual** a la `version` en `manifest.json`, sin prefijo `v`; `main.js`, `manifest.json` y `styles.css` se adjuntan como recursos de versión separados.
