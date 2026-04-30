import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

// 🔥 CONFIGURACIÓN REAL DE TU PROYECTO
const firebaseConfig = {
  apiKey: "AIzaSyBPQLOPoFTJSqSt7I5xSaq9GAAq9RqJLuI",
  authDomain: "mrivas-app.firebaseapp.com",
  projectId: "mrivas-app",
  storageBucket: "mrivas-app.firebasestorage.app",
  messagingSenderId: "498206141256",
  appId: "1:498206141256:web:deca23ace7389ffc4ca17d"
}

// 🔥 INICIALIZAR FIREBASE
const app = initializeApp(firebaseConfig)

// 🔥 AUTH (LOGIN)
export const auth = getAuth(app)

// 🔥 PROVEEDOR GOOGLE
export const provider = new GoogleAuthProvider()