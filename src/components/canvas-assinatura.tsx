"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Eraser } from "lucide-react";

type Props = {
  onMudar?: (base64: string | null) => void;
  valorInicial?: string | null;
  altura?: number;
  label?: string;
  desabilitado?: boolean;
};

export function CanvasAssinatura({
  onMudar,
  valorInicial,
  altura = 150,
  label,
  desabilitado = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const desenhando = useRef(false);
  const [temConteudo, setTemConteudo] = useState(!!valorInicial);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#1a1208";
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (valorInicial) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = valorInicial;
    }
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const t = (e as React.TouchEvent).touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    const m = e as React.MouseEvent;
    return { x: m.clientX - rect.left, y: m.clientY - rect.top };
  }

  function iniciar(e: React.MouseEvent | React.TouchEvent) {
    if (desabilitado) return;
    e.preventDefault();
    desenhando.current = true;
    const pos = getPos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function mover(e: React.MouseEvent | React.TouchEvent) {
    if (!desenhando.current) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    if (!temConteudo) setTemConteudo(true);
  }

  function terminar() {
    if (!desenhando.current) return;
    desenhando.current = false;
    onMudar?.(canvasRef.current!.toDataURL("image/png"));
  }

  function limpar() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setTemConteudo(false);
    onMudar?.(null);
  }

  return (
    <div className="space-y-1.5">
      {label && <p className="text-sm font-medium text-[#5a4530]">{label}</p>}
      <div
        className="relative border-2 border-dashed border-[#e8dcc4] rounded-lg bg-white overflow-hidden"
        style={{ height: `${altura}px` }}
      >
        <canvas
          ref={canvasRef}
          className={cn(
            "w-full h-full touch-none",
            desabilitado ? "cursor-default" : "cursor-crosshair"
          )}
          onMouseDown={iniciar}
          onMouseMove={mover}
          onMouseUp={terminar}
          onMouseLeave={terminar}
          onTouchStart={iniciar}
          onTouchMove={mover}
          onTouchEnd={terminar}
        />
        {!temConteudo && !desabilitado && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-[#9a7d50]/50 select-none">Assine aqui</p>
          </div>
        )}
      </div>
      {!desabilitado && (
        <button
          type="button"
          onClick={limpar}
          className="flex items-center gap-1 text-xs text-[#9a7d50] hover:text-red-500 ml-auto transition-colors"
        >
          <Eraser size={12} />
          Limpar
        </button>
      )}
    </div>
  );
}
