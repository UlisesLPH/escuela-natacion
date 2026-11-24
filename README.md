# 🫧 Burbujas · Centro acuático

Aplicación web para administrar la escuela de natación **Burbujas**: registra a los **alumnos**, los organiza por **horarios** (quién está en cada grupo) y marca la **fecha de pago mensual** de cada uno. Solo entra el **administrador**, con usuario y contraseña.

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
| **Nuevo / editar alumno** | Captura de datos, cuota de inscripción, mensualidad y horarios (mostrando el cupo). La fecha de inscripción es la de hoy y no se puede cambiar. Muestra cuánto paga al inscribirse y cuándo es su primer pago. |
| **Horarios** | Grupos con días, hora de inicio y fin, nivel, instructor y ocupación. Se filtran por día de la semana. Ya vienen precargados los horarios de la escuela. |
| **Detalle de horario** | Lista de los alumnos inscritos en ese grupo con su próxima fecha de pago. |
| **Facturación** | Alumnos que piden factura con el pago que toca facturar (**hoy**, **próximos 7 días** o todos): concepto («Inscripción y mensualidad de noviembre 2026» o «Mensualidad de diciembre 2026»), importe y datos fiscales, con un botón para **copiar** todo y pegarlo en tu portal de facturación. |
| **Cuotas** | Inscripción y mensualidad vigentes (por defecto **$250** y **$850**). Al cambiarlas puedes aplicar la nueva mensualidad también a los alumnos activos. |

**Reglas principales**

- **Al inscribirse**, un alumno nuevo paga la **inscripción** ($250) y la **mensualidad** de ese mes ($850): **$1,100** en total. Los montos se proponen desde **Cuotas** y se pueden ajustar por alumno (por ejemplo, un descuento).
- **La fecha de inscripción es el día en que se registra** al alumno: no se elige ni se puede cambiar después.
- **Paga cada mes el mismo día de su inscripción.** Como el mes de la inscripción ya quedó pagado, el primer pago es el **mes siguiente**. Ejemplo: inscrito el 24 de noviembre → paga el **24 de diciembre**, el 24 de enero, etc.
- **Meses que no tienen ese día** (30 o 31 en febrero, 31 en abril, junio, septiembre o noviembre): el pago **se recorre al día 1 del mes siguiente**. Ejemplo: inscrito el 30 de enero → el pago de febrero cae el **1 de marzo**, y luego el 30 de marzo.
- Avisos: **Paga hoy**, **Próximos 7 días** o **Programado**.
- **Factura:** en la ficha de cada alumno se activa «Requiere factura» y se capturan **RFC, nombre o razón social, régimen fiscal, código postal del domicilio fiscal, uso de CFDI y correo**, tal como aparecen en la Constancia de Situación Fiscal. Se validan el formato del RFC (12 caracteres persona moral, 13 persona física), el C.P. de 5 dígitos, el correo y que el régimen y el uso de CFDI apliquen al tipo de persona. La aplicación **no timbra** el CFDI: reúne los datos para emitirlo en tu sistema de facturación.
- Un horario **no admite más alumnos que su cupo**.
- Un alumno **inactivo** conserva sus datos, pero deja de contar para el cupo y para los avisos.

**Catálogo de horarios precargado** (clases de una hora, cupo de 10 alumnos cada una):

| Días | Horarios |
| --- | --- |
| Lunes, miércoles y viernes | 4–5 pm · 5–6 pm · 6–7 pm · 7–8 pm · 8–9 pm |
| Martes y jueves | 4–5 pm · 5–6 pm · 6–7 pm |
| Sábado | 8–9 am · 9–10 am |

Se cargan solos la primera vez que arranca la API, cuando todavía no hay ningún horario. Después puedes editarlos (cupo, nivel, instructor), agregar otros o borrarlos desde la pantalla **Horarios**, y no se vuelven a crear.

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
│       │   ├── model/        Entidades: Estudiante (+ datos fiscales), Horario, Cuotas, Admin y catálogos del SAT
│       │   ├── repo/         Repositorios JPA
│       │   ├── web/          Controladores REST, DTO y validaciones
│       │   └── config/       Seguridad, JWT, administrador inicial y catálogo de horarios
│       ├── main/resources/application.properties
│       └── test/             Pruebas JUnit (base H2 en memoria)
└── frontend/                 Interfaz en Angular
    ├── Dockerfile            Compila Angular y lo sirve con nginx
    ├── nginx.conf            Sirve la app y reenvía /api al backend
    ├── proxy.conf.json       Proxy de /api para el modo desarrollo
    ├── public/logo.svg       Logo de Burbujas (también se usa como favicon.svg)
    └── src/app/
        ├── core/             Servicio de API, sesión, modelos y avisos
        ├── layout/           Menú lateral
        ├── shared/           Avatar, etiquetas de estado, diálogos
        └── pages/            Login, panel, alumnos, horarios, facturación y cuotas
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
| `GET` | `/api/cuotas` | Cuotas vigentes `{ inscripcion, mensualidad }` |
| `GET` | `/api/facturacion` | Próximo pago a facturar de cada alumno que pide factura |
| `GET` | `/api/catalogos/sat` | Catálogos de régimen fiscal y uso de CFDI |
| `PUT` | `/api/cuotas` | Cambiarlas. Con `aplicar_a_todos: true` también cambia la mensualidad de los alumnos activos |

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

## Cambiar el logo

El logo está en `frontend/public/logo.svg` (y `favicon.svg` para la pestaña del navegador). Para usar otro archivo, reemplaza esos dos archivos conservando el nombre, o pon tu imagen como `logo.png` y cambia `logo.svg` por `logo.png` en `frontend/src/app/layout/shell.component.ts` y `frontend/src/app/pages/login.component.ts`. Después reconstruye:

```bash
docker compose up -d --build web
```

## Problemas comunes

| Síntoma | Solución |
| --- | --- |
| `port is already allocated` al levantar | Otro programa usa el puerto 8000. Cambia `APP_PORT` en `.env` (por ejemplo `8080`) y vuelve a ejecutar `docker compose up -d`. |
| La página carga pero no deja entrar | Revisa `docker compose logs api`. La API tarda unos segundos en arrancar después de la base de datos. |
| Cambié `ADMIN_PASSWORD` y no funciona | El administrador solo se crea la primera vez. Para empezar de cero: `docker compose down -v` (borra los datos) y vuelve a levantar. |
| No veo mis cambios en el código | Reconstruye: `docker compose up -d --build`. |
| La fecha de «hoy» no coincide | Ajusta `TZ` en `.env` y reinicia: `docker compose up -d`. |
