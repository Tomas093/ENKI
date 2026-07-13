"use client";

// ─── Neo-Brutalist input ──────────────────────────────────────────────────────
export function BrutalField({
  id,
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  autoFocus = false,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoFocus?: boolean;
  error?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-black text-sm uppercase tracking-wider text-black ml-0.5"
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        style={{
          boxShadow: error ? "3px 3px 0px #E61919" : "3px 3px 0px #000",
        }}
        className={[
          "w-full bg-white border-2 px-4 py-3.5",
          "text-[16px] font-bold text-black placeholder:text-gray-300 placeholder:font-normal",
          "outline-none transition-all duration-75",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF3366]",
          error ? "border-red-500" : "border-black",
        ].join(" ")}
      />
    </div>
  );
}
