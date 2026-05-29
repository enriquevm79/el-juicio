# Duelo de Conceptos — Plan del Proyecto

## Concepto
Juego interactivo móvil de debate estilo juicio Common Law para la Facultad de Derecho UNAM.
Dos equipos (1-3 personas cada uno) se enfrentan: uno defiende un tema, otro lo refuta con argumentos.
El resto de participantes (hasta 30 total) actúan como jurado y votan al mejor argumento.
Un moderador (profesor) controla toda la sesión.

## Roles
- **Anfitrión/Moderador (Profesor):** Crea sesión, carga tema, define tiempos, controla flujo, puede cancelar/reiniciar/regenerar sesión.
- **Equipo A (Defensa):** 1-3 personas que defienden el tema.
- **Equipo B (Refutación):** 1-3 personas que refutan el tema.
- **Jurado:** Resto de participantes que votan.

## Flujo del Juego
1. Moderador crea sesión → se genera PIN único de 6 dígitos
2. Participantes se unen con el PIN desde sus móviles
3. Moderador asigna equipos (o se auto-asignan)
4. Moderador carga el tema a debatir
5. Moderador inicia el debate
6. Fase de argumentación (tiempo configurable por el moderador)
   - Equipo A presenta argumento (defensa)
   - Equipo B presenta argumento (refutación)
7. Fase de votación (tiempo configurable)
   - El jurado vota por el argumento más convincente
8. Resultados y ganador

## Reglas de Negocio y Prevención de Errores

### PIN de Sesión
- PIN de 6 dígitos, único y activo solo mientras la sesión existe
- Validación: no se generan PINs duplicados (check en BD antes de asignar)
- PIN expira al cerrar/cancelar sesión
- PIN no reutilizable (se genera nuevo al regenerar sesión)

### Acceso y Sesión
- NO se permite unirse una vez iniciado el debate (lobby se cierra)
- Participantes desconectados tienen ventana de reconexión (30s)
- Si no reconectan, se marcan como inactivos
- Máximo 30 participantes por sesión
- Mínimo 2 participantes para iniciar (1 por equipo mínimo)

### Votación
- Cada jurado vota UNA sola vez (enforced en BD con constraint unique)
- Los miembros de los equipos NO pueden votar
- El moderador NO vota
- Voto es anónimo para los equipos, visible para el moderador

### Desempate
- Criterio 1: El moderador tiene voto de desempate (voto de calidad)
- Criterio 2: Si el moderador no desea votar, se extiende 1 minuto más de argumentación y se revota
- Criterio 3: Si persiste empate tras segunda ronda, el moderador decide

### Control del Anfitrión
- Puede pausar el debate en cualquier momento
- Puede cancelar la sesión (expulsa a todos)
- Puede reiniciar (mismos participantes, nuevo tema)
- Puede regenerar sesión (nuevo PIN, todos deben reconectarse)
- Puede expulsar participantes individuales
- Puede extender tiempos en vivo

## Stack Tecnológico
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Framer Motion
- **Backend/DB:** Supabase (Auth, Realtime, PostgreSQL, Row Level Security)
- **Deploy:** Vercel
- **Iconos:** Lucide React
- **Tiempo real:** Supabase Realtime (channels por sesión)

