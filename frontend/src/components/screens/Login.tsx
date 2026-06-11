import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { ChevronRight, Wallet } from "lucide-react";

// ── Corner Shapes (inline, light-mode EdTech style) ─────────────────────────

const LoginCornerShapes = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    {/* Red Triangle — top-left */}
    <svg className="absolute -top-[18%] -left-[8%] w-[55vw] max-w-[720px] opacity-[0.13] text-red-500 -rotate-12"
      viewBox="0 0 100 100" fill="currentColor">
      <polygon points="50,0 100,100 0,100" />
    </svg>
    {/* Blue Diamond — bottom-right */}
    <svg className="absolute -bottom-[18%] -right-[8%] w-[55vw] max-w-[720px] opacity-[0.13] text-blue-500 rotate-12"
      viewBox="0 0 100 100" fill="currentColor">
      <polygon points="50,0 100,50 50,100 0,50" />
    </svg>
  </div>
);

// ── Wallet icons (SVG inline, brand-accurate colors) ─────────────────────────

const MetaMaskIcon = () => (
  <svg width="28" height="28" viewBox="0 0 212 189" fill="none">
    <polygon points="196,0 116,56 131,23" fill="#E2761B" stroke="#E2761B" strokeWidth="2" strokeLinejoin="round"/>
    <polygon points="16,0 95,57 81,23" fill="#E4761B" stroke="#E4761B" strokeWidth="2" strokeLinejoin="round"/>
    <polygon points="168,136 147,168 192,180 205,137" fill="#E4761B" stroke="#E4761B" strokeWidth="2" strokeLinejoin="round"/>
    <polygon points="7,137 20,180 65,168 44,136" fill="#E4761B" stroke="#E4761B" strokeWidth="2" strokeLinejoin="round"/>
    <polygon points="63,82 50,101 94,103 92,55" fill="#E4761B" stroke="#E4761B" strokeWidth="2" strokeLinejoin="round"/>
    <polygon points="149,82 120,55 118,103 162,101" fill="#E4761B" stroke="#E4761B" strokeWidth="2" strokeLinejoin="round"/>
    <polygon points="65,168 91,154 68,137" fill="#E4761B" stroke="#E4761B" strokeWidth="2" strokeLinejoin="round"/>
    <polygon points="121,154 147,168 144,137" fill="#E4761B" stroke="#E4761B" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

const WalletConnectIcon = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#3B99FC"/>
    <path d="M9.6 13.2c3.5-3.5 9.3-3.5 12.8 0l0.4 0.4c0.2 0.2 0.2 0.5 0 0.7l-1.4 1.4c-0.1 0.1-0.3 0.1-0.4 0l-0.6-0.6c-2.5-2.5-6.5-2.5-9 0l-0.6 0.6c-0.1 0.1-0.3 0.1-0.4 0l-1.4-1.4c-0.2-0.2-0.2-0.5 0-0.7l0.6-0.4zM24.4 15.7l1.3 1.3c0.2 0.2 0.2 0.5 0 0.7l-5.8 5.8c-0.2 0.2-0.5 0.2-0.7 0l-4.1-4.1c-0.1-0.1-0.1-0.1-0.2 0l-4.1 4.1c-0.2 0.2-0.5 0.2-0.7 0L4.3 17.7c-0.2-0.2-0.2-0.5 0-0.7l1.3-1.3c0.2-0.2 0.5-0.2 0.7 0l4.1 4.1c0.1 0.1 0.1 0.1 0.2 0l4.1-4.1c0.2-0.2 0.5-0.2 0.7 0l4.1 4.1c0.1 0.1 0.1 0.1 0.2 0l4.1-4.1c0.2-0.2 0.5-0.2 0.7 0z" fill="white"/>
  </svg>
);

const CoinbaseIcon = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#1652F0"/>
    <path d="M16 7C11.03 7 7 11.03 7 16s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 14.5a5.5 5.5 0 110-11 5.5 5.5 0 010 11zm-2-5.5a2 2 0 104 0 2 2 0 00-4 0z" fill="white"/>
  </svg>
);

// ── Screen 1: Wallet Connection ──────────────────────────────────────────────

const WALLETS = [
  { id: "metamask",      label: "MetaMask",       Icon: MetaMaskIcon },
  { id: "walletconnect", label: "WalletConnect",   Icon: WalletConnectIcon },
  { id: "coinbase",      label: "Coinbase Wallet", Icon: CoinbaseIcon },
];

