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
  const [courseTitle, setCourseTitle] = useState("Blockchain Fundamentals");
  const [subtitle, setSubtitle] = useState("Awarded for outstanding performance in the final trivia.");
  const [issuerName, setIssuerName] = useState("Professor Satoshi");
  
  const [primaryColor, setPrimaryColor] = useState("#4f46e5");
  const [secondaryColor, setSecondaryColor] = useState("#9333ea");
  const [accentColor, setAccentColor] = useState("#f59e0b");
  const [textColor, setTextColor] = useState("#ffffff");
  
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
        if (config.secondaryColor) setSecondaryColor(config.secondaryColor);
        if (config.accentColor) setAccentColor(config.accentColor);
        if (config.textColor) setTextColor(config.textColor);
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
          <rect width="800" height="600" fill="#1e293b"/>
          <text x="400" y="300" font-family="sans-serif" font-size="24" fill="#94a3b8" text-anchor="middle">No image URL provided. Paste a link below.</text>
        </svg>
      `.trim();
    }

    // Template Mode
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 800 600">
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${primaryColor}"/>
            <stop offset="100%" stop-color="${secondaryColor}"/>
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        ${bgImageUrl 
          ? `<image href="${bgImageUrl}" width="800" height="600" preserveAspectRatio="xMidYMid slice" />`
          : `<rect width="800" height="600" fill="url(#bgGradient)"/>`
        }
        
        <rect x="24" y="24" width="752" height="552" fill="none" stroke="${accentColor}" stroke-width="8" opacity="0.8" filter="url(#shadow)"/>
        <rect x="36" y="36" width="728" height="528" fill="none" stroke="${textColor}" stroke-width="2" opacity="0.5" filter="url(#shadow)"/>

        <text x="400" y="140" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="42" font-weight="900" fill="${textColor}" text-anchor="middle" letter-spacing="4" filter="url(#shadow)">CERTIFICATE OF ACHIEVEMENT</text>
        <text x="400" y="210" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="20" font-weight="400" fill="${textColor}" text-anchor="middle" filter="url(#shadow)">This certifies that the holder has successfully completed</text>
        <text x="400" y="310" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="56" font-weight="900" fill="${accentColor}" text-anchor="middle" filter="url(#shadow)">${courseTitle}</text>
        <text x="400" y="390" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="14" font-style="italic" fill="${textColor}" text-anchor="middle" filter="url(#shadow)">${subtitle}</text>
        
        <line x1="250" y1="480" x2="550" y2="480" stroke="${textColor}" stroke-width="2" opacity="0.8" filter="url(#shadow)"/>
        <text x="400" y="520" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="${textColor}" text-anchor="middle" letter-spacing="1" filter="url(#shadow)">Issued by ${issuerName}</text>
        <text x="760" y="575" font-family="monospace" font-size="14" font-weight="bold" fill="${textColor}" text-anchor="end" opacity="0.8" filter="url(#shadow)">Powered by ENKI Web3</text>
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
    // Because the image URL inside the SVG is just text (not a massive blob), 
    // this tokenURI will remain very lightweight and fit in the block gas limits perfectly!
    const tokenURI = `data:application/json;base64,${metadataBase64}`;

    localStorage.setItem("saved_diploma_uri", tokenURI);
    localStorage.setItem("saved_diploma_config", JSON.stringify({
      designMode, courseTitle, subtitle, issuerName, primaryColor, secondaryColor, accentColor, textColor, bgImageUrl, fullImageUrl
    }));

    toast.success("Diploma saved to library!");
    router.push("/host-game");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-6xl">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold mb-8 transition-colors">
          <ArrowLeft size={20} /> Back
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <Award className="text-purple-600" size={40} /> NFT Diploma Studio
            </h1>
            <p className="text-slate-500 font-medium mt-2">Design the fully decentralized, on-chain NFT certificate your students will earn.</p>
          </div>
          <button onClick={handleSave} className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black px-8 py-3 rounded-[16px] shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 whitespace-nowrap">
            <Save size={20} /> Save & Use
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Panel */}
          <div className="lg:col-span-4 bg-white rounded-[24px] border-[3px] border-slate-200 p-6 shadow-sm flex flex-col gap-6">
            
            {/* Mode Switcher */}
            <div className="flex bg-slate-100 p-1.5 rounded-[16px]">
              <button 
                onClick={() => setDesignMode("template")} 
                className={`flex-1 py-2 rounded-[12px] font-bold text-sm transition-all ${designMode === "template" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Template
              </button>
              <button 
                onClick={() => setDesignMode("full-image")} 
                className={`flex-1 py-2 rounded-[12px] font-bold text-sm transition-all ${designMode === "full-image" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                URL Link
              </button>
            </div>

            {designMode === "template" ? (
              <>
                {/* Template Content */}
                <div>
                  <h3 className="font-black text-slate-800 flex items-center gap-2 mb-4 border-b-2 border-slate-100 pb-2">
                    <Type size={18} className="text-purple-500" /> Text Content
                  </h3>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block font-bold text-slate-600 text-sm mb-1.5">Course Title</label>
                      <input type="text" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-800 focus:outline-none focus:border-purple-500" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 text-sm mb-1.5">Subtitle / Description</label>
                      <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-800 focus:outline-none focus:border-purple-500" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 text-sm mb-1.5">Issuer Name</label>
                      <input type="text" value={issuerName} onChange={e => setIssuerName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-800 focus:outline-none focus:border-purple-500" />
                    </div>
                  </div>
                </div>

                {/* Template Visuals */}
                <div>
                  <h3 className="font-black text-slate-800 flex items-center gap-2 mb-4 border-b-2 border-slate-100 pb-2 mt-4">
                    <Palette size={18} className="text-pink-500" /> Visuals
                  </h3>
                  
                  <div className="mb-4">
                    <label className="block font-bold text-slate-600 text-xs mb-1.5 uppercase tracking-wide">Background Image URL (Optional)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LinkIcon size={16} className="text-slate-400" />
                      </div>
                      <input 
                        type="url" 
                        placeholder="https://..." 
                        value={bgImageUrl} 
                        onChange={e => setBgImageUrl(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-10 py-2 font-medium text-slate-800 focus:outline-none focus:border-purple-500"
                      />
                      {bgImageUrl && (
                        <button onClick={() => setBgImageUrl("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-red-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Paste a direct link to an image (Imgur, IPFS, etc).</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-600 text-xs mb-1.5 uppercase tracking-wide">Grad Start</label>
                      <div className="flex items-center gap-2 border-2 border-slate-200 rounded-xl p-1.5 bg-slate-50">
                        <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <span className="font-mono text-sm font-bold text-slate-600 uppercase">{primaryColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 text-xs mb-1.5 uppercase tracking-wide">Grad End</label>
                      <div className="flex items-center gap-2 border-2 border-slate-200 rounded-xl p-1.5 bg-slate-50">
                        <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <span className="font-mono text-sm font-bold text-slate-600 uppercase">{secondaryColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 text-xs mb-1.5 uppercase tracking-wide">Accent</label>
                      <div className="flex items-center gap-2 border-2 border-slate-200 rounded-xl p-1.5 bg-slate-50">
                        <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <span className="font-mono text-sm font-bold text-slate-600 uppercase">{accentColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 text-xs mb-1.5 uppercase tracking-wide">Text</label>
                      <div className="flex items-center gap-2 border-2 border-slate-200 rounded-xl p-1.5 bg-slate-50">
                        <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <span className="font-mono text-sm font-bold text-slate-600 uppercase">{textColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Full Image Mode Controls
              <div className="flex flex-col gap-4">
                <div className="bg-blue-50 border-[3px] border-blue-100 rounded-2xl p-4 flex flex-col items-center text-center gap-2 mb-4">
                  <ImageIcon className="text-blue-500" size={32} />
                  <h4 className="font-black text-blue-900">Provide Image Link</h4>
                  <p className="text-blue-700 text-sm font-medium">Host your diploma design on a site like Imgur or IPFS and paste the direct link below.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 text-sm mb-1.5">Direct Image URL</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon size={18} className="text-slate-400" />
                    </div>
                    <input 
                      type="url" 
                      placeholder="https://i.imgur.com/... or ipfs://" 
                      value={fullImageUrl} 
                      onChange={e => setFullImageUrl(e.target.value)}
                      className="w-full bg-slate-50 border-[3px] border-slate-200 rounded-xl pl-10 pr-10 py-4 font-medium text-slate-800 focus:outline-none focus:border-purple-500"
                    />
                    {fullImageUrl && (
                      <button onClick={() => setFullImageUrl("")} className="absolute inset-y-0 right-0 pr-4 flex items-center text-red-400 hover:text-red-600">
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
                
                {fullImageUrl && (
                  <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-700 font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 mt-2">
                    <Check size={18} /> Linked image ready
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live Preview Panel */}
          <div className="lg:col-span-8 bg-slate-800 rounded-[24px] border-[4px] border-slate-900 p-4 md:p-8 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-4 left-4 bg-slate-900/50 text-white/50 font-black text-xs px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-md z-10">
              Live Preview
            </div>

            <div className="w-full h-full flex items-center justify-center">
              <div 
                className="w-full max-w-[800px] shadow-2xl rounded-[16px] overflow-hidden" 
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
