import { createBrowserRouter, Outlet, Navigate, useNavigate } from "react-router";
import { Login } from "./components/screens/Login";
import { StakingLobby } from "./components/screens/StakingLobby";
import { ActiveGameplay } from "./components/screens/ActiveGameplay";
import { WaitingRoom } from "./components/screens/WaitingRoom";
import { FinalLeaderboard } from "./components/screens/FinalLeaderboard";
import { EmergencyRefund } from "./components/screens/EmergencyRefund";
import { GlobalRanking } from "./components/screens/GlobalRanking";
import { ProfessorCreateGame } from "./components/ProfessorCreateGame";
import { ProfessorDashboard } from "./components/ProfessorDashboard";
import { CornerShapes } from "./components/CornerShapes";
import { NavBar } from "./components/NavBar";

// ── App shell — rendered for every non-login route ───────────────────────────
const AppLayout = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-800 font-sans relative overflow-hidden flex flex-col">
      <CornerShapes />
      <div className="relative z-10 flex flex-col flex-1">
        <NavBar onRefundPage={() => navigate("/emergency-refund")} />
        <main className="flex-1 flex flex-col px-4 md:px-8 pb-4 relative" style={{ overflow: "hidden" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const router = createBrowserRouter([
  // ── Login — full-viewport, no NavBar ──────────────────────────────────────
  { path: "/", Component: Login },

  // ── App shell ─────────────────────────────────────────────────────────────
  {
    path: "/",
    Component: AppLayout,
    children: [
      { path: "global-ranking", Component: GlobalRanking },
      { path: "student",        Component: StakingLobby },
      { path: "gameplay",       Component: ActiveGameplay },
      { path: "waiting",        Component: WaitingRoom },
      { path: "leaderboard",    Component: FinalLeaderboard },
      { path: "emergency-refund", Component: EmergencyRefund },
      { path: "professor/create",    Component: ProfessorCreateGame },
      { path: "professor/dashboard", Component: ProfessorDashboard },
    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
]);
