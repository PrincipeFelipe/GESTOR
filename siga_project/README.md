# SIGA Project

## Descripción
El proyecto SIGA es una aplicación web desarrollada con Django y Django REST Framework, que proporciona un sistema de gestión de usuarios, unidades y empleos. Este backend está diseñado para ser consumido por un frontend basado en React.

## Estructura del Proyecto
El proyecto está organizado en varias aplicaciones Django, cada una responsable de una parte específica del sistema:

- **users**: Maneja la gestión de usuarios, incluyendo un sistema de usuarios personalizado con campos adicionales.
- **unidades**: Gestiona las unidades organizativas.
- **empleos**: Maneja los diferentes empleos disponibles en la organización.
- **common**: Contiene utilidades y permisos personalizados que pueden ser utilizados en todo el proyecto.

## Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd siga_project/backend
   ```

2. **Crear un entorno virtual**
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Windows usa `venv\Scripts\activate`
   ```

3. **Instalar dependencias**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar variables de entorno**
   Copia el archivo `.env.example` a `.env` y configura las variables necesarias.

5. **Realizar migraciones**
   ```bash
   python manage.py migrate
   ```

6. **Ejecutar el servidor**
   ```bash
   python manage.py runserver
   ```

## Uso
Una vez que el servidor esté en funcionamiento, puedes acceder a la API en `http://localhost:8000/api/`. Asegúrate de consultar la documentación de la API para conocer los endpoints disponibles y cómo interactuar con ellos.

## Contribuciones
Las contribuciones son bienvenidas. Si deseas contribuir, por favor abre un issue o un pull request en el repositorio.

## Licencia
Este proyecto está bajo la Licencia MIT. Consulta el archivo LICENSE para más detalles.