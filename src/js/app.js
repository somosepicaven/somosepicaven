import { authenticateAnonymously, setupAuthListener } from "./auth.js";
import { fetchMilitantes, listenMilitantes } from "./mando-db.js";

// Lógica de inicio y orquestación
document.addEventListener('DOMContentLoaded', async () => {
    console.log("ÉPICA App Initialized");

    // Configurar listener de auth para proteger consultas
    setupAuthListener((user) => {
        const cloudStatusEl = document.getElementById('nav-cloud-status');
        if (user) {
            if(cloudStatusEl) {
                cloudStatusEl.className = "text-[9px] bg-emerald-950/40 border border-emerald-900/30 text-epica-mint font-mono px-2 py-0.5 rounded-md flex items-center gap-1";
                cloudStatusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-epica-mint animate-ping"></span> CONECTADO NUBE`;
            }

            // Iniciar escucha de militantes solo tras autenticarse
            listenMilitantes((data) => {
                console.log("Datos actualizados de militantes:", data);
                // Aquí se inyectaría a la tabla, e.g. renderMilitantsTable(data)
                // Se integra con el renderizador del HTML existente
                if (window.dbLocal) {
                    window.dbLocal = data;
                    if(typeof window.renderMilitantsTable === 'function') {
                        window.renderMilitantsTable();
                    }
                }
            });
        } else {
            if(cloudStatusEl) {
                cloudStatusEl.className = "text-[9px] bg-red-950/40 border border-red-900/30 text-red-400 font-mono px-2 py-0.5 rounded-md flex items-center gap-1";
                cloudStatusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> SIN NUBE`;
            }
        }
    });

    // Iniciar login anónimo
    try {
        await authenticateAnonymously();
    } catch (e) {
        console.error("Error al arrancar la app segura:", e);
    }
});
