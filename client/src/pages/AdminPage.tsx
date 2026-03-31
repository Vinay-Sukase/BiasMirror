import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import {
  deleteAdminSession,
  deleteAdminUser,
  exportResearchAnalytics,
  fetchAdminOverview,
  fetchAdminSessions,
  fetchAdminUsers
} from "@/lib/api";
import type { AdminOverviewResponse, AdminSessionsResponse, AdminUsersResponse } from "@/types/api";

export function AdminPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [users, setUsers] = useState<AdminUsersResponse | null>(null);
  const [sessions, setSessions] = useState<AdminSessionsResponse | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const [overviewData, userData, sessionData] = await Promise.all([
      fetchAdminOverview(),
      fetchAdminUsers(),
      fetchAdminSessions()
    ]);
    setOverview(overviewData);
    setUsers(userData);
    setSessions(sessionData);
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }
    void load();
  }, [isAuthenticated, isAdmin, navigate]);

  if (!isAuthenticated || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge>Admin console</Badge>
            <h2 className="mt-4 text-3xl font-semibold">Platform oversight and account controls</h2>
            <p className="mt-3 max-w-3xl text-haze">
              Use this panel to monitor platform usage, review active data, remove users or sessions, and export anonymized analytics for research review.
            </p>
          </div>
          <Button
            onClick={async () => {
              const blob = await exportResearchAnalytics();
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `biasmirror-research-export-${new Date().toISOString().slice(0, 10)}.json`;
              link.click();
              window.URL.revokeObjectURL(url);
            }}
          >
            Export anonymized analytics
            <Download className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-5">
        <Card><p className="text-sm text-haze">Users</p><p className="mt-3 text-3xl font-semibold">{overview?.counts.users ?? 0}</p></Card>
        <Card><p className="text-sm text-haze">Admins</p><p className="mt-3 text-3xl font-semibold">{overview?.counts.admins ?? 0}</p></Card>
        <Card><p className="text-sm text-haze">Sessions</p><p className="mt-3 text-3xl font-semibold">{overview?.counts.sessions ?? 0}</p></Card>
        <Card><p className="text-sm text-haze">Completed</p><p className="mt-3 text-3xl font-semibold">{overview?.counts.completedSessions ?? 0}</p></Card>
        <Card><p className="text-sm text-haze">In progress</p><p className="mt-3 text-3xl font-semibold">{overview?.counts.inProgressSessions ?? 0}</p></Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4">
          <div>
            <h3 className="text-2xl font-semibold">Users</h3>
            <p className="mt-1 text-haze">Delete test accounts or problematic user records when needed.</p>
          </div>
          <div className="space-y-3">
            {users?.users.map((user) => (
              <div key={user._id} className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-haze">{user.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge>{user.role}</Badge>
                      <Badge>{user.sessionCount} sessions</Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    disabled={user.role === "admin" || busyId === user._id}
                    onClick={async () => {
                      if (!window.confirm(`Delete ${user.email} and all related sessions?`)) return;
                      setBusyId(user._id);
                      await deleteAdminUser(user._id);
                      await load();
                      setBusyId(null);
                    }}
                  >
                    Delete account
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <h3 className="text-2xl font-semibold">Recent sessions</h3>
            <p className="mt-1 text-haze">Remove a specific assessment session without deleting the user account.</p>
          </div>
          <div className="space-y-3">
            {sessions?.sessions.slice(0, 12).map((session) => (
              <div key={session._id} className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold">{session.userId?.name ?? "Unknown user"}</p>
                    <p className="text-sm text-haze">{session.userId?.email ?? "No email"} · {session.status}</p>
                    <p className="mt-2 text-xs text-haze/80">{new Date(session.createdAt).toLocaleString()}</p>
                  </div>
                  <Button
                    variant="ghost"
                    disabled={busyId === session._id}
                    onClick={async () => {
                      if (!window.confirm("Delete this session and its stored events?")) return;
                      setBusyId(session._id);
                      await deleteAdminSession(session._id);
                      await load();
                      setBusyId(null);
                    }}
                  >
                    Delete session
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

    </div>
  );
}
