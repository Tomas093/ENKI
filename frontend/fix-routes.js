const fs = require('fs');
const path = require('path');

const map = {
  "ActiveGameplay.tsx": "gameplay",
  "EmergencyRefund.tsx": "emergency-refund",
  "FinalLeaderboard.tsx": "leaderboard",
  "JoinWaitingRoom.tsx": "join-waiting",
  "StakingLobby.tsx": "staking",
  "TransactionMining.tsx": "transaction-mining",
  "WaitingRoom.tsx": "waiting",
  "WalletConnect.tsx": "wallet-connect"
};

const appDir = path.join(__dirname, 'src/app');

for (const route of Object.values(map)) {
  const file = path.join(appDir, route, 'page.tsx');
  if (!fs.existsSync(file)) continue;
  
  let content = fs.readFileSync(file, 'utf8');
  
  // Fix imports
  content = content.replace(/useNavigate/g, 'useRouter');
  
  // Fix variable declarations
  content = content.replace(/const navigate = useRouter\(\);/g, 'const router = useRouter();');
  
  // Fix /select-role pointing to home
  content = content.replace(/router\.push\("\/select-role"\)/g, 'router.push("/")');

  fs.writeFileSync(file, content);
  console.log(`Fixed ${file}`);
}
