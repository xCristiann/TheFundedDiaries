export default function GlassCard({ children, className = '', hover = false }) {
  return (
    <div
      className={`
        bg-white/5 backdrop-blur-md
        border border-blue-500/20
        rounded-xl p-6
        shadow-xl shadow-blue-500/5
        ${hover ? 'hover:border-blue-500/40 hover:shadow-blue-500/10 hover:bg-white/[0.07] transition-all duration-300' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
