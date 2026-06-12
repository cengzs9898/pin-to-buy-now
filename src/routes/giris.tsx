import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import pintosLogo from "@/assets/pintos-logo.png.asset.json";
import { loginAccount } from "@/lib/api/airtable-auth.functions";

export const Route = createFileRoute("/giris")({
  head: () => ({
    meta: [
      { title: "Giriş Yap — Pintos" },
      { name: "description", content: "Pintos hesabına giriş yap. Kullanıcı veya satıcı olarak hesabına eriş." },
    ],
  }),
  component: Giris,
});

type Tab = "user" | "seller";

function Giris() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [msg, setMsg] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMsg("");
    try {
      await loginAccount({ data: { email, password, role: tab } });
      navigate({ to: tab === "seller" ? "/harita" : "/" });
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Giriş başarısız.");
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <nav className="sticky top-0 z-50 border-b border-hairline bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2" aria-label="Pintos">
            <img src={pintosLogo.url} alt="Pintos" className="h-8 w-auto" />
          </Link>
          <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Ana Sayfa
          </Link>
        </div>
      </nav>

      <main className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <img src={pintosLogo.url} alt="Pintos" className="mx-auto mb-4 h-10 w-auto" />
            <h1 className="text-2xl font-semibold tracking-tight">Giriş Yap</h1>
            <p className="mt-1 text-sm text-muted-foreground">Hesabına giriş yap, kaldığın yerden devam et.</p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-surface p-1 ring-1 ring-black/5">
            <button
              type="button"
              onClick={() => setTab("user")}
              className={
                tab === "user"
                  ? "rounded-lg bg-surface-2 py-2.5 text-sm font-medium text-foreground shadow-sm"
                  : "rounded-lg py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              }
            >
              Kullanıcı
            </button>
            <button
              type="button"
              onClick={() => setTab("seller")}
              className={
                tab === "seller"
                  ? "rounded-lg bg-surface-2 py-2.5 text-sm font-medium text-foreground shadow-sm"
                  : "rounded-lg py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              }
            >
              Satıcı
            </button>
          </div>

          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-2xl bg-surface p-6 shadow-lg shadow-zinc-200/40 ring-1 ring-black/5"
          >
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium">E-posta</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full rounded-xl border border-input bg-surface-2 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium">Şifre</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-xl border border-input bg-surface-2 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-xl bg-ink py-3 text-sm font-medium text-ink-foreground transition-transform hover:brightness-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              {status === "loading" ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
            {status === "error" && msg && <p className="text-center text-xs text-red-600">{msg}</p>}
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Hesabın yok mu?{" "}
            <Link to="/kayit-ol" className="font-medium text-foreground underline underline-offset-2">
              Kayıt ol
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
