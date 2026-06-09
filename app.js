document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('epica-core-form');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Captura de variables estructuradas
            const formData = {
                perfil: document.getElementById('perfil').value,
                nombre: document.getElementById('nombre').value,
                cedula: document.getElementById('cedula').value,
                telefono: document.getElementById('telefono').value,
                email: document.getElementById('email').value,
                ubicacion: document.getElementById('ubicacion').value,
                timestamp: new Date().toISOString()
            };

            console.log('>> TRANSMITIENDO_DATA_NODO_CORE:', formData);

            // Mensaje de simulación de carga encriptada
            const submitBtn = form.querySelector('.btn-submit');
            submitBtn.textContent = 'ENCRIPTANDO Y TRANSMITIENDO DATOS...';
            submitBtn.disabled = true;

            // Aquí se conectará tu API REST en el despliegue final.
            // Por ahora simulamos la persistencia asíncrona.
            setTimeout(() => {
                alert(`[ÉPICA OS]: Acceso concedido. Nodo activado con éxito para: ${formData.nombre}. Tu solicitud ha sido registrada de forma Cero Papel.`);
                form.reset();
                submitBtn.textContent = 'EJECUTAR SOLICITUD DE ACCESO_';
                submitBtn.disabled = false;
            }, 2000);
        });
    }
});