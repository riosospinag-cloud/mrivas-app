import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyBPQLOPofTJSqSt7I5xSaq9GAaq9RqJLuI",
  authDomain: "mrivas-app.firebaseapp.com",
  projectId: "mrivas-app",
  storageBucket: "mrivas-app.firebasestorage.app",
  messagingSenderId: "498206141256",
  appId: "1:498206141256:web:deca23ace7389ffc4ca17d"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const provider = new GoogleAuthProvider()