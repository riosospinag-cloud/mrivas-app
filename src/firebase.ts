import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// 🔥 Configuración de tu proyecto
const firebaseConfig = {
  apiKey: "AIzaSyBPQLOPoFTJSqSt7I5xSaq9GAaq9RqJLuI",
  authDomain: "mrivas-app.firebaseapp.com",
  projectId: "mrivas-app",
  storageBucket: "mrivas-app.firebasestorage.app",
  messagingSenderId: "498206141256",
  appId: "1:498206141256:web:deca23ace7389ffc4ca17d"
}

// 🔥 Inicializar Firebase
const app = initializeApp(firebaseConfig)

// 🔥 Autenticación
export const auth = getAuth(app)
export const provider = new GoogleAuthProvider()

// 🔥 Base de datos (ESTO ES LO QUE FALTABA)
export const db = getFirestore(app)