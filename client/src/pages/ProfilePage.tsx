import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

export function ProfilePage() {
  const { auth } = useAuth();

  return (
    <div className="space-y-6">
      <Card>
        <Badge>Account</Badge>
        <h2 className="mt-4 text-3xl font-semibold">Profile and model transparency</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-[24px] border border-white/10 bg-white/6 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-haze">Name</p>
            <p className="mt-3 text-xl font-semibold">{auth?.user.name ?? "Guest"}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/6 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-haze">Email</p>
            <p className="mt-3 text-xl font-semibold">{auth?.user.email ?? "Not signed in"}</p>
          </div>
        </div>
      </Card>
      <Card>
        <h3 className="text-2xl font-semibold">Scientific disclaimer</h3>
        <p className="mt-4 max-w-3xl leading-8 text-haze">
          Model is based on inferred relationships, not direct ground truth labels. BiasMirror is designed to support reflection and pattern awareness, not to diagnose cognition or replace professional judgment.
        </p>
      </Card>
    </div>
  );
}
