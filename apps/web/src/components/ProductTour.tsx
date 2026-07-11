import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft, ArrowRight,
  LayoutDashboard, ShoppingCart,
  UtensilsCrossed, ClipboardList, Package, DollarSign,
  Users, Settings, Sparkles, CheckCircle2, ChevronRight,
} from "lucide-react";
import { ViewType } from "../hooks/useAppState";

interface TourStep {
  id: string;
  view: ViewType;
  iconName: string;
  iconBg: string;
  iconColor: string;
  badge: string;
  title: string;
  description: string;
  tips: string[];
  target: string | null;
  position: "bottom" | "top" | "left" | "right" | "center";
}

interface ProductTourProps {
  isOpen: boolean;
  onClose: () => void;
  onChangeView: (view: ViewType) => void;
}

const steps: TourStep[] = [
  {
    id: "welcome",
    view: "dashboard",
    iconName: "sparkles",
    iconBg: "bg-emerald-50 border-emerald-100",
    iconColor: "text-emerald-600",
    badge: "Boas-vindas",
    title: "Bem-vindo ao GourmetOS! 🚀",
    description: "Criamos este tour interativo para guiar você passo a passo pelos principais módulos do sistema. Vamos começar?",
    tips: [
      "Cada módulo do sistema será aberto automaticamente",
      "Destaques visuais mostrarão as principais ferramentas",
      "Use as setas ← → do seu teclado para avançar ou voltar",
    ],
    target: null,
    position: "center",
  },
  {
    id: "dashboard_kpis",
    view: "dashboard",
    iconName: "dashboard",
    iconBg: "bg-blue-50 border-blue-100",
    iconColor: "text-blue-600",
    badge: "Passo 1 de 8",
    title: "Painel de Indicadores (KPIs)",
    description: "Este é o seu centro de comando. Acompanhe a saúde financeira e operacional do seu restaurante em tempo real.",
    tips: [
      "Faturamento do dia com percentual de crescimento",
      "Quantidade de comandas e mesas ativas no momento",
      "Alertas automáticos de itens com estoque baixo",
    ],
    target: "#kpi-grid",
    position: "bottom",
  },
  {
    id: "dashboard_onboarding",
    view: "dashboard",
    iconName: "dashboard",
    iconBg: "bg-blue-50 border-blue-100",
    iconColor: "text-blue-600",
    badge: "Passo 2 de 8",
    title: "Guia de Configuração Inicial",
    description: "Criamos um checklist interativo para guiar as primeiras ações de ativação da sua loja.",
    tips: [
      "Acompanhe o percentual de conclusão das tarefas",
      "Cadastre o cardápio, mesas e equipe inicial por aqui",
      "Conclua os passos para ter o sistema pronto para produção",
    ],
    target: "#onboarding-guide",
    position: "bottom",
  },
  {
    id: "pdv_catalog",
    view: "pdv",
    iconName: "cart",
    iconBg: "bg-violet-50 border-violet-100",
    iconColor: "text-violet-600",
    badge: "Passo 3 de 8",
    title: "PDV — Cardápio Rápido",
    description: "O PDV é perfeito para vendas rápidas de balcão, delivery ou retirada rápida (takeaway).",
    tips: [
      "Navegue entre categorias de pratos e bebidas com facilidade",
      "Adicione itens ao carrinho com apenas um clique",
      "Busque pratos rapidamente pelo campo de pesquisa integrado",
    ],
    target: "#pdv-products-grid",
    position: "right",
  },
  {
    id: "pdv_cart",
    view: "pdv",
    iconName: "cart",
    iconBg: "bg-violet-50 border-violet-100",
    iconColor: "text-violet-600",
    badge: "Passo 4 de 8",
    title: "PDV — Caixa e Carrinho",
    description: "Visualize o resumo da venda atual, configure descontos e finalize o pagamento instantaneamente.",
    tips: [
      "Vincule o nome do cliente ou número da comanda",
      "Simulação integrada de pagamentos (Dinheiro, PIX, Cartão)",
      "Feche a venda para gerar a comanda de produção",
    ],
    target: "#pdv-cart-summary",
    position: "left",
  },
  {
    id: "tables_grid",
    view: "tables",
    iconName: "utensils",
    iconBg: "bg-amber-50 border-amber-100",
    iconColor: "text-amber-600",
    badge: "Passo 5 de 8",
    title: "Mesas e Comandas do Salão",
    description: "Controle visual completo das mesas físicas do salão, comandas ativas e tempo de permanência.",
    tips: [
      "Diferenciação por cores: Mesa Livre (Verde) e Ocupada (Vermelho)",
      "Lance novos itens para as mesas com facilidade operacional",
      "Visualize o valor total da comanda antes de realizar o fechamento",
    ],
    target: "#tables-grid",
    position: "bottom",
  },
  {
    id: "orders_kds",
    view: "orders",
    iconName: "orders",
    iconBg: "bg-cyan-50 border-cyan-100",
    iconColor: "text-cyan-600",
    badge: "Passo 6 de 8",
    title: "Monitor KDS (Cozinha)",
    description: "Gerencie a fila de produção da cozinha sem o uso de papéis. Sincronização automática em tempo real.",
    tips: [
      "Acompanhe o tempo de espera de cada prato do restaurante",
      "Mude o status de Pendente → Preparando → Pronto com um clique",
      "Alerta sonoro configurável para a chegada de novos pedidos",
    ],
    target: "#orders-list-grid",
    position: "bottom",
  },
  {
    id: "products_inventory",
    view: "products",
    iconName: "package",
    iconBg: "bg-rose-50 border-rose-100",
    iconColor: "text-rose-600",
    badge: "Passo 7 de 8",
    title: "Gestão de Cardápio e Estoque",
    description: "Adicione e edite pratos, configure preços, custos e mantenha o controle de estoque mínimo de segurança.",
    tips: [
      "Organize produtos por categorias (Pratos Principais, Bebidas...)",
      "Monitore o estoque atual de cada produto",
      "Gerencie adicionais (Bacon, Queijo Extra) integrados",
    ],
    target: "#products-table-container",
    position: "top",
  },
  {
    id: "finance_drawer",
    view: "finance",
    iconName: "dollar",
    iconBg: "bg-emerald-50 border-emerald-100",
    iconColor: "text-emerald-600",
    badge: "Passo 8 de 8",
    title: "Financeiro e Controle de Caixa",
    description: "Gerencie as entradas e saídas de caixa operacionais do dia, sangrias, suprimentos e fechamento de turno.",
    tips: [
      "Abertura e fechamento de caixa digital e seguro",
      "Lançamento de suprimentos de troco ou retiradas (sangria)",
      "Fechamento consolidado por meio de pagamento",
    ],
    target: "#finance-cash-card",
    position: "right",
  },
  {
    id: "done_tour",
    view: "dashboard",
    iconName: "check",
    iconBg: "bg-emerald-50 border-emerald-100",
    iconColor: "text-emerald-600",
    badge: "Concluído",
    title: "Prontinho! Tudo pronto para começar. 🎉",
    description: "Você concluiu o treinamento inicial do GourmetOS. Agora é a sua vez de ver na prática!",
    tips: [
      "Comece cadastrando seu cardápio no módulo Cardápio",
      "Abra o caixa operacional no financeiro para iniciar as vendas",
      "Acesse a central de ajuda nas configurações caso precise",
    ],
    target: null,
    position: "center",
  },
];

