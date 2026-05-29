# El Juicio — Plan del Proyecto

## Estado: ✅ Desplegado en producción
- **URL:** https://el-juicio.vercel.app
- **Repo:** https://github.com/enriquevm79/el-juicio
- **Supabase:** proyecto "Duelo de conceptos" (guniybbhljhomrzmrclf)
- **Creado por:** Enrique Vázquez Mondragón

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
3. Moderador asigna equipos
4. Moderador carga el tema a debatir
5. Moderador inicia el debate
6. Fase de argumentación (tiempo configurable)
   - Equipo A presenta argumento (defensa)
   - Equipo B presenta argumento (refutación)
   - **AUTO-CORTE:** Cuando ambos equipos envían, pasa automáticamente a votación (sin esperar timer)
7. Fase de votación (tiempo configurable)
   - El jurado vota por el argumento más convincente
   - **AUTO-CORTE:** Cuando todos los jurados votan, pasa automáticamente a resultados
8. Resultados y ganador
9. Participantes pueden volver al inicio con botón

## Reglas de Negocio y Prevención de Errores

### PIN de Sesión
- PIN de 6 dígitos, único y activo solo mientras la sesión existe
- Validación: no se generan PINs duplicados (check en BD con índice único parcial)
- PIN expira al cerrar/cancelar sesión

### Acceso y Sesión
- NO se permite unirse una vez iniciado el debate (lobby se cierra)
- Reconexión por sessionStorage (si refrescan la página, no se duplican)
- Máximo 30 participantes por sesión
- Mínimo 1 persona por equipo para iniciar

### Votación
- Cada jurado vota UNA sola vez (enforced en BD con constraint UNIQUE)
- Los miembros de los equipos NO pueden votar (no ven botones de voto)
- Protección contra doble clic (estado `voting` en frontend)
- Si hay error de constraint unique, se detecta y marca como "ya votó"

### Desempate
- Criterio 1: El moderador tiene voto de desempate (voto de calidad)
- Criterio 2: Si persiste, el moderador decide

### Control del Anfitrión
- Puede pausar el debate en cualquier momento
- Puede cancelar la sesión (todos ven "Sesión Cancelada" + botón volver)
- Puede reiniciar (mismos participantes, borra argumentos y votos, nuevo tema)
- Puede forzar paso a votación manualmente
- Puede expulsar participantes individuales
- Puede cambiar el tema antes de iniciar
- Ve indicador en tiempo real de argumentos recibidos (✓/⏳)
- Ve conteo de votos en tiempo real durante votación

### Prevención de Errores Técnicos
- Cliente Supabase singleton (evita conexiones duplicadas)
- useRef para evitar doble ejecución en React Strict Mode
- hasJoined, hasLoaded, hasAutoTransitioned refs para operaciones únicas
- Protección contra doble envío de argumentos (estado `submitting`)
- Validación de host por localStorage (no se puede acceder al panel sin ser host)
- Auto-envío de argumento si el timer se acaba y hay texto suficiente

## Stack Tecnológico
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Framer Motion
- **Backend/DB:** Supabase (Realtime, PostgreSQL, Row Level Security)
- **Deploy:** Vercel
- **Iconos:** Lucide React
- **Tiempo real:** Supabase Realtime (channels por sesión)
- **Sonidos:** Web Audio API (generados en código, sin archivos externos)

## Diseño Visual
- Paleta: Azul oscuro (#0a1628), Cyan neón (#00d4ff), Plateado metálico (#c0c8d4), Rojo alarma (#ff2d2d)
- Estética: Tech/futurista inspirada en el escudo de la Facultad de Derecho UNAM
- Imagen de fondo (`fondo.jpg`) visible en TODAS las pantallas con opacity 7%
- Tipografía: Geist
- Mobile-first
- Firma: "Creado y diseñado por Enrique Vázquez Mondragón" en footer global

## Efectos de Tensión (Cronómetro)
- **Últimos 30 segundos:** Números cambian de cyan a naranja
- **Últimos 10 segundos:** Rojo + animación shake
- **Últimos 5 segundos:** Shake intenso + sonido tick (Web Audio API, volumen creciente)
- **Tiempo terminado:** Sonido buzzer + vibración del dispositivo
- **Resultados:** Sonido de martillo de juez (gavel)

## Estructura de Base de Datos (Supabase)

### Tabla: sessions
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid (PK) | ID de sesión |
| pin | varchar(6) | PIN único de acceso |
| host_id | uuid | ID del moderador |
| topic | text | Tema a debatir |
| status | enum | waiting, in_progress, voting, finished, cancelled |
| argument_time | int | Segundos para argumentar (default 180) |
| voting_time | int | Segundos para votar (default 60) |
| max_participants | int | Default 30 |
| created_at | timestamptz | Fecha de creación |

### Tabla: participants
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid (PK) | ID del participante |
| session_id | uuid (FK) | Sesión a la que pertenece |
| name | varchar(30) | Nombre del participante |
| role | enum | team_a, team_b, jury |
| is_active | boolean | Si está conectado |
| joined_at | timestamptz | Cuándo se unió |

### Tabla: votes
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid (PK) | ID del voto |
| session_id | uuid (FK) | Sesión |
| participant_id | uuid (FK) | Quién votó |
| voted_for | enum | team_a, team_b |
| created_at | timestamptz | Cuándo votó |
| UNIQUE(session_id, participant_id) | | Un voto por persona |

### Tabla: arguments
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid (PK) | ID |
| session_id | uuid (FK) | Sesión |
| team | enum | team_a, team_b |
| content | text | Texto del argumento (50-1000 chars) |
| submitted_at | timestamptz | Cuándo se envió |

### Realtime habilitado en:
- sessions, participants, votes, arguments

### Límites de Caracteres
- **Tema/Caso:** Mínimo 10, Máximo 300 caracteres
- **Argumentos:** Mínimo 50, Máximo 1,000 caracteres
- **Nombre de participante:** Mínimo 2, Máximo 30 caracteres

## Estructura de Archivos (Actual)
```
app/
├── page.tsx                    # Inicio: Crear Sesión / Unirse con PIN / ¿Cómo jugar?
├── como-jugar/page.tsx         # Manual del juego
├── host/
│   ├── page.tsx               # Configurar tiempos y crear sesión
│   └── session/[id]/page.tsx  # Panel de control del moderador
├── session/
│   └── [pin]/page.tsx         # Vista del participante (lobby/debate/votación/resultados)
├── results/[id]/page.tsx      # Resultados (vista moderador)
├── layout.tsx                 # Layout global (fondo, footer con firma)
└── globals.css                # Estilos, animaciones, paleta
lib/
├── supabase/
│   ├── client.ts              # Cliente browser (singleton)
│   └── server.ts              # Cliente server
├── types.ts                   # Tipos TypeScript
├── constants.ts               # Constantes (tiempos, límites, colores)
├── utils.ts                   # Utilidades (generar PIN, formatear tiempo)
└── sounds.ts                  # Sonidos generados con Web Audio API
components/
├── ui/                        # Button, Card, Input, Timer, PinDisplay
└── session/                   # DebateView, VotingView, ResultsView
public/
├── fondo.jpg                  # Imagen de fondo (escudo UNAM Derecho)
└── sounds/.gitkeep
supabase/
└── schema.sql                 # SQL completo para crear tablas
```

## Configuración
- `.env.local` con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
- `next.config.ts` con allowedDevOrigins para pruebas en red local
- Vercel: variables de entorno configuradas en el dashboard
