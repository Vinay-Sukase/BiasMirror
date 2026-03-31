import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

export function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        const response = await login({ email: form.email, password: form.password });
        navigate(response.user.role === "admin" ? "/admin" : "/assessment");
      } else {
        await register(form);
        navigate("/assessment");
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "We couldn't complete that request. Double-check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-haze">Secure access</p>
            <h2 className="mt-2 text-3xl font-semibold">{mode === "login" ? "Welcome back" : "Create your BiasMirror account"}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-haze">
              Admins can use the same login form. If your account has admin access, you will be routed to the admin console automatically.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/6 p-1">
            <button
              className={`rounded-full px-4 py-2 text-sm ${mode === "login" ? "bg-white/12 text-white" : "text-haze"}`}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm ${mode === "register" ? "bg-white/12 text-white" : "text-haze"}`}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <label className="block">
              <span className="mb-2 block text-sm text-haze">Name</span>
              <input
                className="w-full rounded-3xl border border-white/12 bg-white px-5 py-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-iris"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="A reflective decision-maker"
              />
            </label>
          ) : null}
          <label className="block">
            <span className="mb-2 block text-sm text-haze">Email</span>
            <input
              className="w-full rounded-3xl border border-white/12 bg-white px-5 py-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-iris"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="you@example.com"
              type="email"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-haze">Password</span>
            <input
              className="w-full rounded-3xl border border-white/12 bg-white px-5 py-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-iris"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="At least 8 characters"
              type="password"
            />
          </label>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <Button className="w-full" disabled={loading}>
            {loading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