function StepIcon({ name, className }: { name: string; className: string }) {
  const props = { className };
  switch (name) {
    case "sparkles": return <Sparkles {...props} />;
    case "dashboard": return <LayoutDashboard {...props} />;
    case "cart": return <ShoppingCart {...props} />;
    case "utensils": return <UtensilsCrossed {...props} />;
    case "orders": return <ClipboardList {...props} />;
    case "package": return <Package {...props} />;
    case "dollar": return <DollarSign {...props} />;
    case "users": return <Users {...props} />;
    case "settings": return <Settings {...props} />;
    case "check": return <CheckCircle2 {...props} />;
    default: return <Sparkles {...props} />;
  }
}

interface SpotlightBox {
  top: number; left: number; width: number; height: number;
}

interface BubblePos {
  top: number; left: number; transform: string;
}

const OVERLAY_BG = "rgba(5,7,10,0.78)";
const CARD_W = 420;
const CARD_H_ESTIMATE = 370;
const SPACING = 20;
const MARGIN = 12;

function smartPosition(
  rect: DOMRect,
  preferred: TourStep["position"],
  cardW: number,
  cardH: number,
): BubblePos {
  const VW = window.innerWidth;
  const VH = window.innerHeight;

  const spaceBelow  = VH - rect.bottom - SPACING;
  const spaceAbove  = rect.top - SPACING;
  const spaceRight  = VW - rect.right - SPACING;
  const spaceLeft   = rect.left - SPACING;

  // Auto-flip if not enough room on preferred side
  let pos = preferred;
  if (pos === "bottom" && spaceBelow < cardH) pos = spaceAbove >= cardH ? "top" : (spaceRight >= cardW ? "right" : spaceLeft >= cardW ? "left" : "bottom");
  if (pos === "top"    && spaceAbove < cardH) pos = spaceBelow >= cardH ? "bottom" : (spaceRight >= cardW ? "right" : spaceLeft >= cardW ? "left" : "top");
  if (pos === "right"  && spaceRight < cardW) pos = spaceLeft  >= cardW ? "left"  : (spaceBelow >= cardH ? "bottom" : spaceAbove >= cardH ? "top" : "right");
  if (pos === "left"   && spaceLeft  < cardW) pos = spaceRight >= cardW ? "right" : (spaceBelow >= cardH ? "bottom" : spaceAbove >= cardH ? "top" : "left");

  const cx = rect.left + rect.width  / 2;
  const cy = rect.top  + rect.height / 2;

  let top = 0, left = 0, transform = "";

  if (pos === "bottom") { top = rect.bottom + SPACING; left = cx; transform = "translateX(-50%)"; }
  else if (pos === "top")    { top = rect.top - SPACING - cardH; left = cx; transform = "translateX(-50%)"; }
  else if (pos === "right")  { top = cy; left = rect.right + SPACING; transform = "translateY(-50%)"; }
  else if (pos === "left")   { top = cy; left = rect.left - SPACING - cardW; transform = "translateY(-50%)"; }

  // Clamp so the card stays fully inside the viewport
  const rawL = transform.includes("translateX") ? left - cardW / 2 : left;
  const rawT = transform.includes("translateY") ? top  - cardH / 2 : top;

  const clampL = Math.max(MARGIN, Math.min(rawL, VW - cardW - MARGIN));
  const clampT = Math.max(MARGIN, Math.min(rawT, VH - cardH - MARGIN));

  return {
    top:  transform.includes("translateY") ? clampT + cardH / 2 : clampT,
    left: transform.includes("translateX") ? clampL + cardW / 2 : clampL,
    transform,
  };
}

