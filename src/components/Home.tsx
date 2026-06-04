import { EXPERIMENTS } from '../registry';

interface Props {
  onSelect: (id: string) => void;
}

const TAG_COLORS: Record<string, string> = {
  'Теория вероятностей':       'rgba(167,139,250,0.15)',
  'Математическая статистика': 'rgba(56,189,248,0.15)',
  'Мои идеи':                  'rgba(251,146,60,0.15)',
};
const TAG_TEXT: Record<string, string> = {
  'Теория вероятностей':       '#a78bfa',
  'Математическая статистика': '#38bdf8',
  'Мои идеи':                  '#fb923c',
};

export function Home({ onSelect }: Props) {
  return (
    <div className="home-page">

      {/* ── HERO ── */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__floaters" aria-hidden="true">
          {['🪙','🎲','🔔','🧪','🎂','🎯','📊','📐'].map((e, i) => (
            <span key={i} className="hero__floater">{e}</span>
          ))}
        </div>

        <div className="hero__inner">
          <div className="hero__badge">
            <span className="hero__badge-dot" />
            Интерактивная лаборатория
          </div>

          <h1 className="hero__title" id="hero-title">
            Теория вероятностей<br />
            <span className="hero__accent">без скуки</span>
          </h1>

          <p className="hero__sub">
            Бросай монетки и кубики, считай π случайными точками,
            лови нечестный кубик χ²-тестом — всё прямо в браузере.
          </p>

          <div className="hero__stats">
            <div className="hero__stat">
              <span className="hero__stat-num">{EXPERIMENTS.length}</span>
              <span className="hero__stat-label">экспериментов</span>
            </div>
            <div className="hero__stat-sep" />
            <div className="hero__stat">
              <span className="hero__stat-num">∞</span>
              <span className="hero__stat-label">бросков</span>
            </div>
            <div className="hero__stat-sep" />
            <div className="hero__stat">
              <span className="hero__stat-num">0</span>
              <span className="hero__stat-label">скуки</span>
            </div>
          </div>

          <a href="#experiments" className="hero__scroll-hint">
            <span>Выбери эксперимент</span>
            <span className="hero__scroll-arrow">↓</span>
          </a>
        </div>

        {/* Декоративная сетка карточек в правой части на десктопе */}
        <div className="hero__preview" aria-hidden="true">
          {EXPERIMENTS.slice(0, 4).map(exp => (
            <div key={exp.id} className="hero__preview-card" style={{ borderColor: exp.color + '40' }}>
              <span className="hero__preview-emoji">{exp.emoji}</span>
              <span className="hero__preview-title">{exp.title}</span>
              <div className="hero__preview-bar" style={{ background: exp.color }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── GRID ── */}
      <section id="experiments" className="exp-section" aria-labelledby="experiments-title">
        <div className="exp-section__header">
          <h2 className="exp-section__title" id="experiments-title">Все эксперименты</h2>
          <p className="exp-section__sub">Нажми на любой — откроется сразу</p>
        </div>

        <div className="exp-grid" role="list">
          {EXPERIMENTS.map(exp => (
            <button
              key={exp.id}
              className="exp-card"
              onClick={() => onSelect(exp.id)}
              role="listitem"
              aria-label={`${exp.title}: ${exp.desc}`}
            >
              <div className="exp-card__top">
                <span className="exp-card__emoji">{exp.emoji}</span>
                <span
                  className="exp-card__tag"
                  style={{
                    background: TAG_COLORS[exp.tag] ?? 'rgba(255,255,255,0.06)',
                    color:      TAG_TEXT[exp.tag]   ?? 'rgba(255,255,255,0.5)',
                  }}
                >
                  {exp.tag}
                </span>
              </div>
              <div className="exp-card__bar" style={{ background: exp.color }} />
              <div className="exp-card__title">{exp.title}</div>
              <div className="exp-card__desc">{exp.desc}</div>
              <div className="exp-card__cta" style={{ color: exp.color }}>
                Запустить →
              </div>
            </button>
          ))}
        </div>
      </section>

    </div>
  );
}