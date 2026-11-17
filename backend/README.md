# Backend de RiskOps

API FastAPI con SQLAlchemy. Las rutas de negocio usan el prefijo `/api/v1`.

## Inicialización explícita

Desde el directorio `backend`, `python -m app.database.bootstrap` crea la base de datos si falta, espera la conexión, ejecuta `alembic upgrade head` y carga roles, categorías y administrador. La configuración procede del entorno; el comando no usa `create_all` ni se ejecuta automáticamente al arrancar la API. Está destinado a bases nuevas o ya versionadas por Alembic, sin estampar automáticamente bases anteriores creadas mediante `create_all`.

En Docker usa `docker compose run --rm backend python -m app.database.bootstrap` desde la raíz; el procedimiento completo está en el [README principal](../README.md). El comando histórico `python -m seeds.run_seeds` conserva su creación de tablas por metadata y ahora asegura primero que exista la base; para una instalación nueva con historial de migraciones utiliza bootstrap.

## Pruebas aisladas

Las fixtures sustituyen la sesión de la aplicación por SQLite en memoria y crean datos independientes para cada prueba. No requieren SQL Server ni una base de datos real.

Los comandos siguientes usan la imagen local `riskops-backend`, montan el código en modo lectura y deshabilitan la red, los archivos `.pyc` y la caché de pytest. Ejecútalos desde la raíz del repositorio; ajusta la ruta absoluta en Windows si el checkout está en otra ubicación.

PowerShell:

```powershell
docker run --rm --network none --mount "type=bind,source=C:\riskops\backend,target=/app,readonly" --env APP_ENV=test --env PYTHONDONTWRITEBYTECODE=1 --workdir /app riskops-backend python -m pytest -p no:cacheprovider -q --disable-warnings .
```

Unix:

```sh
docker run --rm --network none --mount "type=bind,source=$(pwd)/backend,target=/app,readonly" --env APP_ENV=test --env PYTHONDONTWRITEBYTECODE=1 --workdir /app riskops-backend python -m pytest -p no:cacheprovider -q --disable-warnings .
```

Si la imagen no existe, créala con `docker build -t riskops-backend ./backend`. Esa preparación instala dependencias; el aislamiento de red corresponde a la ejecución de las pruebas.

La suite cubre autorización, JWT, propiedad de notificaciones, transacciones y contratos de validación. Usa `user_factory`, `headers_for` y las fixtures de roles de `tests/conftest.py` para agregar casos sin depender de usuarios del entorno.

## Autenticación y permisos

Las rutas de negocio requieren `Authorization: Bearer <token>` de un usuario activo. Registro, inicio de sesión y `/health` permanecen públicos; `/auth/me` y el cambio de contraseña requieren autenticación. Las solicitudes CORS de preflight no necesitan token.

Los JWT requieren `exp`, `sub` e `iat`; `sub` debe identificar un usuario válido mediante un entero positivo expresado como texto. Los tokens vencidos o malformados y los usuarios inactivos reciben `401`, con `WWW-Authenticate: Bearer`.

Se conservan las restricciones de roles existentes. Autenticarse permite consultar las lecturas de negocio antes públicas; no concede permisos de escritura ni acceso al directorio de usuarios, que mantiene sus roles de administrador o gestor de riesgos.

Para marcar una notificación privada como leída se exige ser su propietario. Una notificación ajena devuelve el mismo `404` que una inexistente, sin modificarla ni devolver su contenido. Las notificaciones globales (`user_id = null`) siguen disponibles para usuarios autenticados; su marca de lectura continúa siendo compartida.

## Límite de las transacciones

Los métodos mutadores de servicios usan `@atomic` de `app/database/unit_of_work.py`. Una operación de negocio confirma sus cambios una sola vez, junto con el historial y las notificaciones que genere.

Las llamadas anidadas que comparten sesión participan en la misma unidad de trabajo. Si una falla, la operación completa se revierte; capturar una excepción interna no permite confirmar una transacción marcada para rollback.

