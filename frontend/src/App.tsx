import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Materials } from "./pages/Materials";
import { Admin } from "./pages/Admin";
import { Profile } from "./pages/Profile";
import { RequestForm } from "./pages/RequestForm";
import { Workflow } from "./pages/Workflow";
import { Documents } from "./pages/Documents";
import { ComingSoon } from "./pages/ComingSoon";
import { NAV_VISIBILITY } from "./lib/roles";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/materials" element={<Materials />} />
        <Route
          path="/request"
          element={
            <ProtectedRoute allow={NAV_VISIBILITY.request}>
              <RequestForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workflow"
          element={
            <ProtectedRoute allow={NAV_VISIBILITY.workflow}>
              <Workflow />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute allow={NAV_VISIBILITY.documents}>
              <Documents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allow={NAV_VISIBILITY.admin}>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