const WalletScreen = ({ onConnect }: { onConnect: () => void }) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleConnect = (id: string) => {
    setLoading(id);
    setTimeout(onConnect, 1800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F4F6FA] px-4 relative">
      <LoginCornerShapes />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Card */}
        <div className="bg-white rounded-[24px] border-[3px] border-slate-100 shadow-2xl shadow-slate-200/80 px-10 py-10">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-[18px] bg-purple-600 flex items-center justify-center font-black text-white text-3xl shadow-lg -rotate-3 mb-4">
              E
            </div>
            <h1 className="font-black text-slate-800 text-3xl tracking-tight">ENKI</h1>
            <p className="text-slate-400 font-semibold text-sm mt-1.5">Connect to Play</p>
          </div>

          {/* Wallet rows */}
          <div className="flex flex-col gap-3">
            {WALLETS.map(({ id, label, Icon }) => {
              const isLoading = loading === id;
              return (
                <button
                  key={id}
                  onClick={() => !loading && handleConnect(id)}
                  disabled={!!loading}
                  className="flex items-center gap-4 w-full px-4 py-3.5 rounded-[12px] border-2 border-[#E2E8F0] bg-white hover:border-purple-300 hover:bg-purple-50 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 group cursor-pointer"
                >
                  <div className="shrink-0">
                    {isLoading ? (
                      <div className="w-7 h-7 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                    ) : (
                      <Icon />
                    )}
                  </div>
                  <span className="flex-1 text-left font-bold text-slate-700 text-base">
                    {isLoading ? "Connecting…" : label}
                  </span>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-purple-400 transition-colors" />
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <p className="text-center text-slate-400 text-xs font-medium mt-7">
            🔒 Secured by Ethereum smart contracts.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// ── Screen 2: Role / Destination Selection ───────────────────────────────────

const DESTINATIONS = [
  {
    id: "student",
    emoji: "🎓",
    label: "Join Game",
    subtitle: "Enter a PIN to play and win ETH.",
    path: "/student",
    accent: "#3B82F6",
    bg: "bg-blue-50",
    border: "border-blue-200",
    hoverBorder: "hover:border-blue-400",
    hoverBg: "hover:bg-blue-100",
    iconBg: "bg-blue-500",
    badgeText: "text-blue-600",
  },
  {
    id: "teacher",
    emoji: "👨‍🏫",
    label: "Host Dashboard",
    subtitle: "Create and manage live trivia sessions.",
    path: "/teacher",
    accent: "#7C3AED",
    bg: "bg-purple-50",
    border: "border-purple-200",
    hoverBorder: "hover:border-purple-400",
    hoverBg: "hover:bg-purple-100",
    iconBg: "bg-purple-600",
    badgeText: "text-purple-600",
  },
  {
    id: "ranking",
    emoji: "🏆",
    label: "Global Ranking",
    subtitle: "View the top NFT certificate holders.",
    path: "/global-ranking",
    accent: "#F59E0B",
    bg: "bg-amber-50",
    border: "border-amber-200",
    hoverBorder: "hover:border-amber-400",
    hoverBg: "hover:bg-amber-100",
    iconBg: "bg-amber-500",
    badgeText: "text-amber-600",
  },
];

const MOCK_ADDRESS = "0x7a3B...1234";

const RoleScreen = ({ onDisconnect }: { onDisconnect: () => void }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F4F6FA] relative">
      <LoginCornerShapes />

      {/* Navbar */}
      <header className="relative z-10 bg-white border-b-2 border-slate-100 shadow-sm px-6 md:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-[12px] bg-purple-600 flex items-center justify-center font-black text-white text-xl shadow-md -rotate-3">
            E
          </div>
          <span className="font-black text-slate-800 text-2xl tracking-tight">ENKI</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Wallet badge */}
          <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-200 rounded-full px-4 py-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="font-bold text-slate-600 text-sm font-mono">{MOCK_ADDRESS}</span>
          </div>
          {/* Disconnect */}
          <button
            onClick={onDisconnect}
            title="Disconnect wallet"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer"
          >
            <Wallet size={13} />
            Disconnect
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 py-14">

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h2 className="font-black text-slate-800 text-4xl md:text-5xl tracking-tight mb-2">
            Welcome! Where to?
          </h2>
          <p className="text-slate-400 font-semibold text-lg">
            Choose your destination to continue.
          </p>
        </motion.div>

        {/* Destination cards */}
        <div className="flex flex-col md:flex-row gap-5 w-full max-w-4xl">
          {DESTINATIONS.map((dest, i) => (
            <motion.button
              key={dest.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate(dest.path)}
              className={`group flex-1 ${dest.bg} border-[3px] ${dest.border} ${dest.hoverBorder} ${dest.hoverBg} rounded-[24px] p-7 flex flex-col items-start gap-5 text-left transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer`}
            >
              {/* Icon bubble */}
              <div className={`w-16 h-16 rounded-[18px] ${dest.iconBg} flex items-center justify-center text-3xl shadow-md -rotate-3 group-hover:rotate-0 transition-transform duration-200`}>
                {dest.emoji}
              </div>

              <div>
                <div className="font-black text-slate-800 text-2xl mb-1 tracking-tight">
                  {dest.label}
                </div>
                <div className={`font-semibold text-sm ${dest.badgeText}`}>
                  {dest.subtitle}
                </div>
              </div>

              {/* Arrow */}
              <div className="mt-auto self-end">
                <div className={`w-9 h-9 rounded-full border-2 ${dest.border} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <ChevronRight size={18} className={dest.badgeText} />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
};

// ── Root export ──────────────────────────────────────────────────────────────

export const Login = () => {
  const [connected, setConnected] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {!connected ? (
        <motion.div key="wallet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
          <WalletScreen onConnect={() => setConnected(true)} />
        </motion.div>
      ) : (
        <motion.div key="roles" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <RoleScreen onDisconnect={() => setConnected(false)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
