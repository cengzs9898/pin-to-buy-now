import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import pintosLogo from "@/assets/pintos-logo.png.asset.json";
import { registerAccount } from "@/lib/api/airtable-auth.functions";

export const Route = createFileRoute("/kayit-ol")({
  head: () => ({
    meta: [
      { title: "Satıcı Kaydı — Pintos" },
      {
        name: "description",
        content: "Pintos'a satıcı olarak kayıt ol. Alıcılar için kayıt gerekmez.",
      },
    ],
  }),
  component: KayitOl,
});

function KayitOl() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");
    setStatusMsg("");

    if (!email || !password || !confirmPassword || !fullName || !businessName) {
      setStatus("error");
      setStatusMsg("Lütfen tüm alanları doldur.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("error");
      setStatusMsg("Şifreler eşleşmiyor.");
      return;
    }
    if (password.length < 6) {
      setStatus("error");
      setStatusMsg("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (!agreed) {
      setStatus("error");
      setStatusMsg("Devam etmek için şartları kabul etmelisin.");
      return;
    }

    setStatus("loading");
    try {
      const result = await registerAccount({
        data: { email, password, fullName, role: "seller", businessName },
      });
      if (result.success) {
        setStatus("success");
        setStatusMsg("Hesap oluşturuldu, giriş yapıldı.");
        setTimeout(() => navigate({ to: "/satici/profil" }), 500);
      } else {
        setStatus("error");
        setStatusMsg("Bir hata oluştu, tekrar dene.");
      }
    } catch (err) {
      setStatus("error");
      setStatusMsg(err instanceof Error ? err.message : "Bir hata oluştu, tekrar dene.");
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
            <h1 className="text-2xl font-semibold tracking-tight">Satıcı Kaydı</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              İşletmeni Pintos'a ekle. Alıcılar için kayıt gerekmez.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl bg-surface p-6 shadow-lg shadow-zinc-200/40 ring-1 ring-black/5"
          >
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-xs font-medium">Ad Soyad</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ali Veli"
                className="w-full rounded-xl border border-input bg-surface-2 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label htmlFor="businessName" className="mb-1.5 block text-xs font-medium">İşletme Adı</label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Veli Tekel"
                className="w-full rounded-xl border border-input bg-surface-2 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

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

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-medium">Şifre Tekrar</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-xl border border-input bg-surface-2 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 size-4 rounded border-border text-brand accent-brand"
              />
              <label htmlFor="terms" className="text-xs leading-relaxed text-muted-foreground">
                <span className="text-foreground">Kullanım Koşulları</span> ve{" "}
                <span className="text-foreground">Gizlilik Politikası</span>'nı okudum ve kabul ediyorum.
              </label>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-xl bg-ink py-3 text-sm font-medium text-ink-foreground transition-transform hover:brightness-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              {status === "loading" ? "Hesap oluşturuluyor..." : "Satıcı Kaydı Oluştur"}
            </button>

            {status === "error" && statusMsg && (
              <p className="text-center text-xs text-red-600">{statusMsg}</p>
            )}
            {status === "success" && statusMsg && (
              <p className="text-center text-xs text-emerald-600">{statusMsg}</p>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Zaten satıcı hesabın var mı?{" "}
            <Link to="/giris" className="font-medium text-foreground underline underline-offset-2">
              Giriş yap
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
