/**
 * PageBlobs — Decorative blurred gradient blobs for premium ambient background.
 * Usage: Drop anywhere in a page wrapper. Requires parent to have position: relative.
 */
export function PageBlobs({
  primary = "purple",
  secondary = "blue",
}: {
  primary?: "purple" | "amber" | "emerald" | "orange";
  secondary?: "blue" | "indigo" | "teal" | "red";
}) {
  const primaryColor = {
    purple: "bg-purple-400",
    amber: "bg-amber-400",
    emerald: "bg-emerald-400",
    orange: "bg-orange-400",
  }[primary];

  const secondaryColor = {
    blue: "bg-blue-400",
    indigo: "bg-indigo-400",
    teal: "bg-teal-400",
    red: "bg-red-400",
  }[secondary];

  return (
    <>
      <div
        className={`absolute top-[-8%] left-[-8%] w-[500px] h-[500px] ${primaryColor} rounded-full mix-blend-multiply filter blur-[140px] opacity-[0.14] pointer-events-none`}
        aria-hidden="true"
      />
      <div
        className={`absolute bottom-[-8%] right-[-8%] w-[500px] h-[500px] ${secondaryColor} rounded-full mix-blend-multiply filter blur-[140px] opacity-[0.14] pointer-events-none`}
        aria-hidden="true"
      />
    </>
  );
}
