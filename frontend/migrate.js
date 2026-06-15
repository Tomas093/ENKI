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

const screensDir = path.join(__dirname, 'src/components/screens');
const appDir = path.join(__dirname, 'src/app');

for (const [file, route] of Object.entries(map)) {
  const sourcePath = path.join(screensDir, file);
  if (!fs.existsSync(sourcePath)) {
    console.log(`Skipping ${file}`);
    continue;
  }
  
  let content = fs.readFileSync(sourcePath, 'utf8');
  
  if (!content.includes('"use client"')) {
    content = '"use client";\n' + content;
  }
  
  content = content.replace(/from "react-router"/g, 'from "next/navigation"');
  content = content.replace(/useNavigate\(\)/g, 'useRouter()');
  content = content.replace(/navigate\(/g, 'router.push(');
  
  const componentName = file.replace('.tsx', '');
  const regex = new RegExp(`export const ${componentName} = \\(\\) => \\{`, 'g');
  content = content.replace(regex, `export default function ${componentName}() {`);
  
  const regex2 = new RegExp(`export function ${componentName}\\(\\) \\{`, 'g');
  content = content.replace(regex2, `export default function ${componentName}() {`);

  const targetDir = path.join(appDir, route);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(targetDir, 'page.tsx'), content);
  console.log(`Migrated ${file} -> ${route}/page.tsx`);
}
