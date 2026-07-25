const DIFFICULTY_STYLES = {
  Easy: 'text-success border-success/30 bg-success/10',
  Medium: 'text-warning border-warning/30 bg-warning/10',
  Hard: 'text-danger border-danger/30 bg-danger/10',
};

export function DifficultyBadge({ difficulty }) {
  return (
    <span className={`badge ${DIFFICULTY_STYLES[difficulty] || 'border-white/10'}`}>{difficulty}</span>
  );
}

export function Select({ value, onChange, options, placeholder, className = '', optionLabels = {} }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      className={`input-field cursor-pointer ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-surface">
          {optionLabels[opt] || opt}
        </option>
      ))}
    </select>
  );
}