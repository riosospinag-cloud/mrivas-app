import NuevoServicio from "./pages/NuevoServicio"
import Aprobaciones from "./pages/Aprobaciones"
import ClienteSolicitudes from "./pages/ClienteSolicitudes"
import DriverServicios from "./pages/DriverServicios"

import ProtectedRoute from "./components/ProtectedRoute"

import "./App.css"

import { BrowserRouter, Routes, Route } from "react-router-dom"

import Login from "./pages/Login"
import AdminHome from "./pages/AdminHome"
import DriverHome from "./pages/DriverHome"
import ClientHome from "./pages/ClientHome"
import SuperAdminHome from "./pages/SuperAdminHome"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route path="/" element={<Login />} />



        {/* SUPERADMIN */}
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute>
              <SuperAdminHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin/nuevo-servicio"
          element={
            <ProtectedRoute>
              <NuevoServicio />
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin/aprobaciones"
          element={
            <ProtectedRoute>
              <Aprobaciones />
            </ProtectedRoute>
          }
        />



        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminHome />
            </ProtectedRoute>
          }
        />



        {/* CONDUCTOR */}
        <Route
          path="/driver"
          element={
            <ProtectedRoute>
              <DriverHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver/servicios"
          element={
            <ProtectedRoute>
              <DriverServicios />
            </ProtectedRoute>
          }
        />



        {/* CLIENTE */}
        <Route
          path="/client"
          element={
            <ProtectedRoute>
              <ClientHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/client/nuevo-servicio"
          element={
            <ProtectedRoute>
              <NuevoServicio />
            </ProtectedRoute>
          }
        />

        <Route
          path="/client/solicitudes"
          element={
            <ProtectedRoute>
              <ClienteSolicitudes />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  )
}