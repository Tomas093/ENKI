const fs = require('fs');
const path = require('path');

const files = [
  "src/app/teacher/create/page.tsx",
  "src/app/teacher/lobby/page.tsx",
  "src/app/teacher/session/[id]/page.tsx"
];

for (const relPath of files) {
  const file = path.join(__dirname, relPath);
  if (!fs.existsSync(file)) continue;
  
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('"use client"')) {
    content = '"use client";\n' + content;
  }
  
  content = content.replace(/from "react-router"/g, 'from "next/navigation"');
  content = content.replace(/useNavigate\(\)/g, 'useRouter()');
  content = content.replace(/navigate\(/g, 'router.push(');
  content = content.replace(/useLocation\(\)/g, 'useSearchParams()');
  
  // Fix export const Component = () => to export default function Component()
  content = content.replace(/export const (\w+) = \(\) => \{/g, 'export default function $1() {');
  
  // In CreateSession: navigate("/teacher") -> router.push("/host/dashboard")
  content = content.replace(/router\.push\("\/teacher"\)/g, 'router.push("/host/dashboard")');
  
  // In CreateSession: navigate("/teacher/lobby", { state: { title } })
  content = content.replace(/router\.push\("\/teacher\/lobby", \{ state: \{ title \} \}\)/g, 'router.push(`/teacher/lobby?title=${encodeURIComponent(title)}`)');

  // In TeacherLobby: location.state?.title -> searchParams?.get("title")
  content = content.replace(/location\.state\?\.\w+/g, 'searchParams?.get("title")');
  content = content.replace(/location\.state as \{ title\?: string \}\)\?\.title/g, 'searchParams?.get("title")');

  fs.writeFileSync(file, content);
  console.log(`Fixed ${file}`);
}
