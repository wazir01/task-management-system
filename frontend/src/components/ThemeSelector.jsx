import { useTheme } from '../context/ThemeContext';

export default function ThemeSelector({ className = '' }) {
  const { theme, setTheme, themes } = useTheme();

  return (
    <div className={`theme-picker ${className}`.trim()} role="group" aria-labelledby="theme-picker-label">
      <span id="theme-picker-label" className="theme-picker-label">
        <span className="theme-picker-icon" aria-hidden>
          ◐
        </span>
        Theme
      </span>
      <div className="theme-picker-orbs" role="radiogroup" aria-label="Color theme">
        {themes.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={theme === t.id}
            aria-label={t.label}
            title={t.label}
            className={`theme-orb theme-orb--${t.id}${theme === t.id ? ' theme-orb-active' : ''}`}
            onClick={() => setTheme(t.id)}
          >
            <span className="theme-orb-glow" aria-hidden />
            <span className="theme-orb-surface" aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}
