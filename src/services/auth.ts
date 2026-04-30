import { auth } from "../firebase"
import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth"

const provider = new GoogleAuthProvider()

// 👉 Inicia login con Google (REDIRECT)
export const loginWithGoogle = async () => {
  await signInWithRedirect(auth, provider)
}

// 👉 Obtener usuario después del redirect
export const getGoogleRedirectUser = async () => {
  try {
    const result = await getRedirectResult(auth)

    if (result && result.user) {
      return result.user
    }

    return null
  } catch (error) {
    console.error("Error redirect Google:", error)
    return null
  }
}