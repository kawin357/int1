import Network3D from './Network3D';

const BackgroundAnimation = () => {
  return (
    <>
      <div className="fixed inset-0 -z-30 bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
        <Network3D />
      </div>

      <div className="fixed inset-0 -z-20 opacity-[0.03]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="fixed inset-0 -z-15 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[10%] text-6xl text-blue-400/15 animate-float drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]" style={{animationDelay: '0s'}}>∑</div>
        <div className="absolute top-[25%] right-[15%] text-5xl text-purple-400/15 animate-float drop-shadow-[0_0_20px_rgba(168,85,247,0.3)]" style={{animationDelay: '1s'}}>∫</div>
        <div className="absolute bottom-[20%] left-[20%] text-7xl text-green-400/15 animate-float drop-shadow-[0_0_25px_rgba(34,197,94,0.3)]" style={{animationDelay: '2s'}}>π</div>
        <div className="absolute top-[60%] right-[25%] text-6xl text-indigo-400/15 animate-float drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]" style={{animationDelay: '1.5s'}}>∞</div>
        <div className="absolute bottom-[35%] right-[10%] text-5xl text-teal-400/15 animate-float drop-shadow-[0_0_20px_rgba(20,184,166,0.3)]" style={{animationDelay: '0.5s'}}>√</div>
        <div className="absolute top-[40%] left-[15%] text-6xl text-cyan-400/15 animate-float drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]" style={{animationDelay: '2.5s'}}>α</div>

        <div className="absolute top-[50%] left-[50%] w-64 h-64 bg-blue-400/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-[20%] right-[20%] w-48 h-48 bg-purple-400/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 backdrop-blur-[1px] bg-white/20" />
        <div className="absolute inset-0 backdrop-saturate-110 bg-gradient-to-br from-white/25 via-blue-50/15 to-purple-50/20" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-300/25 to-transparent" />
      </div>
    </>
  );
};

export default BackgroundAnimation;
