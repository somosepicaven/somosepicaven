import { collection, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from "./firebase-config.js";

// ID de la aplicación, ajustable
const APP_ID = "epica-mando-central";

// Función para obtener todos los militantes y filtrarlos en memoria
export async function fetchMilitantes(filterFn) {
    try {
        const militantesRef = collection(db, "artifacts", APP_ID, "public", "data", "militantes");
        const querySnapshot = await getDocs(militantesRef);
        
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push(doc.data());
        });

        // Filtrar datos en el cliente
        if (filterFn) {
            return data.filter(filterFn);
        }
        
        return data;
    } catch (error) {
        console.error("Error obteniendo militantes:", error);
        throw error;
    }
}

// Escucha en tiempo real para mantener la tabla actualizada
export function listenMilitantes(callback) {
    const militantesRef = collection(db, "artifacts", APP_ID, "public", "data", "militantes");
    
    return onSnapshot(militantesRef, (snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
            data.push(doc.data());
        });
        
        // Ordenar por timestamp localmente, o lo que aplique
        data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        callback(data);
    }, (error) => {
        console.error("Error en Snapshot de Firebase:", error);
    });
}
