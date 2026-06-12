import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import pintosLogo from "@/assets/pintos-logo.png.asset.json";
import { registerAccount } from "@/lib/api/airtable-auth.functions";

export const Route = createFileRoute("/kayit-ol")({
  head: () => ({
    meta: [
      { title: "Kayıt Ol — Pintos" },
      {
        name: "description",
        content:
          "Pintos'a kayıt ol. Kullanıcı veya satıcı olarak hemen hesap oluştur.",
      },
    ],
  }),
  component: KayitOl,
});

type Tab = "user" | "seller";

function KayitOl() {
  const [tab, setTab] = useState<Tab>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setBusinessName("");
    setAgreed(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");
    setStatusMsg("");

    if (!email || !password || !confirmPassword || !fullName) {
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
    if (tab === "seller" && !businessName) {
      setStatus("error");
      setStatusMsg("Lütfen işletme adını gir.");
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
        data: {
          email,
          password,
          fullName,
          role: tab,
          businessName: tab === "seller" ? businessName : undefined,
        },
      });
      if (result.success) {
        setStatus("success");
        setStatusMsg("Hesap oluşturuldu, giriş yapıldı.");
        resetForm();
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
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-hairline bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2" aria-label="Pintos">
            <img src={pintosLogo.url} alt="Pintos" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Ana Sayfa
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 text-center">
            <img
              src={pintosLogo.url}
              alt="Pintos"
              className="mx-auto mb-4 h-10 w-auto"
            />
            <h1 className="text-2xl font-semibold tracking-tight">
              Hesap Oluştur
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pintos'a katıl, şehrindeki fırsatları keşfet.
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-surface p-1 ring-1 ring-black/5">
            <button
              type="button"
              onClick={() => {
                setTab("user");
                setStatus("idle");
                setStatusMsg("");
              }}
              className={
                tab === "user"
                  ? "rounded-lg bg-surface-2 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all"
                  : "rounded-lg py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              Kullanıcı
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("seller");
                setStatus("idle");
                setStatusMsg("");
              }}
              className={
                tab === "seller"
                  ? "rounded-lg bg-surface-2 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all"
                  : "rounded-lg py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              Satıcı
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl bg-surface p-6 shadow-lg shadow-zinc-200/40 ring-1 ring-black/5"
          >
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="mb-1.5 block text-xs font-medium text-foreground"
              >
                Ad Soyad
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ali Veli"
                className="w-full rounded-xl border border-input bg-surface-2 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-brand"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium text-foreground"
              >
                E-posta
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full rounded-xl border border-input bg-surface-2 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-brand"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium text-foreground"
              >
                Şifre
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-xl border border-input bg-surface-2 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-brand"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-xs font-medium text-foreground"
              >
                Şifre Tekrar
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-xl border border-input bg-surface-2 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-brand"
              />
            </div>

            {/* Business Name — Seller only */}
            {tab === "seller" && (
              <div>
                <label
                  htmlFor="businessName"
                  className="mb-1.5 block text-xs font-medium text-foreground"
                >
                  İşletme Adı
                </label>
                <input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Veli Teknoloji Ltd. Şti."
                  className="w-full rounded-xl border border-input bg-surface-2 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-brand"
                />
              </div>
            )}

            {/* Terms */}
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
                <span className="text-foreground">Gizlilik Politikası</span>'nı okudum ve
                kabul ediyorum.
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-xl bg-ink py-3 text-sm font-medium text-ink-foreground transition-transform hover:brightness-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              {status === "loading" ? "Hesap oluşturuluyor..." : "Kayıt Ol"}
            </button>

            {/* Status */}
            {status === "error" && statusMsg && (
              <p className="text-center text-xs text-red-600">{statusMsg}</p>
            )}
            {status === "success" && statusMsg && (
              <div className="rounded-xl border border-success/30 bg-success-soft p-3 text-center text-xs text-success">
                {statusMsg}
                <div className="mt-2">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-2"
                  >
                    Ana sayfaya dön
                    <svg className="size-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Zaten hesabın var mı?{" "}
            <Link to="/giris" className="font-medium text-foreground underline underline-offset-2">
              Giriş yap
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
