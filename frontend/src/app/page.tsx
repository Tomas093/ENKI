import { JoinGameTerminal } from "./components/JoinGameTerminal";
import { GlobalRankingPreview } from "./components/GlobalRankingPreview";
import { HostGameModule } from "./components/HostGameModule";

export default function Home() {
  return (
    <div className="w-full min-h-full flex flex-col justify-start px-4 md:px-8 lg:px-12 pt-2 md:pt-3 lg:pt-4 pb-4 relative">
      <main className="max-w-6xl mx-auto w-full relative z-10">

        {/* Hero Header */}
        <header className="mb-6 md:mb-8">
          <div className="max-w-2xl">
            {/* Tag */}
            <div
              className="inline-flex items-center bg-neo-accent border-2 border-black px-3 py-1 mb-4"
              style={{ boxShadow: "2px 2px 0px #000" }}
            >
              <span className="font-black text-[11px] uppercase tracking-[0.12em]">[ Web3 Game Platform ]</span>
            </div>
            <h1 className="font-black text-[48px] md:text-[64px] uppercase tracking-[-0.03em] leading-[0.88] text-black mb-4">
              Your teacher<br />is live.
            </h1>
            <p className="font-mono text-[13px] uppercase tracking-[0.08em] text-gray-500">
              // Enter Game ID + Nickname to compete
            </p>
          </div>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Join Area */}
          <div className="lg:col-span-7 xl:col-span-8">
            <JoinGameTerminal />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
            <GlobalRankingPreview />
            <HostGameModule />
          </div>
        </div>
      </main>
    </div>
  );
}
