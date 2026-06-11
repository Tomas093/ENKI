import React from 'react';
import { WalletRow } from './WalletRow';
import { MetaMaskLogo, WalletConnectLogo, CoinbaseLogo } from './WalletIcons';

export function LoginCard() {
  const handleConnect = (walletName: string) => {
    console.log(`Connecting to ${walletName}...`);
    // Placeholder for actual connection logic
  };

  return (
    <div className="relative z-10 w-full max-w-[480px] bg-white rounded-[24px] p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center">
      
      {/* Header */}
      <div className="flex flex-col items-center w-full mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          ENKI
        </h1>
        <h2 className="text-2xl font-bold text-slate-800 mt-2 text-center">
          The Web3 Trivia Game
        </h2>
        <p className="text-slate-500 text-center mt-3 text-sm font-medium px-4">
          Play trivia, climb the leaderboard, and win real ETH on-chain.
        </p>
      </div>

      {/* Wallet Connection Stack */}
      <div className="w-full flex flex-col gap-3 mb-10">
        <WalletRow 
          name="MetaMask" 
          icon={<MetaMaskLogo />} 
          onClick={() => handleConnect('MetaMask')} 
        />
        <WalletRow 
          name="WalletConnect" 
          icon={<WalletConnectLogo />} 
          onClick={() => handleConnect('WalletConnect')} 
        />
        <WalletRow 
          name="Coinbase Wallet" 
          icon={<CoinbaseLogo />} 
          onClick={() => handleConnect('Coinbase Wallet')} 
        />
      </div>

      {/* Security Footer */}
      <div className="w-full text-center mt-auto">
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          🔒 Secured by Ethereum smart contracts. We never store your private keys.
        </p>
      </div>
    </div>
  );
}
