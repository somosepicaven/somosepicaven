import { authenticateAnonymously, setupAuthListener } from "./auth.js";
import { fetchMilitantes, listenMilitantes, registerMilitantToDB, deleteMilitantFromDB } from "./mando-db.js";
import { syncCNEVotesRealtime, submitPhoneVoteToCloud } from "./cne-telemetry.js";
import { 
    handleMiEpicaLogin, certifyFeDeVida, handleRutaPedagogica, 
    handleLogisticaComunal, syncLogisticaToCloud, generateSHA256, auditLOCTIBatch 
} from "./features.js";
import { auth, db } from "./firebase-config.js";

// Global utilities that the UI/modules expect
window.safePushSystemLog = (msg) => {
    if (typeof window.pushSystemLog === 'function') {
        window.pushSystemLog(msg);
    } else {
        console.log("SYS_CORE >> " + msg);
    }
};

window.safeShowToast = (msg, type) => {
    if (typeof window.showToast === 'function') {
        window.showToast(msg, type);
    } else {
        console.log(`[${type}] TOAST: ` + msg);
    }
};

// Bind imported modules to window so inline HTML onclick handlers work
window.registerMilitant = async (e) => {
    e.preventDefault();
    if (!window.currentUser) {
        window.safeShowToast("Error: No autenticado en el sistema.", "error");
        return;
    }
    const name = document.getElementById('militant-name')?.value;
    const cid = document.getElementById('militant-id')?.value;
    const node = document.getElementById('militant-node')?.value;
    const skill = document.getElementById('militant-skill')?.value;
    const phone = document.getElementById('militant-phone')?.value;
    
    try {
        await registerMilitantToDB({ name, cid, node, skill, phone }, window.currentUser.uid);
        const form = document.getElementById('militant-form');
        if (form) form.reset();
        window.safeShowToast("Analista registrado exitosamente en la nube central.", "success");
    } catch(e) {
        window.safeShowToast("Falla de escritura en la base de datos.", "error");
    }
};

window.deleteMilitant = async (docId) => {
    if (!window.currentUser) return;
    try {
        await deleteMilitantFromDB(docId);
        window.safeShowToast("Analista removido de la base de datos.", "info");
    } catch(e) { }
};

window.handleMiEpicaLogin = handleMiEpicaLogin;
window.certifyFeDeVida = certifyFeDeVida;
window.handleRutaPedagogica = handleRutaPedagogica;
window.handleLogisticaComunal = handleLogisticaComunal;
window.syncLogisticaToCloud = syncLogisticaToCloud;
window.generateSHA256 = generateSHA256;
window.auditLOCTIBatch = auditLOCTIBatch;
window.submitPhoneVote = submitPhoneVoteToCloud;

// Inyectar contexto de FirebaseBridge para features.js
window.FirebaseBridge = { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
window.firebaseDB = db;

// Lógica de inicio y orquestación
document.addEventListener('DOMContentLoaded', async () => {
    console.log("ÉPICA App Initialized");

    // Configurar listener de auth para proteger consultas
    setupAuthListener((user) => {
        const cloudStatusEl = document.getElementById('nav-cloud-status');
        if (user) {
            window.currentUser = user;
            if(cloudStatusEl) {
                cloudStatusEl.className = "text-[9px] bg-emerald-950/40 border border-emerald-900/30 text-epica-mint font-mono px-2 py-0.5 rounded-md flex items-center gap-1";
                cloudStatusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-epica-mint animate-ping"></span> CONECTADO NUBE`;
            }

            // Iniciar escuchas solo si estamos en los respectivos paneles
            if (document.getElementById('panel-militantes') || document.querySelector('.militantes-table-container')) {
                listenMilitantes((data) => {
                    console.log("Datos actualizados de militantes:", data);
                    if (window.dbLocal) {
                        window.dbLocal = data;
                        if(typeof window.renderMilitantsTable === 'function') {
                            window.renderMilitantsTable();
                        }
                    }
                });
            }

            if (document.getElementById('content-simulador')) {
                syncCNEVotesRealtime();
            }

        } else {
            window.currentUser = null;
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