Los repositorios realizan `flush` y los refrescos necesarios, sin ejecutar `commit`. El llamador debe proporcionar una unidad de trabajo cuando use repositorios fuera de los servicios.

## Contrato de errores

Las respuestas de éxito conservan `success` y `data`. Los errores mantienen `success: false`, `message` y `error_code`. Cuando hay detalles de validación se agrega opcionalmente `errors`:

```json
{
  "success": false,
  "message": "Datos de entrada invalidos.",
  "error_code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "probability",
      "location": ["body", "probability"],
      "message": "El valor mínimo es 1.",
      "type": "greater_than_equal"
    }
  ]
}
```

`location` identifica el origen y la ruta del error; los campos anidados usan nombres como `plans.0.title`. Un error general entre campos puede tener `field: null`. Los mensajes se presentan en español y no incluyen `input`, `ctx`, contraseñas, tokens ni el texto original de excepciones.

Los errores de dominio pueden proporcionar los mismos detalles mediante `AppError(..., errors=[...])`; los errores existentes sin detalles conservan su forma anterior. Los fallos no controlados devuelven un mensaje genérico con `INTERNAL_SERVER_ERROR`, sin detalles internos.

## Actualizaciones parciales

Riesgos, planes y acciones rechazan campos desconocidos en creación y actualización. Sus títulos admiten entre 3 y 200 caracteres y sus descripciones hasta 2000. Omitir un campo conserva su valor; `description: null` borra la descripción. Los campos no anulables rechazan un `null` explícito. En riesgos, `responsible_user_id: null` retira la asignación y registra el cambio, sin generar un aviso de nueva asignación.

Probabilidad e impacto admiten valores de 1 a 5. Crear una evaluación inicial requiere ambos ejes si se proporciona alguno. Al actualizar un riesgo, un eje no nulo se combina con el otro valor guardado; si falta ese valor, se devuelve un `422` que identifica el eje pendiente. Ambos ejes omitidos o nulos conservan la evaluación existente.

Una pareja de ejes modificada genera evaluación e historial en la misma transacción; una pareja idéntica o un cambio solo de título no genera otra evaluación. La evaluación promueve `IDENTIFIED` a `ASSESSED` y conserva los demás estados de trabajo. La alerta crítica se genera al entrar en `CRITICAL`.

Las fechas de un plan deben cumplir `due_date >= start_date`, incluso en cambios parciales: se comprueba la combinación final de valores guardados y enviados. La igualdad es válida y los errores identifican la fecha correspondiente. El comportamiento existente de progreso al 100 % sigue marcando el plan como `COMPLETED`.

## Indicadores de vencimiento

Un plan está vencido cuando su fecha límite es anterior a la fecha de referencia de la operación o su estado guardado es `OVERDUE`. `COMPLETED` y `CANCELLED` siempre quedan excluidos. Los planes activos incluyen `PLANNED`, `IN_PROGRESS` y `OVERDUE`.

El gráfico de mitigaciones agrupa por vencimiento efectivo, sin contar dos veces un plan. La analítica conserva el estado guardado al describir cada plan vencido. Consultar indicadores nunca reescribe estados ni otras filas de la base de datos.

## Consultas y paginación

Dashboard y análisis usan agregados SQL y proyecciones de columnas, sin cargar entidades completas ni relaciones por cada riesgo. El resumen ejecuta dos consultas; cada gráfico y la matriz, una. El análisis ejecuta cuatro consultas con datos y una si está vacío. La cantidad de consultas se mantiene al crecer los registros.

La matriz conserva las 25 celdas y sus `risk_ids`; por ese contrato, su respuesta crece con los riesgos evaluados. Las tendencias comparan los dos últimos meses observados de cada categoría. La agrupación conserva mayúsculas y espacios finales también en SQL Server.

`GET /api/v1/risks` exige `page >= 1`, `page_size` entre 1 y 100, `sort_by` igual a una columna escalar permitida y `sort_dir` igual a `asc` o `desc`. Los valores inválidos devuelven `422` con detalles del campo de consulta. Los valores predeterminados siguen siendo página 1, 20 resultados y orden por `created_at` descendente.
