import { useState, useEffect } from "react";
import { UserPlus, Settings, MoreVertical } from "lucide-react";
import api from "../../utils/api";

export default function Team() {
  const [_team, setTeam] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await api.get("/teams");
        setTeam(res.data.team);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/teams/invite", { email: inviteEmail });
      setInviteEmail("");
      alert("Invite sent!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Team Settings</h1>
          <p className="text-slate-500 mt-1">
            Manage your team members and roles.
          </p>
        </div>
        <button className="flex items-center text-slate-600 bg-white border border-slate-300 px-4 py-2 rounded-md hover:bg-slate-50">
          <Settings className="h-4 w-4 mr-2" />
          Workspace Settings
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Invite Member</h2>
        <form onSubmit={handleInvite} className="flex space-x-4">
          <input
            type="email"
            required
            className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="colleague@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <button
            type="submit"
            className="flex items-center bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-500 transition-colors"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Send Invite
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-semibold text-slate-800">Members</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {/* Mock members since we don't have a full member list endpoint yet */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
                JD
              </div>
              <div>
                <div className="font-medium text-slate-800">John Doe (You)</div>
                <div className="text-sm text-slate-500">john@example.com</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                Owner
              </span>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
