import { useTheme } from '../context/ThemeContext';

export default function ThemeSelector() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <section className="card theme-card" aria-labelledby="theme-heading">
      <h2 id="theme-heading" className="theme-card-title">
        Appearance
      </h2>
      <p className="task-meta theme-card-desc">Choose a color theme for the app</p>
      <div className="theme-options" role="radiogroup" aria-label="Color theme">
        {themes.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={theme === t.id}
            className={`theme-option${theme === t.id ? ' theme-option-active' : ''}`}
            onClick={() => setTheme(t.id)}
          >
            <span className="theme-swatch" aria-hidden>
              <span style={{ background: t.swatch[0] }} />
              <span style={{ background: t.swatch[1] }} />
            </span>
            <span className="theme-option-label">{t.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
