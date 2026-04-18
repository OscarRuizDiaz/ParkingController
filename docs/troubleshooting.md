# Troubleshooting - ParkingController

Este documento registra los errores técnicos comunes encontrados durante el desarrollo y sus soluciones definitivas.

## 1. Error 500 al Actualizar Tarifa (Pydantic vs Dict)
- **Problema**: El servidor respondía con error 500 al intentar guardar cambios en el Motor Tarifario.
- **Causa**: El repositorio base esperaba un diccionario (`dict`), pero se le estaba enviando un objeto de Pydantic directamente.
- **Solución**: Se actualizó `BaseRepository.update` para detectar tipos automáticamente y realizar `model_dump()` (v2) o `dict()` (v1) según sea necesario.

## 2. Error de CORS en el Navegador
- **Problema**: El frontend no podía comunicarse con el backend a pesar de que ambos estaban corriendo.
- **Causa**: Falta de configuración de `CORSMiddleware` en FastAPI o desajuste en los orígenes permitidos.
- **Solución**: Se configuró explícitamente `allow_origins=["http://localhost:5173"]` en `main.py` y se aseguró que el middleware sea el primero en la cadena de ejecución.

## 3. Crash en TarifaScreen (Reading 'modo_calculo' of null)
- **Problema**: La pantalla de administración de tarifas se rompía al cargar.
- **Causa**: El componente React intentaba acceder a propiedades de la tarifa antes de que la petición `fetch` terminara (tarifa aún era `null`).
- **Solución**: Se añadió un control de renderizado `if (!tarifa)` que muestra un spinner de carga o un mensaje de error hasta que los datos sean válidos.

## 4. Error de Columna Muy Corta (modo_calculo)
- **Problema**: Fallo al insertar tarifas con nombres de modo largos como `BASE_MAS_EXCEDENTE_PROPORCIONAL`.
- **Causa**: El campo `modo_calculo` en la base de datos tenía un límite de `VARCHAR(30)`.
- **Solución**: Se amplió el límite a `VARCHAR(60)` en el modelo SQLAlchemy y se ejecutó la migración manual del constraint `chk_tarifa_modo`.

## 5. UnicodeEncodeError en Windows
- **Problema**: Los scripts de migración fallaban al imprimir emojis de éxito o error en la terminal de Windows.
- **Causa**: El terminal estándar usa `cp1252` que no soporta ciertos caracteres Unicode.
- **Solución**: Se eliminaron los emojis de los scripts críticos de mantenimiento para asegurar compatibilidad total en entornos Windows.
