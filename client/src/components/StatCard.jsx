import { motion } from 'framer-motion';

export default function StatCard({ label, value, icon: Icon, accent = 'blue', suffix }) {
  const accentClasses = {
    blue: 'text-accent-blue',
    purple: 'text-accent-purple',
    success: 'text-success',
    warning: 'text-warning',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card flex items-center justify-between p-5"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-2 font-display text-3xl font-semibold">
          {value}
          {suffix && <span className="ml-1 text-base font-normal text-muted">{suffix}</span>}
        </p>
      </div>
      {Icon && (
        <div className={`rounded-xl bg-white/[0.04] p-3 ${accentClasses[accent]}`}>
          <Icon size={22} />
        </div>
      )}
    </motion.div>
  );
}
