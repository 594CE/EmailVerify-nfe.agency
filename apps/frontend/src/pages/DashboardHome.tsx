import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../utils/api";

const mockData = [
  { name: "Mon", verifications: 4000 },
  { name: "Tue", verifications: 3000 },
  { name: "Wed", verifications: 2000 },
  { name: "Thu", verifications: 2780 },
  { name: "Fri", verifications: 1890 },
  { name: "Sat", verifications: 2390 },
  { name: "Sun", verifications: 3490 },
];

import { useEffect } from "react";

export default function DashboardHome() {
  const [emailToVerify, setEmailToVerify] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [verificationResult, setVerificationResult] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/analytics");
        setAnalytics(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleVerify = async () => {
    try {
      const res = await api.post("/verify/single", { email: emailToVerify });
      setVerificationResult(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 h-24"
            ></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="text-sm text-slate-500">Total Verifications</div>
            <div className="text-2xl font-bold">{analytics?.total || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="text-sm text-slate-500">Deliverability Rate</div>
            <div className="text-2xl font-bold text-green-600">
              {analytics?.successRate || 0}%
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="text-sm text-slate-500">Bounce Risk</div>
            <div className="text-2xl font-bold text-red-500">
              {analytics?.bounceRisk || 0}%
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="text-sm text-slate-500">Disposable Emails</div>
            <div className="text-2xl font-bold text-orange-500">
              {analytics?.disposable || 0}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold mb-4">Quick Verify</h2>
        <div className="flex space-x-4">
          <input
            type="email"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter email to verify..."
            value={emailToVerify}
            onChange={(e) => setEmailToVerify(e.target.value)}
          />
          <button
            onClick={handleVerify}
            className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-500"
          >
            Verify
          </button>
        </div>
        {verificationResult && (
          <div className="mt-4 p-4 bg-slate-50 rounded-md border border-slate-200">
            <div className="font-medium">
              Result for {verificationResult.email}:
            </div>
            <div
              className={`text-lg font-bold ${verificationResult.status === "valid" ? "text-green-600" : "text-red-500"}`}
            >
              {verificationResult.status.toUpperCase()} (Score:{" "}
              {verificationResult.score})
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-96">
        <h2 className="text-lg font-semibold mb-4">Verification Volume</h2>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockData}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: "#f1f5f9" }} />
            <Bar dataKey="verifications" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
