# Centro de Innovación y Tecnología ÉPICA, C.A. - Plataforma Central

Este repositorio contiene la arquitectura refactorizada y modularizada de la plataforma de registro y control de militantes.

## Estructura del Proyecto

```text
/src
  ├── index.html            # Interfaz principal (UI/UX)
  ├── /css
  │   └── style.css         # Estilos globales y utilidades personalizadas
  ├── /js
      ├── app.js            # Orquestador principal e inicializador
      ├── auth.js           # Lógica de autenticación anónima
      ├── firebase-config.js# Configuración de Firebase y exportación de servicios
      └── mando-db.js       # Lógica de conexión a Firestore y sincronización de datos
```

## Configuración y Despliegue con Firebase Hosting

La arquitectura está preparada para integrarse nativamente con los servicios de Google Cloud a través de Firebase.

### 1. Requisitos Previos
- Node.js instalado en tu sistema.
- CLI de Firebase (`npm install -g firebase-tools`).

### 2. Configurar el Proyecto
1. Clona el repositorio o ubícate en la carpeta raíz del proyecto.
2. Inicia sesión en Firebase:
   ```bash
   firebase login
   ```
3. Inicializa el proyecto de Firebase:
   ```bash
   firebase init hosting
   ```
   - Selecciona el proyecto correspondiente (o crea uno nuevo).
   - Configura el directorio público como `src`.
   - Selecciona **No** para configurarlo como una single-page app (a menos que añadas un enrutador en el futuro).
   - Selecciona **No** a la configuración de deploys automáticos con GitHub (opcional).

### 3. Configurar Credenciales
Abre el archivo `src/js/firebase-config.js` y reemplaza los valores predeterminados con la configuración real de tu proyecto desde la consola de Firebase.

### 4. Configurar CI/CD con GitHub (Despliegues Automáticos)
Ya que gestionamos el proyecto con GitHub, usaremos GitHub Actions para que cada vez que hagas un `push` a la rama `main`, la aplicación se despliegue automáticamente en Firebase Hosting.

1. Inicializa la integración con GitHub ejecutando en tu terminal:
   ```bash
   firebase init hosting:github
   ```
2. El CLI te pedirá autenticarte con GitHub.
3. Ingresa tu repositorio (ejemplo: `usuario/repo-epica`).
4. El script configurará automáticamente los secretos en tu repositorio de GitHub (`FIREBASE_SERVICE_ACCOUNT_...`) y generará los archivos en `.github/workflows/`.

### 5. Prueba Local y Despliegue
Para probar los cambios en tu computadora antes de subirlos:
```bash
firebase serve
```

Una vez verificado, simplemente haz commit y push a GitHub:
```bash
git add .
git commit -m "Refactorización y arquitectura modular"
git push origin main
```
¡GitHub Actions detectará el push y subirá automáticamente tu aplicación a la nube!
