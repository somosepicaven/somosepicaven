import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth } from "./firebase-config.js";

// Función para manejar la autenticación anónima
export async function authenticateAnonymously() {
    try {
        const userCredential = await signInAnonymously(auth);
        console.log("Autenticación anónima exitosa", userCredential.user.uid);
        return userCredential.user;
    } catch (error) {
        console.error("Error en autenticación anónima:", error.code, error.message);
        throw error;
    }
}

// Observador del estado de autenticación
export function setupAuthListener(onUserStatusChanged) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Usuario está autenticado", user.uid);
            onUserStatusChanged(user);
        } else {
            console.log("Usuario ha cerrado sesión");
            onUserStatusChanged(null);
        }
    });
}
