import { createBrowserRouter, Outlet, Navigate } from "react-router";
import { Login } from "./components/screens/Login";
import { TeacherDashboard } from "./components/screens/TeacherDashboard";
import { StakingLobby } from "./components/screens/StakingLobby";
import { ActiveGameplay } from "./components/screens/ActiveGameplay";
import { WaitingRoom } from "./components/screens/WaitingRoom";
import { FinalLeaderboard } from "./components/screens/FinalLeaderboard";
import { EmergencyRefund } from "./components/screens/EmergencyRefund";
import { GlobalRanking } from "./components/screens/GlobalRanking";
import { CornerShapes } from "./components/CornerShapes";
import { Navbar } from "./components/Navbar";

const AppLayout = () => (
  <div className="min-h-screen bg-[#F4F6FA] text-slate-800 font-sans relative overflow-hidden flex flex-col">
    <CornerShapes />
    <div className="relative z-10 flex flex-col flex-1">
      <Navbar />
      <main className="flex-1 flex flex-col px-4 md:px-8 pb-4 relative" style={{ overflow: "hidden" }}>
        <Outlet />
      </main>
    </div>
  </div>
);

export const router = createBrowserRouter([
  // Login — full-viewport dark screen, no Navbar
  { path: "/", Component: Login },

  // App shell routes
  {
    path: "/",
    Component: AppLayout,
    children: [
      { path: "global-ranking", Component: GlobalRanking },
      { path: "teacher", Component: TeacherDashboard },
      { path: "student", Component: StakingLobby },
      { path: "gameplay", Component: ActiveGameplay },
      { path: "waiting", Component: WaitingRoom },
      { path: "leaderboard", Component: FinalLeaderboard },
      { path: "emergency-refund", Component: EmergencyRefund },
    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
]);
