import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { EXPERIMENTS } from './registry';
import { Home }       from './components/Home';

// Lazy load experiments for better performance
const Coin       = lazy(() => import('./experiments/coin/Coin').then(m => ({ default: m.Coin })));
const Dice       = lazy(() => import('./experiments/dice/Dice').then(m => ({ default: m.Dice })));
const Normal     = lazy(() => import('./experiments/normal/Normal').then(m => ({ default: m.Normal })));
const Hypothesis = lazy(() => import('./experiments/hypothesis/Hypothesis').then(m => ({ default: m.Hypothesis })));
const Birthday   = lazy(() => import('./experiments/birthday/Birthday').then(m => ({ default: m.Birthday })));
const MonteCarlo = lazy(() => import('./experiments/montecarlo/MonteCarlo').then(m => ({ default: m.MonteCarlo })));
const Zanuda     = lazy(() => import('./experiments/zanuda/Zanuda').then(m => ({ default: m.Zanuda })));
const EGE        = lazy(() => import('./experiments/ege/EGE').then(m => ({ default: m.EGE })));
const MontyHall  = lazy(() => import('./experiments/montyhall/MontyHall').then(m => ({ default: m.MontyHall })));
const Rumor      = lazy(() => import('./experiments/rumor/Rumor').then(m => ({ default: m.Rumor })));

ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  Tooltip, Legend, Filler,
);

const COMPONENTS: Record<string, React.ComponentType> = {
  coin:       Coin,
  dice:       Dice,
  normal:     Normal,
  hypothesis: Hypothesis,
  birthday:   Birthday,
  montecarlo: MonteCarlo,
  zanuda:     Zanuda,
  montyhall:  MontyHall,
  ege:        EGE,
  rumor:      Rumor,
};

function HomePage() {
  const navigate = useNavigate();
  return (
    <>
      <header className="topbar" role="banner">
        <span className="topbar__logo">🧪 RandomLab</span>
      </header>
      <Home onSelect={(id) => navigate(`/experiment/${id}`)} />
    </>
  );
}

function ExperimentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!id || !COMPONENTS[id]) {
    navigate('/');
    return null;
  }

  const ExpComponent = COMPONENTS[id];
  const currentIndex = EXPERIMENTS.findIndex(e => e.id === id);
  const prevExp      = EXPERIMENTS[currentIndex - 1];
  const nextExp      = EXPERIMENTS[currentIndex + 1];

  return (
    <>
      <header className="topbar" role="banner">
        <span className="topbar__logo">🧪 RandomLab</span>
        <div className="topbar__right">
          <button
            className="topbar__home-btn"
            onClick={() => navigate('/')}
            aria-label="Вернуться на главную страницу"
          >
            ← Главная
          </button>
          <button
            className={'topbar__burger' + (sidebarOpen ? ' is-open' : '')}
            onClick={() => setSidebarOpen(o => !o)}
            aria-label={sidebarOpen ? "Закрыть меню экспериментов" : "Открыть меню экспериментов"}
            aria-expanded={sidebarOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      <div className="lab-page">
        {/* ── SIDEBAR ── */}
        <aside
          className={'lab-sidebar' + (sidebarOpen ? ' is-open' : '')}
          role="navigation"
          aria-label="Навигация по экспериментам"
        >
          <div className="lab-sidebar__label">Эксперименты</div>
          {EXPERIMENTS.map(e => (
            <button
              key={e.id}
              className={'lab-sidebar__item' + (e.id === id ? ' active' : '')}
              onClick={() => { navigate(`/experiment/${e.id}`); setSidebarOpen(false); }}
              style={e.id === id ? { borderLeftColor: e.color } : {}}
            >
              <span className="lab-sidebar__item-emoji">{e.emoji}</span>
              <span>{e.title}</span>
            </button>
          ))}
        </aside>

        {sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Закрыть меню"
            onKeyDown={(e) => e.key === 'Enter' && setSidebarOpen(false)}
          />
        )}

        {/* ── MAIN ── */}
        <main className="lab-main" role="main">
          <Suspense fallback={
            <div className="loading-state">
              <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
              <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Загрузка эксперимента...</p>
            </div>
          }>
            <ExpComponent />
          </Suspense>

          {/* Пред / след */}
          <div className="exp-nav">
            {prevExp ? (
              <button
                className="exp-nav__btn exp-nav__btn--prev"
                onClick={() => navigate(`/experiment/${prevExp.id}`)}
              >
                <span className="exp-nav__arrow">←</span>
                <span className="exp-nav__info">
                  <span className="exp-nav__hint">Предыдущий</span>
                  <span className="exp-nav__name">{prevExp.emoji} {prevExp.title}</span>
                </span>
              </button>
            ) : <div />}

            {nextExp ? (
              <button
                className="exp-nav__btn exp-nav__btn--next"
                onClick={() => navigate(`/experiment/${nextExp.id}`)}
              >
                <span className="exp-nav__info" style={{ textAlign: 'right' }}>
                  <span className="exp-nav__hint">Следующий</span>
                  <span className="exp-nav__name">{nextExp.emoji} {nextExp.title}</span>
                </span>
                <span className="exp-nav__arrow">→</span>
              </button>
            ) : <div />}
          </div>

          {/* Быстрый переключатель */}
          <div className="exp-switcher">
            <div className="exp-switcher__label">Другие эксперименты</div>
            <div className="exp-switcher__row">
              {EXPERIMENTS.filter(e => e.id !== id).map(e => (
                <button
                  key={e.id}
                  className="exp-switcher__chip"
                  onClick={() => navigate(`/experiment/${e.id}`)}
                  style={{ borderColor: e.color + '60' }}
                >
                  {e.emoji} {e.title}
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/experiment/:id" element={<ExperimentPage />} />
      </Routes>
    </BrowserRouter>
  );
}