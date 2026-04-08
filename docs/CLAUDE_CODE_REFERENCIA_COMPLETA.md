# Claude Code CLI — Referencia Completa de Comandos

---

## Comandos con /

### Información
| Comando | Qué hace |
|---------|----------|
| `/help` | Muestra ayuda y comandos disponibles |
| `/status` | Versión, modelo, cuenta, conexión |
| `/cost` | Uso de tokens de la sesión |
| `/usage` | Límites del plan y rate limits |
| `/doctor` | Diagnostica tu instalación |
| `/release-notes` | Changelog de versiones |

### Sesión
| Comando | Qué hace |
|---------|----------|
| `/clear` | Limpia la conversación (alias: `/reset`, `/new`) |
| `/exit` | Salir (alias: `/quit`) |
| `/resume` | Retomar sesión anterior |
| `/branch` | Crear branch de la conversación |
| `/rewind` | Rebobinar a un punto anterior |
| `/export` | Exportar conversación como texto |
| `/rename` | Renombrar sesión actual |
| `/compact` | Comprimir contexto (útil en sesiones largas) |
| `/context` | Ver uso del contexto como grilla visual |

### Modelo y Config
| Comando | Qué hace |
|---------|----------|
| `/model` | Cambiar modelo (Opus, Sonnet, Haiku) |
| `/effort` | Nivel de esfuerzo (low/medium/high/max) |
| `/fast` | Toggle modo rápido |
| `/config` | Abrir configuración (tema, modelo, estilo) |
| `/theme` | Cambiar tema visual |
| `/color` | Color de la barra del prompt |

### Código y Archivos
| Comando | Qué hace |
|---------|----------|
| `/diff` | Ver cambios uncommitted |
| `/copy` | Copiar última respuesta al clipboard |
| `/security-review` | Análisis de seguridad de cambios pendientes |
| `/add-dir` | Agregar directorio de trabajo |
| `/simplify` | Revisar código reciente por calidad/eficiencia |

### Planificación
| Comando | Qué hace |
|---------|----------|
| `/plan` | Entrar en modo plan |
| `/ultraplan` | Plan avanzado con revisión en browser |
| `/batch` | Cambios masivos en paralelo (5-30 agentes) |

### Memoria y Proyecto
| Comando | Qué hace |
|---------|----------|
| `/memory` | Editar archivos CLAUDE.md de memoria |
| `/init` | Inicializar proyecto con CLAUDE.md |
| `/skills` | Ver skills disponibles |
| `/stats` | Estadísticas de uso diario |
| `/insights` | Reporte de análisis de sesiones |

### Integraciones
| Comando | Qué hace |
|---------|----------|
| `/mcp` | Gestionar servidores MCP (Canva, Gmail, etc.) |
| `/plugin` | Gestionar plugins |
| `/ide` | Integraciones con VS Code, JetBrains |
| `/hooks` | Ver configuración de hooks |

### Cuenta
| Comando | Qué hace |
|---------|----------|
| `/login` | Iniciar sesión |
| `/logout` | Cerrar sesión |
| `/upgrade` | Cambiar de plan |
| `/privacy-settings` | Configuración de privacidad |

### Cloud y Deploy
| Comando | Qué hace |
|---------|----------|
| `/schedule` | Tareas programadas en la nube |
| `/autofix-pr` | Auto-arreglar PR cuando falla CI |
| `/remote-control` | Control remoto desde claude.ai |

---

## Atajos de Teclado

### Los más útiles para ti
| Atajo | Qué hace |
|-------|----------|
| `Ctrl+C` | Cancelar generación actual |
| `Ctrl+D` | Salir de Claude Code |
| `Ctrl+L` | Limpiar input (no borra conversación) |
| `Ctrl+V` | Pegar imagen del clipboard |
| `Shift+Tab` | Cambiar modo de permisos (default → auto → plan) |
| `Option+P` | Cambiar modelo sin limpiar prompt |
| `Option+T` | Toggle pensamiento extendido |
| `Option+O` | Toggle modo rápido |
| `Esc + Esc` | Rebobinar conversación |
| `Up/Down` | Navegar historial de comandos |

### Edición de texto
| Atajo | Qué hace |
|-------|----------|
| `Ctrl+K` | Borrar hasta fin de línea |
| `Ctrl+U` | Borrar hasta inicio de línea |
| `Ctrl+Y` | Pegar texto borrado |
| `Alt+B` | Retroceder una palabra |
| `Alt+F` | Avanzar una palabra |

### Input multilínea
| Método | Cómo |
|--------|------|
| Backslash | `\ + Enter` (funciona en todos los terminales) |
| macOS | `Option+Enter` |
| iTerm2/WezTerm | `Shift+Enter` (sin config) |

---

## Trucos Rápidos

### Modo Bash (!)
Escribe `!` al inicio para ejecutar comandos directamente:
```
! git status
! npm test
! ls -la
```
El output se agrega a la conversación.

### Mencionar archivos (@)
Escribe `@` para autocompletar rutas de archivos.

### Pregunta rápida (/btw)
```
/btw ¿qué versión de Node tengo?
```
Responde sin agregar al historial de conversación.

### Modo permisos
- **default** — pregunta antes de cada acción
- **acceptEdits** — acepta cambios de código automáticamente
- **auto** — aprueba todo automáticamente

Cambia con `Shift+Tab`.

---

## Configuración de Terminal (macOS)

Para que los atajos con Alt/Option funcionen:

**iTerm2:** Settings → Profiles → Keys → Left Option = "Esc+"
**VS Code:** `"terminal.integrated.macOptionIsMeta": true`
**Terminal.app:** Settings → Profiles → Keyboard → "Use Option as Meta Key"
