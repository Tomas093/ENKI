"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Palette, Type, Award, Image as ImageIcon, Link as LinkIcon, Trash2, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function DiplomaStudio() {
  const router = useRouter();

  // Mode
  const [designMode, setDesignMode] = useState<"template" | "full-image">("template");

  // Template State
  const [courseTitle, setCourseTitle] = useState("Blockchain Basics");
  const [subtitle, setSubtitle] = useState("Awarded for surviving the final trivia");
  const [issuerName, setIssuerName] = useState("Satoshi");
  
  const [primaryColor, setPrimaryColor] = useState("#FFE234"); // background
  const [accentColor, setAccentColor] = useState("#000000");   // borders and lines
  const [textColor, setTextColor] = useState("#000000");       // text
  const [decorationColor, setDecorationColor] = useState("#FF3366"); // extra brutalist touches
  
  // URL States instead of Base64
  const [bgImageUrl, setBgImageUrl] = useState<string>("");
  const [fullImageUrl, setFullImageUrl] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem("saved_diploma_config");
    if (saved) {
      try {
        const config = JSON.parse(saved);
        if (config.designMode) setDesignMode(config.designMode);
        if (config.courseTitle) setCourseTitle(config.courseTitle);
        if (config.subtitle) setSubtitle(config.subtitle);
        if (config.issuerName) setIssuerName(config.issuerName);
        if (config.primaryColor) setPrimaryColor(config.primaryColor);
        if (config.accentColor) setAccentColor(config.accentColor);
        if (config.textColor) setTextColor(config.textColor);
        if (config.decorationColor) setDecorationColor(config.decorationColor);
        if (config.bgImageUrl) setBgImageUrl(config.bgImageUrl);
        if (config.fullImageUrl) setFullImageUrl(config.fullImageUrl);
      } catch (e) {}
    }
  }, []);

  const generateSVG = () => {
    if (designMode === "full-image" && fullImageUrl) {
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 800 600">
          <image href="${fullImageUrl}" width="800" height="600" preserveAspectRatio="xMidYMid slice" />
        </svg>
      `.trim();
    }

    if (designMode === "full-image" && !fullImageUrl) {
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 800 600">
          <rect width="800" height="600" fill="#000000"/>
          <text x="400" y="300" font-family="monospace" font-size="24" font-weight="bold" fill="#39FF14" text-anchor="middle">// NO IMAGE URL PROVIDED</text>
        </svg>
      `.trim();
    }

    // Neo-Brutalist Template Mode
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 800 600">
        <!-- Background -->
        ${bgImageUrl 
          ? `<image href="${bgImageUrl}" width="800" height="600" preserveAspectRatio="xMidYMid slice" />`
          : `<rect width="800" height="600" fill="${primaryColor}"/>`
        }
        
        <!-- Grid overlay -->
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${accentColor}" stroke-width="1" opacity="0.1" />
          </pattern>
        </defs>
        <rect width="800" height="600" fill="url(#grid)" />

        <!-- Heavy Borders -->
        <rect x="24" y="24" width="752" height="552" fill="none" stroke="${accentColor}" stroke-width="16" />
        <rect x="36" y="36" width="728" height="528" fill="none" stroke="${accentColor}" stroke-width="4" />
        
        <!-- Decoration Blocks -->
        <rect x="24" y="24" width="120" height="120" fill="${decorationColor}" stroke="${accentColor}" stroke-width="8" />
        <rect x="656" y="476" width="120" height="100" fill="${decorationColor}" stroke="${accentColor}" stroke-width="8" />

        <!-- Top Star Icon Placeholder -->
        <path d="M 84 50 L 96 74 L 122 78 L 104 96 L 108 122 L 84 110 L 60 122 L 64 96 L 46 78 L 72 74 Z" fill="${primaryColor}" stroke="${accentColor}" stroke-width="4" />

        <!-- Texts -->
        <text x="400" y="160" font-family="sans-serif" font-size="64" font-weight="900" fill="${textColor}" text-anchor="middle" text-transform="uppercase" letter-spacing="2">CERTIFICATE</text>
        
        <rect x="200" y="210" width="400" height="40" fill="${accentColor}" />
        <text x="400" y="238" font-family="monospace" font-size="18" font-weight="bold" fill="${primaryColor}" text-anchor="middle" text-transform="uppercase">THIS CERTIFIES THE HOLDER SURVIVED</text>
        
        <text x="400" y="350" font-family="sans-serif" font-size="56" font-weight="900" fill="${textColor}" text-anchor="middle" text-transform="uppercase">${courseTitle}</text>
        
        <text x="400" y="420" font-family="monospace" font-size="18" font-weight="bold" fill="${textColor}" text-anchor="middle" text-transform="uppercase" letter-spacing="1">/* ${subtitle} */</text>
        
        <!-- Divider -->
        <line x1="100" y1="480" x2="656" y2="480" stroke="${accentColor}" stroke-width="8" stroke-dasharray="16 8"/>
        
        <!-- Footer -->
        <text x="80" y="540" font-family="sans-serif" font-size="28" font-weight="900" fill="${textColor}" text-anchor="start" text-transform="uppercase">ISSUER: ${issuerName}</text>
        
        <!-- Fixed ENKI WEB3 (centered in the pink block) -->
        <text x="716" y="532" font-family="monospace" font-size="16" font-weight="900" fill="${textColor}" text-anchor="middle">ENKI WEB3</text>
      </svg>
    `.trim();
  };

  const handleSave = () => {
    if (designMode === "full-image" && !fullImageUrl) {
      return toast.error("Please provide an image URL first!");
    }

    const svgStr = generateSVG();
    const svgBase64 = btoa(unescape(encodeURIComponent(svgStr)));
    const imageURI = `data:image/svg+xml;base64,${svgBase64}`;

    const metadataName = designMode === "full-image" ? "Custom ENKI Diploma" : `ENKI Diploma: ${courseTitle}`;
    const metadataDesc = designMode === "full-image" ? "Custom Web3 Certificate" : subtitle;

    const metadata = {
      name: metadataName,
      description: metadataDesc,
      image: imageURI,
      attributes: [
        { trait_type: "Platform", value: "ENKI" },
        ...(designMode === "template" ? [{ trait_type: "Issuer", value: issuerName }] : [])
      ]
    };

    const metadataStr = JSON.stringify(metadata);
    const metadataBase64 = btoa(unescape(encodeURIComponent(metadataStr)));
    const tokenURI = `data:application/json;base64,${metadataBase64}`;

    localStorage.setItem("saved_diploma_uri", tokenURI);
    localStorage.setItem("saved_diploma_config", JSON.stringify({
      designMode, courseTitle, subtitle, issuerName, primaryColor, accentColor, textColor, decorationColor, bgImageUrl, fullImageUrl
    }));

    toast.success("Diploma saved to library!");
    router.push("/host-game");
  };

  return (
    <div className="flex flex-col items-center py-10 px-4 md:px-8 relative z-10 w-full max-w-7xl mx-auto">
      <div className="w-full">
        
        <button onClick={() => router.back()} className="bg-white border-2 border-black text-black shadow-[4px_4px_0px_#000] hover:bg-gray-100 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all uppercase tracking-wide font-black text-sm px-6 py-3 mb-8 cursor-pointer flex items-center gap-2 w-max">
          <ArrowLeft size={16} strokeWidth={3} /> Back
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
          <div>
            <h1 className="text-[48px] font-black uppercase tracking-[-0.03em] leading-[0.88] text-black flex items-center gap-4">
              <span className="w-14 h-14 bg-neo-accent border-2 border-black shadow-[4px_4px_0px_#000] flex items-center justify-center shrink-0">
                <Award className="text-black" size={32} strokeWidth={2.5} />
              </span>
              NFT Diploma Studio
            </h1>
            <p className="font-mono text-[12px] uppercase tracking-[0.05em] text-gray-500 mt-4">
              // Design the fully decentralized, on-chain NFT certificate
            </p>
          </div>
          <button onClick={handleSave} className="bg-white text-black border-2 border-black shadow-[6px_6px_0px_#000] hover:bg-neo-accent active:translate-x-1.5 active:translate-y-1.5 active:shadow-none font-black uppercase text-[13px] tracking-wider px-8 py-4 flex items-center gap-2 transition-all cursor-pointer">
            <Save size={20} strokeWidth={3} /> Save & Use
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Panel */}
          <div className="lg:col-span-5 bg-white border-2 border-black p-6 shadow-[8px_8px_0px_#000] flex flex-col gap-6">
            
            {/* Mode Switcher */}
            <div className="flex gap-2">
              <button 
                onClick={() => setDesignMode("template")} 
                className={`flex-1 py-3 border-2 border-black font-black uppercase tracking-wide text-sm transition-all shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${designMode === "template" ? "bg-black text-white" : "bg-white text-black hover:bg-neo-accent"}`}
              >
                Template
              </button>
              <button 
                onClick={() => setDesignMode("full-image")} 
                className={`flex-1 py-3 border-2 border-black font-black uppercase tracking-wide text-sm transition-all shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${designMode === "full-image" ? "bg-black text-white" : "bg-white text-black hover:bg-neo-accent"}`}
              >
                URL Link
              </button>
            </div>

            {designMode === "template" ? (
              <>
                {/* Template Content */}
                <div>
                  <h3 className="font-black text-black uppercase tracking-wide text-[13px] flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
                    <Type size={18} strokeWidth={3} /> Text Content
                  </h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-black text-black text-sm uppercase tracking-wide">Course Title</label>
                      <input type="text" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} className="w-full bg-white border-2 border-black px-4 py-3 font-black text-black shadow-[4px_4px_0px_#000] focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all outline-none rounded-none uppercase" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-black text-black text-sm uppercase tracking-wide">Subtitle / Description</label>
                      <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full bg-white border-2 border-black px-4 py-3 font-black text-black shadow-[4px_4px_0px_#000] focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all outline-none rounded-none uppercase" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-black text-black text-sm uppercase tracking-wide">Issuer Name</label>
                      <input type="text" value={issuerName} onChange={e => setIssuerName(e.target.value)} className="w-full bg-white border-2 border-black px-4 py-3 font-black text-black shadow-[4px_4px_0px_#000] focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all outline-none rounded-none uppercase" />
                    </div>
                  </div>
                </div>

                {/* Template Visuals */}
                <div>
                  <h3 className="font-black text-black uppercase tracking-wide text-[13px] flex items-center gap-2 mb-4 border-b-2 border-black pb-2 mt-4">
                    <Palette size={18} strokeWidth={3} /> Visuals
                  </h3>
                  
                  <div className="mb-6 flex flex-col gap-1.5">
                    <label className="font-black text-black text-sm uppercase tracking-wide">Background Image URL (Optional)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LinkIcon size={16} className="text-black" strokeWidth={3} />
                      </div>
                      <input 
                        type="url" 
                        placeholder="https://..." 
                        value={bgImageUrl} 
                        onChange={e => setBgImageUrl(e.target.value)}
                        className="w-full bg-white border-2 border-black pl-10 pr-10 py-3 font-black text-black shadow-[4px_4px_0px_#000] focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all outline-none rounded-none"
                      />
                      {bgImageUrl && (
                        <button onClick={() => setBgImageUrl("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-red-500 hover:text-red-700 cursor-pointer">
                          <Trash2 size={20} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                    <p className="font-mono text-xs uppercase text-gray-500 mt-1">Paste a direct link to an image (Imgur, IPFS).</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-black text-black text-sm uppercase tracking-wide">Background</label>
                      <div className="flex items-center gap-3 border-2 border-black bg-white p-2 shadow-[2px_2px_0px_#000]">
                        <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-8 h-8 cursor-pointer border-2 border-black p-0 appearance-none bg-transparent" />
                        <span className="font-mono text-sm font-black text-black uppercase">{primaryColor}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-black text-black text-sm uppercase tracking-wide">Accent & Borders</label>
                      <div className="flex items-center gap-3 border-2 border-black bg-white p-2 shadow-[2px_2px_0px_#000]">
                        <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-8 h-8 cursor-pointer border-2 border-black p-0 appearance-none bg-transparent" />
                        <span className="font-mono text-sm font-black text-black uppercase">{accentColor}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-black text-black text-sm uppercase tracking-wide">Text</label>
                      <div className="flex items-center gap-3 border-2 border-black bg-white p-2 shadow-[2px_2px_0px_#000]">
                        <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-8 h-8 cursor-pointer border-2 border-black p-0 appearance-none bg-transparent" />
                        <span className="font-mono text-sm font-black text-black uppercase">{textColor}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-black text-black text-sm uppercase tracking-wide">Decals</label>
                      <div className="flex items-center gap-3 border-2 border-black bg-white p-2 shadow-[2px_2px_0px_#000]">
                        <input type="color" value={decorationColor} onChange={e => setDecorationColor(e.target.value)} className="w-8 h-8 cursor-pointer border-2 border-black p-0 appearance-none bg-transparent" />
                        <span className="font-mono text-sm font-black text-black uppercase">{decorationColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Full Image Mode Controls
              <div className="flex flex-col gap-6">
                <div className="bg-neo-accent border-2 border-black p-6 flex flex-col items-center text-center gap-3 shadow-[4px_4px_0px_#000]">
                  <ImageIcon className="text-black" size={32} strokeWidth={2.5} />
                  <h4 className="font-black text-black uppercase tracking-wide text-[14px]">Provide Image Link</h4>
                  <p className="font-mono text-sm text-black uppercase">Host your diploma design on a site like Imgur or IPFS and paste the direct link below.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-black text-black text-sm uppercase tracking-wide">Direct Image URL</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon size={20} className="text-black" strokeWidth={2.5} />
                    </div>
                    <input 
                      type="url" 
                      placeholder="HTTPS://..." 
                      value={fullImageUrl} 
                      onChange={e => setFullImageUrl(e.target.value)}
                      className="w-full bg-white border-2 border-black pl-11 pr-11 py-4 font-black text-black shadow-[4px_4px_0px_#000] focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all outline-none rounded-none uppercase"
                    />
                    {fullImageUrl && (
                      <button onClick={() => setFullImageUrl("")} className="absolute inset-y-0 right-0 pr-4 flex items-center text-red-500 hover:text-red-700">
                        <Trash2 size={24} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </div>
                
                {fullImageUrl && (
                  <div className="bg-[#39FF14] border-2 border-black text-black font-black uppercase text-[12px] tracking-wide px-4 py-4 flex items-center justify-center gap-3 shadow-[4px_4px_0px_#000] mt-2">
                    <Check size={20} strokeWidth={3} /> Linked image ready
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live Preview Panel */}
          <div className="lg:col-span-7 bg-[#E5E5E5] border-2 border-black pt-20 pb-8 px-8 shadow-[8px_8px_0px_#000] flex flex-col items-center justify-center relative overflow-hidden"
               style={{ backgroundImage: "repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, #E5E5E5 25%, #E5E5E5 75%, #000 75%, #000)", backgroundPosition: "0 0, 10px 10px", backgroundSize: "20px 20px", opacity: 0.9 }}>
            <div className="absolute inset-0 bg-[#E5E5E5]/90"></div>
            
            <div className="absolute top-6 left-6 bg-black text-[#FFE234] font-black text-xs px-3 py-1.5 uppercase tracking-wide border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] z-50">
              Live Preview
            </div>

            <div className="w-full h-full flex items-center justify-center relative z-10">
              <div 
                className="w-full max-w-[800px] shadow-[16px_16px_0px_rgba(0,0,0,0.5)] border-4 border-black bg-white" 
                style={{ aspectRatio: "800 / 600" }}
                dangerouslySetInnerHTML={{ __html: generateSVG() }} 
              />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
