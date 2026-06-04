import { useState, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

type Stage = 'pick' | 'reveal' | 'done';

interface Stats {
  switchWins: number; switchTotal: number;
  stayWins:   number; stayTotal:   number;
}

function clampCount(val: number, min: number, max: number, step: number = 1) {
  if (isNaN(val)) return min;
  const rounded = Math.round(val / step) * step;
  return Math.max(min, Math.min(max, rounded));
}

export function MontyHall() {
  const MIN = 100;
  const MAX = 100000;
  const STEP = 10;

  const newPrize = () => Math.floor(Math.random() * 3);

  const [prizeDoor,    setPrizeDoor]    = useState<number>(newPrize);
  const [stage,        setStage]        = useState<Stage>('pick');
  const [pickedDoor,   setPickedDoor]   = useState<number | null>(null);
  const [revealedDoor, setRevealedDoor] = useState<number | null>(null);
  const [finalDoor,    setFinalDoor]    = useState<number | null>(null);
  const [won,          setWon]          = useState<boolean | null>(null);
  const [lastStrategy, setLastStrategy] = useState<'switch' | 'stay' | null>(null);
  const [stats,        setStats]        = useLocalStorage<Stats>('montyhall-stats', {
    switchWins: 0, switchTotal: 0, stayWins: 0, stayTotal: 0,
  });
  const [currentValue, setCurrentValue] = useState(300);
  const [inputValue, setInputValue]     = useState('300');
  const [running,  setRunning]          = useState(false);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startNewGame = () => {
    setPrizeDoor(newPrize());
    setStage('pick');
    setPickedDoor(null);
    setRevealedDoor(null);
    setFinalDoor(null);
    setWon(null);
    setLastStrategy(null);
  };

  const pickDoor = (door: number) => {
    if (stage !== 'pick') return;
    setPickedDoor(door);
    const goats = [0, 1, 2].filter(d => d !== door && d !== prizeDoor);
    const revealed = goats[Math.floor(Math.random() * goats.length)];
    setRevealedDoor(revealed);
    setStage('reveal');
  };

  const decide = (strategy: 'switch' | 'stay') => {
    if (stage !== 'reveal' || pickedDoor === null || revealedDoor === null) return;
    const final = strategy === 'stay'
      ? pickedDoor
      : [0, 1, 2].find(d => d !== pickedDoor && d !== revealedDoor)!;
    setFinalDoor(final);
    const didWin = final === prizeDoor;
    setWon(didWin);
    setStage('done');
    setLastStrategy(strategy);
    setStats(prev => ({
      switchWins:  prev.switchWins  + (strategy === 'switch' && didWin ? 1 : 0),
      switchTotal: prev.switchTotal + (strategy === 'switch' ? 1 : 0),
      stayWins:    prev.stayWins    + (strategy === 'stay'   && didWin ? 1 : 0),
      stayTotal:   prev.stayTotal   + (strategy === 'stay'   ? 1 : 0),
    }));
  };

  const runSim = () => {
    if (running) return;
    setRunning(true);
    setTimeout(() => {
      let sw = 0, st = 0;
      for (let i = 0; i < currentValue; i++) {
        const prize  = Math.floor(Math.random() * 3);
        const pick   = Math.floor(Math.random() * 3);
        if (pick !== prize) sw++;
        if (pick === prize) st++;
      }
      setStats(prev => ({
        switchWins:  prev.switchWins  + sw,
        switchTotal: prev.switchTotal + currentValue,
        stayWins:    prev.stayWins    + st,
        stayTotal:   prev.stayTotal   + currentValue,
      }));
      setRunning(false);
    }, 500);
  };

  const resetAll = () => {
    setStats({ switchWins: 0, switchTotal: 0, stayWins: 0, stayTotal: 0 });
    startNewGame();
  };

  const applyInput = () => {
    const parsed = parseFloat(inputValue);
    const validated = clampCount(parsed, MIN, MAX, STEP);
    setCurrentValue(validated);
    setInputValue(String(validated));
  };

  const changeValue = (delta: number) => {
    const newValue = clampCount(currentValue + delta, MIN, MAX, STEP);
    setCurrentValue(newValue);
    setInputValue(String(newValue));
  };

  const startHold = (delta: number) => {
    changeValue(delta);
    holdRef.current = setInterval(() => {
      setCurrentValue(prev => {
        const newValue = clampCount(prev + delta, MIN, MAX, STEP);
        setInputValue(String(newValue));
        return newValue;
      });
    }, 120);
  };

  const stopHold = () => {
    if (holdRef.current) {
      clearInterval(holdRef.current);
      holdRef.current = null;
    }
  };

  // Состояние каждой двери для отрисовки
  const getDoorState = (door: number) => {
    if (stage === 'done') {
      if (door === prizeDoor)                      return 'winner';
      if (door === finalDoor && door !== prizeDoor) return 'loser';
      return 'open';
    }
    if (door === revealedDoor) return 'revealed';
    if (door === pickedDoor)   return 'picked';
    return 'idle';
  };

  const getDoorEmoji = (door: number) => {
    if (stage === 'done' || door === revealedDoor) {
      return door === prizeDoor ? '🚗' : '🐐';
    }
    if (door === pickedDoor) return '👆';
    return '❓';
  };

  const swRate = stats.switchTotal > 0
    ? (stats.switchWins / stats.switchTotal * 100).toFixed(1) + '%' : '—';
  const stRate = stats.stayTotal > 0
    ? (stats.stayWins / stats.stayTotal * 100).toFixed(1) + '%' : '—';
  const hasStats = stats.switchTotal + stats.stayTotal > 0;

  return (
    <>
      <div className="exp-header">
        <div className="exp-header__lesson-link">📖 Условная вероятность</div>
        <h2 className="exp-header__title">🚪 Парадокс Монти Холла</h2>
        <p className="exp-header__sub">
          Три двери: за одной машина, за двумя — козы. Ты выбрал дверь,
          ведущий открыл козу. Менять выбор или нет? Интуиция здесь врёт.
        </p>
      </div>

      {/* ── ИГРА ── */}
      <div className="monty-game">
        <div className="monty-doors">
          {[0, 1, 2].map(door => {
            const state = getDoorState(door);
            return (
              <button
                key={door}
                className={`monty-door monty-door--${state}`}
                onClick={() => pickDoor(door)}
                disabled={stage !== 'pick'}
              >
                <div className="monty-door__num">Дверь {door + 1}</div>
                <div className="monty-door__icon">{getDoorEmoji(door)}</div>
                <div className="monty-door__sub">
                  {state === 'picked'   && 'Твой выбор'}
                  {state === 'revealed' && 'Коза!'}
                  {state === 'winner'   && '🏆 Приз!'}
                  {state === 'loser'    && door === finalDoor && '❌ Ты выбрал'}
                  {state === 'open'     && door === prizeDoor && '← Приз был здесь'}
                  {state === 'idle'     && '\u00A0'}
                </div>
              </button>
            );
          })}
        </div>

        <div className="monty-controls">
          {stage === 'pick' && (
            <p className="monty-hint">👆 Выбери одну из трёх дверей</p>
          )}

          {stage === 'reveal' && (
            <>
              <p className="monty-hint">
                Ведущий открыл дверь с козой. Что делаем?
              </p>
              <div className="monty-btns">
                <button
                  className="btn-primary monty-switch"
                  onClick={() => decide('switch')}
                >
                  🔄 Сменить дверь
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => decide('stay')}
                >
                  🛑 Остаться
                </button>
              </div>
            </>
          )}

          {stage === 'done' && (
            <>
              <p className="monty-hint" style={{ color: won ? '#4ade80' : '#f87171' }}>
                {won ? '🎉 Выиграл! Машина твоя!' : '😬 Проиграл — там была коза.'}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>
                  {' '}({lastStrategy === 'switch' ? 'сменил дверь' : 'остался'})
                </span>
              </p>
              <button className="btn-primary" onClick={startNewGame}>
                Ещё раз
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── СТАТИСТИКА ── */}
      {hasStats && (
        <>
          <div className="stats-grid">
            <div className="stat-chip" style={{ borderColor: 'rgba(56,189,248,0.35)' }}>
              <span className="stat-chip__label">Смена — побед</span>
              <span className="stat-chip__value ok">{swRate}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Смена — игр</span>
              <span className="stat-chip__value">{stats.switchTotal}</span>
            </div>
            <div className="stat-chip" style={{ borderColor: 'rgba(248,113,113,0.35)' }}>
              <span className="stat-chip__label">Остаться — побед</span>
              <span className="stat-chip__value bad">{stRate}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Остаться — игр</span>
              <span className="stat-chip__value">{stats.stayTotal}</span>
            </div>
          </div>

          {/* Визуальный бар сравнения */}
          {stats.switchTotal > 0 && stats.stayTotal > 0 && (
            <div className="monty-bar-wrap">
              <div className="monty-bar-label">
                <span style={{ color: '#38bdf8' }}>🔄 Смена {swRate}</span>
                <span style={{ color: '#f87171' }}>🛑 Остаться {stRate}</span>
              </div>
              <div className="monty-bar">
                <div
                  className="monty-bar__fill"
                  style={{ width: `${stats.switchWins / stats.switchTotal * 100}%` }}
                />
              </div>
              <div className="monty-bar">
                <div
                  className="monty-bar__fill monty-bar__fill--stay"
                  style={{ width: `${stats.stayWins / stats.stayTotal * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="callout">
            <strong>Почему сменить выгоднее?</strong> При выборе ты угадываешь с P = 1/3.
            Ведущий открывает козу — не случайно, а намеренно. Оставшаяся дверь «забирает»
            вероятность двух дверей: P(приз там) = <strong>2/3 ≈ 66.7%</strong>.
            Оставаться — значит держаться за свои исходные 1/3.
          </div>
        </>
      )}

      {/* ── СИМУЛЯЦИЯ ── */}
      <div className="controls" style={{ marginTop: 8 }}>
        <div className="control-row">
          <span className="control-label">Симуляций</span>
          <div className="num-stepper">
            <button
              className="num-stepper__arrow"
              onMouseDown={() => startHold(-STEP)}
              onMouseUp={stopHold}
              onMouseLeave={stopHold}
              onTouchStart={() => startHold(-STEP)}
              onTouchEnd={stopHold}
              disabled={currentValue <= MIN}
              aria-label="Уменьшить"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <input
              className="num-stepper__input"
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onBlur={applyInput}
              onKeyDown={e => {
                if (e.key === 'Enter') applyInput();
                if (e.key === 'ArrowUp') { e.preventDefault(); changeValue(STEP); }
                if (e.key === 'ArrowDown') { e.preventDefault(); changeValue(-STEP); }
              }}
            />
            <button
              className="num-stepper__arrow"
              onMouseDown={() => startHold(STEP)}
              onMouseUp={stopHold}
              onMouseLeave={stopHold}
              onTouchStart={() => startHold(STEP)}
              onTouchEnd={stopHold}
              disabled={currentValue >= MAX}
              aria-label="Увеличить"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="control-btns">
          <button
            className="btn-primary"
            onClick={runSim}
            disabled={running}
            style={{ background: 'var(--accent4)' }}
          >
            {running
              ? <><span className="spinner" />Играем…</>
              : `🤖 Симулировать ${simCount} игр`}
          </button>
          <button className="btn-ghost" onClick={resetAll}>
            Сброс статистики
          </button>
        </div>
      </div>
    </>
  );
}