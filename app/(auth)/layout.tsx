export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sidebar-bg flex items-center justify-center p-4">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg, transparent, transparent 40px, #fff 40px, #fff 41px
          ), repeating-linear-gradient(
            90deg, transparent, transparent 40px, #fff 40px, #fff 41px
          )`,
        }}
      />
      <div className="relative w-full max-w-md">
        {/* Logo strip */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-white tracking-tight">ERCE</p>
              <p className="text-[10px] text-sidebar-text font-mono uppercase tracking-widest">Sistema Pericial</p>
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
