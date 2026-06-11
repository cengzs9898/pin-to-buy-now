import { useEffect, useState } from "react";
import logo from "@/assets/pintos-logo.png.asset.json";

export function Preloader() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 600);
    const t2 = setTimeout(() => setVisible(false), 1100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <img
        src={logo.url}
        alt=""
        className="h-20 w-auto animate-pulse drop-shadow-lg sm:h-24"
      />
      <div className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 animate-[pintosBar_1s_ease-in-out_infinite] rounded-full bg-brand" />
      </div>
      <style>{`@keyframes pintosBar{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>
    </div>
  );
}
