"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

const LIMIAR = 80; // pixels para acionar o reload

export function PullToRefresh() {
  const [arrasto, setArrasto] = useState(0); // 0–LIMIAR
  const [recarregando, setRecarregando] = useState(false);
  const inicioY = useRef<number | null>(null);
  const arrastando = useRef(false);

  useEffect(() => {
    function getMain(): HTMLElement | null {
      return document.querySelector("main");
    }

    function onTouchStart(e: TouchEvent) {
      const main = getMain();
      if (!main) return;
      // Só ativa se o scroll do main está no topo
      if (main.scrollTop > 2) return;
      inicioY.current = e.touches[0].clientY;
      arrastando.current = false;
    }

    function onTouchMove(e: TouchEvent) {
      if (inicioY.current === null) return;
      const main = getMain();
      if (!main || main.scrollTop > 2) { inicioY.current = null; return; }

      const delta = e.touches[0].clientY - inicioY.current;
      if (delta <= 0) { inicioY.current = null; return; }

      arrastando.current = true;
      // Resistência: movimento real é menor que o dedo
      const progresso = Math.min(delta * 0.5, LIMIAR);
      setArrasto(progresso);

      // Previne scroll nativo enquanto está arrastando para baixo
      if (delta > 8) e.preventDefault();
    }

    function onTouchEnd() {
      if (!arrastando.current) { inicioY.current = null; setArrasto(0); return; }
      if (arrasto >= LIMIAR * 0.95) {
        setRecarregando(true);
        setTimeout(() => window.location.reload(), 300);
      } else {
        setArrasto(0);
      }
      inicioY.current = null;
      arrastando.current = false;
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [arrasto]);

  if (arrasto === 0 && !recarregando) return null;

  const progresso = Math.min(arrasto / LIMIAR, 1);
  const ativado = progresso >= 0.95 || recarregando;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center pointer-events-none"
      style={{ paddingTop: `${Math.max(arrasto, recarregando ? LIMIAR : 0)}px`, transition: recarregando ? "none" : "padding-top 0.05s" }}
    >
      <div
        className="flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-md border border-[#e8dcc4]"
        style={{ opacity: progresso, transform: `scale(${0.6 + progresso * 0.4}) rotate(${progresso * 180}deg)`, transition: "opacity 0.1s" }}
      >
        <RefreshCw
          size={16}
          className={ativado ? "text-[#B89968] animate-spin" : "text-[#9a7d50]"}
        />
      </div>
    </div>
  );
}