export function ProductTour({ isOpen, onClose, onChangeView }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightBox | null>(null);
  const [bubble, setBubble]       = useState<BubblePos>({ top: 0, left: 0, transform: "translate(-50%,-50%)" });
  const bubbleRef      = useRef<HTMLDivElement>(null);
  const layoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeStep = steps[currentStep];

  // Lock page scroll while tour is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = { html: document.documentElement.style.overflow, body: document.body.style.overflow };
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev.html;
      document.body.style.overflow = prev.body;
    };
  }, [isOpen]);

  const computeLayout = useCallback(() => {
    if (!isOpen) return;
    const step = steps[currentStep];

    if (!step.target) {
      setSpotlight(null);
      setBubble({ top: window.innerHeight / 2, left: window.innerWidth / 2, transform: "translate(-50%,-50%)" });
      return;
    }

    const el = document.querySelector(step.target);
    if (!el) {
      setSpotlight(null);
      setBubble({ top: window.innerHeight / 2, left: window.innerWidth / 2, transform: "translate(-50%,-50%)" });
      return;
    }

    // Scroll element into view inside its own container (not the locked window)
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });

    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const PAD  = 10;

      const box: SpotlightBox = {
        top:    rect.top    - PAD,
        left:   rect.left   - PAD,
        width:  rect.width  + PAD * 2,
        height: rect.height + PAD * 2,
      };
      setSpotlight(box);

      const cardW = bubbleRef.current?.offsetWidth  || Math.min(CARD_W, window.innerWidth - 32);
      const cardH = bubbleRef.current?.offsetHeight || CARD_H_ESTIMATE;
      setBubble(smartPosition(rect, step.position, cardW, cardH));
    }, 60);

  }, [isOpen, currentStep]);

  useEffect(() => {
    if (!isOpen) return;
    onChangeView(steps[currentStep].view);
    if (layoutTimerRef.current) clearTimeout(layoutTimerRef.current);
    layoutTimerRef.current = setTimeout(computeLayout, 320);
    window.addEventListener("resize", computeLayout);
    return () => {
      window.removeEventListener("resize", computeLayout);
      if (layoutTimerRef.current) clearTimeout(layoutTimerRef.current);
    };
  }, [isOpen, currentStep, computeLayout, onChangeView]);

  const handleClose = useCallback(() => { setCurrentStep(0); onClose(); }, [onClose]);
  const handleNext  = useCallback(() => { currentStep < steps.length - 1 ? setCurrentStep(p => p + 1) : handleClose(); }, [currentStep, handleClose]);
  const handlePrev  = useCallback(() => { if (currentStep > 0) setCurrentStep(p => p - 1); }, [currentStep]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") handleNext();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleNext, handlePrev, handleClose]);

  if (!isOpen) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isCenter = !activeStep.target;
  const VW = window.innerWidth;
  const VH = window.innerHeight;

  return (
    <div className="fixed inset-0 z-[9995] pointer-events-none font-sans" style={{ overflow: "hidden" }}>

      {/* ── SPOTLIGHT OVERLAY ──────────────────────────────────────────────
          When a target is highlighted: 4 dark strips around it, leaving
          the spotlight area 100% clear and visible.
          When centered (no target): one full dark backdrop.
      ──────────────────────────────────────────────────────────────────── */}
      {isCenter || !spotlight ? (
        // Full backdrop for welcome / done screens
        <div
          className="absolute inset-0 z-[9996] pointer-events-auto"
          style={{ background: OVERLAY_BG, backdropFilter: "blur(2px)" }}
          onClick={isCenter ? handleClose : undefined}
        />
      ) : (
        <>
          {/* TOP strip */}
          <div
            className="absolute z-[9996] pointer-events-auto"
            style={{
              top: 0, left: 0,
              width: VW, height: Math.max(0, spotlight.top),
              background: OVERLAY_BG,
              transition: "height 0.3s ease",
            }}
          />
          {/* BOTTOM strip */}
          <div
            className="absolute z-[9996] pointer-events-auto"
            style={{
              top: spotlight.top + spotlight.height, left: 0,
              width: VW, height: Math.max(0, VH - spotlight.top - spotlight.height),
              background: OVERLAY_BG,
              transition: "top 0.3s ease, height 0.3s ease",
            }}
          />
          {/* LEFT strip */}
          <div
            className="absolute z-[9996] pointer-events-auto"
            style={{
              top: spotlight.top, left: 0,
              width: Math.max(0, spotlight.left), height: spotlight.height,
              background: OVERLAY_BG,
              transition: "width 0.3s ease",
            }}
          />
          {/* RIGHT strip */}
          <div
            className="absolute z-[9996] pointer-events-auto"
            style={{
              top: spotlight.top, left: spotlight.left + spotlight.width,
              width: Math.max(0, VW - spotlight.left - spotlight.width), height: spotlight.height,
              background: OVERLAY_BG,
              transition: "left 0.3s ease, width 0.3s ease",
            }}
          />

          {/* Glowing border around the spotlight */}
          <div
            style={{
              position: "fixed",
              top:    spotlight.top,
              left:   spotlight.left,
              width:  spotlight.width,
              height: spotlight.height,
              borderRadius: 16,
              border: "2.5px solid #10b981",
              boxShadow: "0 0 0 4px rgba(16,185,129,0.18), 0 0 24px rgba(16,185,129,0.3)",
              zIndex: 9997,
              pointerEvents: "none",
              transition: "all 0.3s ease",
            }}
          />
        </>
      )}

      {/* ── BUBBLE CARD ────────────────────────────────────────────────── */}
      <div
        ref={bubbleRef}
        style={{
          position: "fixed",
          top:  bubble.top,
          left: bubble.left,
          transform: bubble.transform,
          zIndex: 9999,
          width: `min(${CARD_W}px, calc(100vw - 24px))`,
          maxHeight: "calc(100vh - 24px)",
          overflowY: "auto",
          transition: "top 0.3s ease, left 0.3s ease",
        }}
        className="bg-white border border-neutral-200 rounded-[28px] shadow-2xl p-6 text-neutral-800 pointer-events-auto select-none"
      >
        {/* Progress bar */}
        <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden mb-5">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>

        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 rounded-2xl border ${activeStep.iconBg} ${activeStep.iconColor} shrink-0`}>
            <StepIcon name={activeStep.iconName} className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <span className={`text-[10px] font-black uppercase tracking-widest ${activeStep.iconColor}`}>
              {activeStep.badge}
            </span>
            <h3 className="text-neutral-900 font-black text-base leading-snug">
              {activeStep.title}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-neutral-600 text-xs font-bold leading-relaxed mb-5">
          {activeStep.description}
        </p>

        {/* Tips */}
        <div className="space-y-3 mb-6 bg-neutral-50/50 border border-neutral-100 p-4 rounded-2xl">
          {activeStep.tips.map((tip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + i * 0.05 }}
              className="flex items-start gap-2.5"
            >
              <ChevronRight className={`w-4 h-4 mt-0.5 shrink-0 ${activeStep.iconColor}`} />
              <span className="text-neutral-700 text-xs leading-relaxed font-bold">{tip}</span>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          <span className="text-[11px] font-black text-neutral-400">
            {currentStep + 1} de {steps.length}
          </span>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="p-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 rounded-xl transition-all cursor-pointer border border-neutral-200 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-neutral-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10"
            >
              <span>{currentStep === steps.length - 1 ? "✓ Concluir" : "Próximo"}</span>
              {currentStep < steps.length - 1 && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {currentStep === 0 && (
          <p className="text-center text-[10px] text-neutral-400 font-bold pt-4 -mb-1">
            Use as setas ← → do teclado para navegar
          </p>
        )}
      </div>
    </div>
  );
}
