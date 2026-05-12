import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./store/useAuthStore";
import DashboardLayout from "./components/DashboardLayout";
import { useEffect } from "react";
import DashboardHome from "./pages/DashboardHome";
import Login from "./pages/Login";
import BulkUpload from "./pages/bulk/BulkUpload";
import Billing from "./pages/billing/Billing";
import Team from "./pages/team/Team";
import { connectSocket, disconnectSocket } from "./utils/socket";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (token && user) {
      connectSocket();
    }
    return () => disconnectSocket();
  }, [token, user]);

  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="bulk" element={<BulkUpload />} />
            <Route path="billing" element={<Billing />} />
            <Route path="team" element={<Team />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
