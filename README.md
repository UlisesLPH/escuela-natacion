# 🏊 Escuela de Natación

Aplicación web para administrar una escuela de natación: registra a los **alumnos**, los organiza por **horarios** (quién está en cada grupo) y marca la **fecha de pago mensual** de cada uno. Solo entra el **administrador**, con usuario y contraseña.

> La aplicación **no cobra ni registra pagos**: únicamente indica cuándo le toca pagar a cada alumno.

---

## Índice

1. [Qué hace](#qué-hace)
2. [Tecnologías](#tecnologías)
3. [Requisitos](#requisitos)
4. [Levantar el proyecto](#levantar-el-proyecto)
5. [Comandos de Docker](#comandos-de-docker)
6. [Cómo funciona](#cómo-funciona)
7. [Estructura del proyecto](#estructura-del-proyecto)
8. [API](#api)
9. [Subir el proyecto a tu Git](#subir-el-proyecto-a-tu-git)
10. [Problemas comunes](#problemas-comunes)

---

## Qué hace

| Pantalla | Para qué sirve |
| --- | --- |
| **Iniciar sesión** | Acceso solo para el administrador. |
| **Panel** | Alumnos activos, a quién le toca pagar **hoy** y en los **próximos 7 días**, suma de mensualidades y las clases del día con sus alumnos. |
| **Alumnos** | Listado en **tarjetas** o **tabla**. Busca por nombre, tutor o teléfono; filtra por horario o por fecha de pago, y ordena por próximo pago, nombre o día del mes. |
| **Ficha del alumno** | Datos personales, tutor y contacto, horarios inscritos y su **próxima fecha de pago** en grande. |
| **Nuevo / editar alumno** | Captura de datos, día de pago (1–31), mensualidad y selección de horarios mostrando el cupo disponible. |
| **Horarios** | Grupos con días, hora de inicio y fin, nivel, instructor y ocupación. Se filtran por día de la semana. |
| **Detalle de horario** | Lista de los alumnos inscritos en ese grupo con su próxima fecha de pago. |

**Reglas principales**

- Cada alumno tiene un **día de pago** al mes. La app calcula su **próxima fecha de pago**: si ese día ya pasó este mes, muestra el del mes siguiente.
- Avisos: **Paga hoy**, **Próximos 7 días** o **Programado**.
- Si alguien paga el día 29, 30 o 31, en los meses más cortos se toma el **último día del mes**.
- Un horario **no admite más alumnos que su cupo**.
- Un alumno **inactivo** conserva sus datos, pero deja de contar para el cupo y para los avisos.

## Tecnologías

| Parte | Tecnología |
| --- | --- |
| Frontend | **Angular 19** (componentes standalone, signals), servido por **nginx** |
| Backend | **Java 21** + **Spring Boot 3.4** (Spring Web, Spring Security con JWT, Spring Data JPA) |
| Base de datos | **PostgreSQL 16** |
| Contenedores | **Docker** y **Docker Compose** |

## Requisitos

Solo necesitas:

- **Docker Desktop** (Windows o macOS) o **Docker Engine + Docker Compose** (Linux).
- **Git**, para descargar el proyecto.

**No** hace falta instalar Java, Maven, Node ni PostgreSQL: todo se compila y se ejecuta dentro de los contenedores.

## Levantar el proyecto

### 1. Descargar el código

```bash
git clone https://github.com/UlisesLPH/escuela-natacion.git
cd escuela-natacion
```

### 2. Crear el archivo de configuración

```bash
cp .env.example .env
```

En Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

Abre `.env` y cambia por lo menos `SECRET_KEY` y `ADMIN_PASSWORD`. Estas son todas las variables:

| Variable | Para qué sirve | Valor por defecto |
| --- | --- | --- |
| `APP_PORT` | Puerto de tu equipo donde se abre la app | `8000` |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Base de datos | `natacion` |
| `SECRET_KEY` | Clave con la que se firman las sesiones | *cámbiala* |
| `ADMIN_USER` / `ADMIN_PASSWORD` | Administrador que se crea al primer arranque | `admin` / `admin123` |
| `TZ` | Zona horaria (define qué día es «hoy») | `America/Mexico_City` |

### 3. Construir y levantar los contenedores

```bash
docker compose up -d --build
```

La primera vez tarda unos minutos, porque descarga las imágenes y compila Java y Angular. Las siguientes veces es mucho más rápido.

### 4. Entrar

Abre **<http://localhost:8000>** y entra con `ADMIN_USER` / `ADMIN_PASSWORD` (por defecto `admin` / `admin123`).

Para confirmar que todo está arriba:

```bash
docker compose ps
```

Los servicios `web`, `api` y `db` deben aparecer como `running`, y `db` como `healthy`.

## Comandos de Docker

Ejecútalos desde la carpeta del proyecto.

| Qué quieres hacer | Comando |
| --- | --- |
| Levantar todo (y compilar si hubo cambios) | `docker compose up -d --build` |
| Ver el estado de los contenedores | `docker compose ps` |
| Ver los logs de todos los servicios | `docker compose logs -f` |
| Ver los logs solo de la API | `docker compose logs -f api` |
| Detener sin borrar nada | `docker compose stop` |
| Volver a encender lo detenido | `docker compose start` |
| Apagar y quitar contenedores (**conserva los datos**) | `docker compose down` |
| Reconstruir solo el frontend | `docker compose up -d --build web` |
| Reconstruir solo el backend | `docker compose up -d --build api` |
| Correr las pruebas del backend | `docker compose run --rm api-test` |
| Angular en modo desarrollo con recarga en vivo (<http://localhost:4200>) | `docker compose --profile dev up frontend-dev` |
| Entrar a la base de datos | `docker compose exec db psql -U natacion natacion` |

> ⚠️ `docker compose down -v` **borra el volumen `pgdata`, es decir, todos los alumnos y horarios.** Úsalo solo si quieres empezar con la base vacía.

### Respaldar y restaurar la base de datos

```bash
docker compose exec db pg_dump -U natacion natacion > respaldo.sql
```

```bash
docker compose exec -T db psql -U natacion natacion < respaldo.sql
```

## Cómo funciona

```
 Navegador ──► http://localhost:8000
                   │
           ┌───────▼────────┐
           │  web (nginx)   │  Sirve Angular. Las rutas /api/* se reenvían a la API.
           └───────┬────────┘
                   │ /api
           ┌───────▼────────┐
           │ api (Spring)   │  Reglas del negocio, validaciones y seguridad (JWT).
           └───────┬────────┘
                   │ JDBC
           ┌───────▼────────┐
           │ db (Postgres)  │  Datos guardados en el volumen «pgdata».
           └────────────────┘
```

- Solo el servicio **`web`** se publica en tu equipo (puerto `APP_PORT`). La API y la base de datos quedan en la red interna de Docker.
- **Inicio de sesión:** Angular envía usuario y contraseña a `POST /api/login`. La API compara contra la contraseña cifrada con BCrypt y devuelve un **token JWT** válido por 12 horas. Angular lo guarda y lo manda en cada petición (`Authorization: Bearer …`). Si el token vence, la app regresa al login.
- **Primer arranque:** la API crea las tablas (Hibernate) y el administrador definido en `.env` si todavía no existe.
- **Fecha de pago:** se calcula en el backend (`Estudiante.proximoPago`) con la zona horaria de `TZ`, así todas las pantallas coinciden.
- Los servicios opcionales `frontend-dev` y `api-test` solo arrancan cuando los pides con `--profile dev` o `run`.

## Estructura del proyecto

```
escuela-natacion/
├── docker-compose.yml        Servicios: db, api, web (+ frontend-dev y api-test opcionales)
├── .env.example              Plantilla de configuración (copiar a .env)
├── backend/                  API en Java / Spring Boot
│   ├── Dockerfile            Compila con Maven y ejecuta con Java 21
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/escuelanatacion/
│       │   ├── model/        Entidades: Estudiante, Horario, Admin (+ cálculo de fecha de pago)
│       │   ├── repo/         Repositorios JPA
│       │   ├── web/          Controladores REST, DTO y validaciones
│       │   └── config/       Seguridad, JWT y administrador inicial
│       ├── main/resources/application.properties
│       └── test/             Pruebas JUnit (base H2 en memoria)
└── frontend/                 Interfaz en Angular
    ├── Dockerfile            Compila Angular y lo sirve con nginx
    ├── nginx.conf            Sirve la app y reenvía /api al backend
    ├── proxy.conf.json       Proxy de /api para el modo desarrollo
    └── src/app/
        ├── core/             Servicio de API, sesión, modelos y avisos
        ├── layout/           Menú lateral
        ├── shared/           Avatar, etiquetas de estado, diálogos
        └── pages/            Login, panel, alumnos y horarios
```

## API

Todas las rutas requieren `Authorization: Bearer <token>`, salvo `POST /api/login` y `GET /api/salud`. El JSON usa nombres en `snake_case`.

| Método | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/api/login` | `{ "usuario", "password" }` → `{ "token", "usuario" }` |
| `GET` | `/api/salud` | Comprobar que la API responde |
| `GET` | `/api/panel` | Resumen del panel |
| `GET` | `/api/estudiantes` | Lista. Filtros: `q`, `horario`, `estado=hoy\|pronto\|programado`, `inactivos=1` |
| `POST` | `/api/estudiantes` | Alta de alumno |
| `GET` `PUT` `DELETE` | `/api/estudiantes/{id}` | Ver, editar o eliminar |
| `GET` | `/api/horarios` | Lista. Filtro: `dia=lun…dom` |
| `POST` | `/api/horarios` | Alta de horario |
| `GET` `PUT` `DELETE` | `/api/horarios/{id}` | Ver (con alumnos), editar o eliminar |

Si los datos no son válidos, la API responde `422` con `{ "errores": ["…"] }`.

## Subir el proyecto a tu Git

1. Crea un repositorio **vacío** en GitHub, GitLab o Bitbucket, sin README ni .gitignore.
2. Desde la carpeta del proyecto:

```bash
git init
git add .
git commit -m "Escuela de natación: Spring Boot + Angular + PostgreSQL en Docker"
git branch -M main
git remote add origin https://github.com/UlisesLPH/escuela-natacion.git
git push -u origin main
```

El archivo `.env`, que contiene tus contraseñas, **no se sube**: está en `.gitignore`. Tampoco se suben `node_modules`, `target` ni `dist`, porque Docker los genera al construir.

## Problemas comunes

| Síntoma | Solución |
| --- | --- |
| `port is already allocated` al levantar | Otro programa usa el puerto 8000. Cambia `APP_PORT` en `.env` (por ejemplo `8080`) y vuelve a ejecutar `docker compose up -d`. |
| La página carga pero no deja entrar | Revisa `docker compose logs api`. La API tarda unos segundos en arrancar después de la base de datos. |
| Cambié `ADMIN_PASSWORD` y no funciona | El administrador solo se crea la primera vez. Para empezar de cero: `docker compose down -v` (borra los datos) y vuelve a levantar. |
| No veo mis cambios en el código | Reconstruye: `docker compose up -d --build`. |
| La fecha de «hoy» no coincide | Ajusta `TZ` en `.env` y reinicia: `docker compose up -d`. |
