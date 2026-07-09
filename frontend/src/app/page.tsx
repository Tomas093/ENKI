import { JoinGameTerminal } from "./components/JoinGameTerminal";
import { GlobalRankingPreview } from "./components/GlobalRankingPreview";
import { HostGameModule } from "./components/HostGameModule";
import { PageBlobs } from "../components/ui/PageBlobs";

export default function Home() {
  return (
    <div className="w-full min-h-full flex flex-col justify-start px-4 md:px-8 lg:px-12 pt-2 md:pt-3 lg:pt-4 pb-4 relative bg-slate-50">
      <PageBlobs primary="purple" secondary="blue" />
      <main className="max-w-6xl mx-auto w-full relative z-10">

        {/* Hero Header */}
        <header className="mb-4 md:mb-6">
          <div className="max-w-xl">
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-800 mb-3 leading-tight">
              Learn, compete,<br />and earn on-chain.
            </h1>
            <p className="text-slate-500 font-medium text-base md:text-lg leading-relaxed">
              Enter your professor's game address below to join a real-stakes trivia session secured by Ethereum smart contracts.
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
