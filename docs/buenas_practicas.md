# Buenas Prácticas de Desarrollo - ParkingController

El desarrollo de este sistema sigue estándares industriales para asegurar la mantenibilidad y la robustez financiera.

## 1. Precisión Financiera (Uso de Decimal)
**Prohibido el uso de `float` para dinero**.
- Los cálculos financieros en ParkingController utilizan exclusivamente la clase `Decimal` de Python.
- Esto evita errores de redondeo de punto flotante que pueden causar discrepancias de céntimos en miles de transacciones.
- **Regla Oro**: El dinero siempre se cuantiza (`quantize`) antes de guardarse en la base de datos.

## 2. Separación de Responsabilidades (Desacoplamiento)
El sistema utiliza un patrón de **Inyección de Dependencias** y servicios especializados:
- **`ParkingService`**: Orquestador de lógica de alto nivel.
- **`Tarifador`**: Calculador matemático puro (Domain Service).
- Al separar el "Cálculo" del "Servicio de Estacionamiento", podemos probar las fórmulas tarifarias de forma aislada mediante tests unitarios sin levantar una base de datos.

## 3. Patrón Repository
- No se realizan llamadas directas a SQLAlchemy desde los servicios.
- Se utiliza un `BaseRepository` genérico para operaciones comunes.
- Esto permite cambiar la lógica de persistencia o el motor de base de datos en el futuro con un impacto mínimo en la lógica de negocio.

## 4. Validación de Datos (Pydantic)
- Todos los inputs de la API se validan mediante Schemas de Pydantic.
- Esto garantiza que ningún dato corrupto o mal formado llegue a la capa de servicios o base de datos.
- Se utiliza `model_validate` (v2) para asegurar compatibilidad con estándares modernos de tipado.

## 5. Manejo de Errores y Transacciones
- Cada operación de escritura utiliza bloques `try/except` con `db.commit()` y `db.rollback()`.
- Si una operación falla a mitad de camino (ej: se crea el cobro pero falla el cambio de estado del ticket), se deshacen todos los cambios para mantener la integridad de la base de datos.
- Se devuelven códigos HTTP semánticos (400, 404, 500) con detalles técnicos útiles para el cliente.