## Diseño Visual
- Paleta: Azul oscuro (#0a1628), Cyan neón (#00d4ff), Plateado metálico (#c0c8d4), Rojo alarma (#ff2d2d)
- Estética: Tech/futurista inspirada en el escudo de la Facultad de Derecho UNAM
- Logo como fondo con overlay oscuro
- Tipografía: Geist (ya configurada)
- Mobile-first (uso principal en celulares)

## Efectos de Tensión (Cronómetro)
- **Últimos 30 segundos:** Los números cambian de cyan a naranja
- **Últimos 10 segundos:** Los números cambian a rojo (#ff2d2d), empiezan a temblar (shake animation)
- **Últimos 5 segundos:** El temblor se intensifica, el número pulsa (scale up/down), toda la pantalla tiene un leve flash rojo en los bordes
- **Cada segundo final (5, 4, 3, 2, 1):** Sonido de "tick" grave, cada vez más fuerte
- **Último segundo:** Sonido de buzzer/alarma de tribunal
- **Tiempo terminado:** Flash de pantalla, vibración del dispositivo (si el navegador lo permite), sonido de martillo de juez

### Sonidos
- `tick.mp3` — tick grave para los últimos 5 segundos
- `buzzer.mp3` — alarma final cuando se acaba el tiempo
- `gavel.mp3` — martillo de juez al revelar resultados
- `victory.mp3` — fanfarria corta para el equipo ganador
- Todos los sonidos se pre-cargan al entrar a la sesión para evitar lag
- El moderador puede silenciar sonidos desde su panel

## Estructura de Base de Datos (Supabase)

### Tabla: sessions
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid (PK) | ID de sesión |
| pin | varchar(6) | PIN único de acceso |
| host_id | uuid (FK) | ID del moderador |
| topic | text | Tema a debatir |
| status | enum | waiting, in_progress, voting, finished, cancelled |
| argument_time | int | Segundos para argumentar |
| voting_time | int | Segundos para votar |
| created_at | timestamp | Fecha de creación |
| max_participants | int | Default 30 |

### Tabla: participants
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid (PK) | ID del participante |
| session_id | uuid (FK) | Sesión a la que pertenece |
| name | varchar | Nombre del participante |
| role | enum | team_a, team_b, jury |
| is_active | boolean | Si está conectado |
| joined_at | timestamp | Cuándo se unió |

### Tabla: votes
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid (PK) | ID del voto |
| session_id | uuid (FK) | Sesión |
| participant_id | uuid (FK) | Quién votó |
| voted_for | enum | team_a, team_b |
| created_at | timestamp | Cuándo votó |
| UNIQUE(session_id, participant_id) | | Un voto por persona |

### Límites de Caracteres
- **Tema/Caso:** Mínimo 10, Máximo 300 caracteres
- **Argumentos:** Mínimo 50, Máximo 1,000 caracteres
- **Nombre de participante:** Mínimo 2, Máximo 30 caracteres

### Tabla: arguments (opcional, para registro)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid (PK) | ID |
| session_id | uuid (FK) | Sesión |
| team | enum | team_a, team_b |
| content | text | Texto del argumento |
| submitted_at | timestamp | Cuándo se envió |

## Estructura de Archivos (Planeada)
```
app/
├── page.tsx                    # Landing / unirse con PIN
├── host/
│   ├── page.tsx               # Dashboard del moderador
│   ├── create/page.tsx        # Crear nueva sesión
│   └── session/[id]/page.tsx  # Control de sesión activa
├── session/
│   └── [pin]/
│       ├── page.tsx           # Lobby (esperando inicio)
│       ├── debate/page.tsx    # Vista durante debate
│       └── vote/page.tsx      # Vista de votación
├── results/[id]/page.tsx      # Resultados finales
├── layout.tsx
└── globals.css
lib/
├── supabase/
│   ├── client.ts              # Cliente browser
│   ├── server.ts              # Cliente server
│   └── middleware.ts          # Middleware auth
├── types.ts                   # Tipos TypeScript
├── constants.ts               # Constantes (tiempos default, etc)
└── utils.ts                   # Utilidades (generar PIN, etc)
components/
├── ui/                        # Componentes base (Button, Card, Timer, etc)
├── host/                      # Componentes del moderador
├── session/                   # Componentes de sesión
└── shared/                    # Header, Logo, etc
```

## Fases de Implementación
1. **Base:** Setup Supabase, esquema BD, auth del moderador, estructura de archivos
2. **Flujo principal:** Crear sesión, unirse con PIN, lobby en tiempo real
3. **Debate:** Asignación de equipos, timer, fases de argumentación
4. **Votación:** Sistema de votos, prevención de duplicados, resultados
5. **Control:** Panel del moderador (pausar, cancelar, reiniciar, expulsar)
6. **Polish:** Animaciones, responsive, manejo de errores, reconexión
