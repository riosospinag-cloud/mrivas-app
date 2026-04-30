import "./App.css"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "./pages/Login"
import AdminHome from "./pages/AdminHome"
import DriverHome from "./pages/DriverHome"
import ClientHome from "./pages/ClientHome"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/driver" element={<DriverHome />} />
        <Route path="/client" element={<ClientHome />} />
      </Routes>
    </BrowserRouter>
  )
}