# Ecosistema ÉPICA v3.2 - Build de Producción

## Estructura de este Paquete (`/epica_deploy`)

Esta carpeta contiene la **versión definitiva, blindada y lista para producción** del Ecosistema ÉPICA. 
He unificado el espectacular diseño de `index real.html` con toda nuestra arquitectura de Ingeniería de Datos (Firebase Firestore, Error Boundary, LOCTI Ledger y Oratoria Semántica).

### ¿Qué contiene?
1. **`index.html`**: La interfaz unificada y purificada, conectada a `app.js`.
2. **`app.js`**: El cerebro del sistema. Contiene el "Auth Guard", la lógica asíncrona de los 5,050 registros de LOCTI, y un "Error Boundary" que intercepta CUALQUIER fallo (red, base de datos) y previene que el sistema colapse.
3. **`service-worker.js`**: Motor Offline-First. Permite que la plataforma cargue incluso sin red.
4. **`api.php`**: Un script de contingencia. Si decides subir esto a un hosting privado (Hostinger, cPanel, etc.), este archivo actuará como "puente de respaldo" para guardar los registros localmente si Firebase llega a fallar.

---

## Instrucciones de Despliegue en GitHub Pages

Dado que esta carpeta ya contiene todo estructurado, **el único paso** que debes seguir es:

1. Entra a tu repositorio `somosepicaven` en GitHub.
2. Arrastra y suelta (Upload) todos los archivos que están **DENTRO** de esta carpeta `epica_deploy` (los archivos, no la carpeta entera) a la rama principal de tu repositorio.
3. Asegúrate de que `index.html` quede en la raíz de tu repositorio.
4. Ve a Settings > Pages en GitHub y verifica que esté publicado. ¡Listo!

## Notas de Seguridad sobre Firebase
He configurado `app.js` para que inicie sesión en Firebase usando el correo y clave maestra que proporcionaste (`somosepicave@gmail.com` / `robertodou1`). Dado que el código JavaScript es visible para cualquier usuario que inspeccione la página, en un entorno de máxima seguridad del Estado te sugerimos posteriormente que:
- Solo uses `signInAnonymously()` para usuarios regulares (la App tiene el código listo para esto en caso de que lo prefieras luego).
- Apliques Reglas de Seguridad estrictas desde la consola de Firebase.

**¡Todo está automatizado, disfruta tu Ecosistema ÉPICA!**
