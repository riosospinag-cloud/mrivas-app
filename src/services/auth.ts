import { auth } from "../firebase"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"

const provider = new GoogleAuthProvider()

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, provider)
  return result.user
}