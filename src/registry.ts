export interface Experiment {
  id: string;
  emoji: string;
  color: string;
  title: string;
  desc: string;
  lessonSlug: string;
  lessonTitle: string;
  tag: 'Теория вероятностей' | 'Математическая статистика' | 'Мои идеи';
}

export const EXPERIMENTS: Experiment[] = [
  {
    id: 'zanuda',
    emoji: '🏫',
    color: '#f87171',
    title: 'Зануда за партой',
    desc: 'Выбери место в классе 3×5 парт и узнай — с какой вероятностью зануда окажется соседом?',
    lessonSlug: 'formula',
    lessonTitle: 'Комбинаторика и вероятность',
    tag: 'Мои идеи',
  },
  {
    id: 'ege',
    emoji: '📝',
    color: '#818cf8',
    title: 'ЕГЭ на удачу',
    desc: 'Что если угадывать все ответы? Биномиальное распределение покажет реальные шансы сдать тест случайно.',
    lessonSlug: 'formula',
    lessonTitle: 'Формула вероятности',
    tag: 'Теория вероятностей',
  },
  {
    id: 'montyhall',
    emoji: '🚪',
    color: '#c084fc',
    title: 'Парадокс Монти Холла',
    desc: 'Три двери, одна машина. Ведущий открыл козу — менять выбор или нет? Интуиция врёт.',
    lessonSlug: 'formula',
    lessonTitle: 'Условная вероятность',
    tag: 'Теория вероятностей',
  },
  {
    id: 'rumor',
    emoji: '📱',
    color: '#f472b6',
    title: 'Слух в классе',
    desc: 'Один знает секрет. Каждый шаг — «в теме» рассказывают случайному. Смотри на экспоненциальный рост.',
    lessonSlug: 'stats-intro',
    lessonTitle: 'Сложные события',
    tag: 'Мои идеи',
  },
  {
    id: 'coin',
    emoji: '🪙',
    color: '#a78bfa',
    title: 'Монетка',
    desc: 'Орёл или решка? Настрой вероятность, брось тысячу раз и посмотри, как частота стремится к теории.',
    lessonSlug: 'coin',
    lessonTitle: 'Монетка и орёл',
    tag: 'Теория вероятностей',
  },
  {
    id: 'dice',
    emoji: '🎲',
    color: '#38bdf8',
    title: 'Кубик',
    desc: 'Шесть граней, равные шансы. Проверь честность кубика через χ²-тест с реальными данными.',
    lessonSlug: 'dice',
    lessonTitle: 'Кубик и шансы',
    tag: 'Теория вероятностей',
  },
  {
    id: 'normal',
    emoji: '🔔',
    color: '#facc15',
    title: 'Нормальное распределение',
    desc: 'Сложи несколько кубиков — и из хаоса вырастет колокол Гаусса. Центральная предельная теорема.',
    lessonSlug: 'normal-distribution',
    lessonTitle: 'Нормальное распределение',
    tag: 'Математическая статистика',
  },
  {
    id: 'hypothesis',
    emoji: '🧪',
    color: '#4ade80',
    title: 'χ²-тест',
    desc: 'Сделай «нечестный» кубик, задав веса граней, и посмотри — обнаружит ли тест подвох?',
    lessonSlug: 'hypothesis',
    lessonTitle: 'Проверка гипотез',
    tag: 'Математическая статистика',
  },
  {
    id: 'birthday',
    emoji: '🎂',
    color: '#f472b6',
    title: 'Парадокс дней рождения',
    desc: 'В группе из 23 человек шанс совпадения дней рождения — больше 50%. Проверь симуляцией!',
    lessonSlug: 'formula',
    lessonTitle: 'Формула вероятности',
    tag: 'Теория вероятностей',
  },
  {
    id: 'montecarlo',
    emoji: '🎯',
    color: '#fb923c',
    title: 'Монте-Карло: число π',
    desc: 'Вычисли π, бросая случайные точки в квадрат. Геометрическая вероятность в действии.',
    lessonSlug: 'formula',
    lessonTitle: 'Формула вероятности',
    tag: 'Мои идеи',
  },
];