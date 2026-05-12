import { Outlet, Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LayoutDashboard, Users, CreditCard, LogOut, File } from "lucide-react";

export default function DashboardLayout() {
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <span className="text-xl font-bold text-slate-800">EmailVerify</span>
        </div>
        <nav className="p-4 space-y-1">
          <Link
            to="/"
            className="flex items-center px-2 py-2 text-slate-700 hover:bg-slate-100 rounded-md"
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          <Link
            to="/bulk"
            className="flex items-center px-2 py-2 text-slate-700 hover:bg-slate-100 rounded-md"
          >
            <File className="mr-3 h-5 w-5" />
            Bulk Verification
          </Link>
          <Link
            to="/team"
            className="flex items-center px-2 py-2 text-slate-700 hover:bg-slate-100 rounded-md"
          >
            <Users className="mr-3 h-5 w-5" />
            Team
          </Link>
          <Link
            to="/billing"
            className="flex items-center px-2 py-2 text-slate-700 hover:bg-slate-100 rounded-md"
          >
            <CreditCard className="mr-3 h-5 w-5" />
            Billing
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center px-2 py-2 text-slate-700 hover:bg-slate-100 rounded-md"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
