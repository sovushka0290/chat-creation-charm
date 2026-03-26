import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Package, 
  ExternalLink, 
  AlertCircle, 
  Loader2, 
  Settings, 
  CheckCircle2,
  ChevronRight,
  ListChecks,
  Map as MapIcon,
  Newspaper,
  QrCode,
  Camera,
  X,
  Bell,
  Trophy,
  Activity,
  Zap,
  Check
} from 'lucide-react';

// --- Types ---
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

interface DBData {
  role: 'GUEST' | 'VOLUNTEER' | 'COORDINATOR' | 'ADMIN';
  sbt_balance: number;
  missions_completed: number;
  registration_date: string;
  lang: 'ru' | 'kk';
  last_tx_hash?: string;
}

interface UserProfile extends DBData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface Mission {
  id: string;
  type: 'GUM' | 'CUSTOM';
  title: string;
  description: string;
  reward: number;
  location: {
    lat: number;
    lng: number;
    address: string;
    district?: string;
  };
  cargo?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'VERIFIED';
  color?: string;
}

type ThemeType = 'light' | 'dark' | 'deep-blue' | 'sky-blue' | 'pink-rose' | 'electric-violet';

// --- Localization ---
const translations = {
  ru: {
    welcome: "Добро пожаловать",
    role: "Роль",
    sbt_balance: "Баланс SBT",
    missions: "Миссий выполнено",
    reg_date: "Дата регистрации",
    not_registered: "Пожалуйста, зарегистрируйтесь в боте сначала",
    loading: "Синхронизация профиля...",
    coordinator_tools: "Панель координатора",
    volunteer_tools: "Задания волонтера",
    last_tx: "Solana TX Hash",
    active_missions: "Активные миссии",
    history: "История",
    settings: "Настройки",
    guest: "Гость",
    volunteer: "Волонтер",
    coordinator: "Координатор",
    admin: "Администратор",
    copy_hash: "Хэш скопирован",
    tasks: "Задания",
    map: "Карта",
    news: "Новости",
    sync_error: "Ошибка синхронизации",
    retry: "Попробовать снова",
    scan_qr: "Сканировать QR",
    team_mgmt: "Управление командой",
    rank: "Ранг",
    trust_score: "Индекс доверия",
    theme: "Тема оформления",
    language: "Язык интерфейса",
    take_mission: "Взять в работу",
    details: "Подробнее",
    taking: "Загрузка...",
    mission_taken_error: "Упс, этот добрый поступок уже совершают!",
    active_mission_title: "Активная миссия",
    submit_report: "Отправить отчет",
    instructions: "Инструкции",
    reward_label: "Награда",
    address_label: "Адрес",
    district_label: "Район",
    cargo_label: "Груз",
    agreement_title: "Соглашение волонтера",
    agreement_text: "Я подтверждаю, что готов выполнить данную миссию ответственно и в срок. Я обязуюсь соблюдать правила безопасности и этический кодекс волонтера QAIYRYM.",
    agree_button: "Я согласен",
    cancel_button: "Отмена",
    navigate: "Маршрут",
    sbt_reward: "+{reward} SBT"
  },
  kk: {
    welcome: "Қош келдіңіз",
    role: "Рөлі",
    sbt_balance: "SBT теңгерімі",
    missions: "Орындалған миссиялар",
    reg_date: "Тіркелген күні",
    not_registered: "Алдымен ботта тіркеліңіз",
    loading: "Профильді синхрондау...",
    coordinator_tools: "Үйлестіруші панелі",
    volunteer_tools: "Волонтер тапсырмалары",
    last_tx: "Solana TX Hash",
    active_missions: "Белсенді миссиялар",
    history: "Тарих",
    settings: "Баптаулар",
    guest: "Қонақ",
    volunteer: "Волонтер",
    coordinator: "Үйлестіруші",
    admin: "Әкімші",
    copy_hash: "Хэш көшірілді",
    tasks: "Тапсырмалар",
    map: "Карта",
    news: "Жаңалықтар",
    sync_error: "Синхрондау қатесі",
    retry: "Қайтадан көру",
    scan_qr: "QR сканерлеу",
    team_mgmt: "Команданы басқару",
    rank: "Ранг",
    trust_score: "Сенім индексі",
    theme: "Дизайн тақырыбы",
    language: "Интерфейс тілі",
    take_mission: "Жұмысқа алу",
    details: "Толығырақ",
    taking: "Жүктелуде...",
    mission_taken_error: "Әттең, бұл игі істі біреу бастап кетті!",
    active_mission_title: "Белсенді миссия",
    submit_report: "Есеп беру",
    instructions: "Нұсқаулықтар",
    reward_label: "Сыйақы",
    address_label: "Мекенжайы",
    district_label: "Аудан",
    cargo_label: "Жүк",
    agreement_title: "Волонтер келісімі",
    agreement_text: "Мен бұл миссияны жауапкершілікпен және мерзімінде орындауға дайын екенімді растаймын. Мен QAIYRYM волонтерінің қауіпсіздік ережелері мен этикалық кодексін сақтауға міндеттенемін.",
    agree_button: "Келісемін",
    cancel_button: "Бас тарту",
    navigate: "Бағыт",
    sbt_reward: "+{reward} SBT"
  }
};

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        expand: () => void;
        ready: () => void;
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
        };
        initDataUnsafe: {
          user?: TelegramUser;
        };
      };
    };
  }
}

// --- Components ---

const Avatar = ({ user, onClick }: { user: Partial<UserProfile>, onClick?: () => void }) => {
  const initials = `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase();
  
  const handleClick = () => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    onClick?.();
  };

  return (
    <div className="relative group cursor-pointer active:scale-95 transition-transform" onClick={handleClick}>
      <div className="relative p-1 rounded-full bg-primary/10 shadow-sm">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 bg-primary/5 flex items-center justify-center">
          {user.photo_url ? (
            <img 
              src={user.photo_url} 
              alt={user.first_name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
            />
          ) : (
            <span className="text-primary font-black text-sm">{initials || '??'}</span>
          )}
        </div>
      </div>
      <div className="absolute -bottom-1 -right-1 w-5 h-5 status-ring rounded-full border-2 border-background flex items-center justify-center shadow-sm">
        <Zap size={10} className="text-primary-foreground fill-primary-foreground" />
      </div>
    </div>
  );
};

const ProgressCircle = ({ score }: { score: number }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFB6C1" />
            <stop offset="100%" stopColor="#FAFAD2" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-primary/10" />
        <circle cx="24" cy="24" r={radius} stroke="url(#progressGradient)" strokeWidth="3" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      </svg>
      <span className="absolute text-[10px] font-black text-[var(--theme-text)]">{score}%</span>
    </div>
  );
};

const BentoCard = ({ icon, label, value, subValue, progress }: { 
  icon: React.ReactNode, label: string, value: string | number, subValue?: string, progress?: number 
}) => (
  <div className="glass-card p-4 flex flex-col justify-between h-32 relative overflow-hidden group">
    <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="flex justify-between items-start relative z-10">
      <div className="p-2 bg-primary/10 rounded-xl text-primary">{icon}</div>
      {progress !== undefined && <ProgressCircle score={progress} />}
    </div>
    <div className="relative z-10">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-text-muted)] mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <h4 className="text-xl font-black text-[var(--theme-text)]">{value}</h4>
        {subValue && <span className="text-[10px] font-bold text-[var(--theme-text-muted)]">{subValue}</span>}
      </div>
    </div>
  </div>
);

const TaskCard = ({ mission, onTake, isTaking, t }: { 
  mission: Mission, onTake: (id: string) => void | Promise<void>, isTaking: boolean, t: Record<string, string>
}) => (
  <motion.div whileTap={{ scale: 0.98 }} className="glass-card overflow-hidden flex h-44 relative group">
    <div className="w-1.5 h-full bg-primary/20 shrink-0" />
    <div className="p-5 flex flex-col justify-between flex-1">
      <div className="flex justify-between items-start">
        <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
          {mission.type === 'GUM' ? <Package size={20} /> : <Zap size={20} />}
        </div>
        <div className="glass-panel px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-primary/10 text-[var(--theme-text-muted)]">
          {mission.status}
        </div>
      </div>
      <div>
        <h4 className="text-lg font-bold mb-1 text-[var(--theme-text)]">{mission.title}</h4>
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--theme-text-muted)] bg-primary/5 px-2 py-1 rounded-xl">
            <MapIcon size={12} />
            {mission.location.district || "Район не указан"}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-xl">
            <Shield size={12} />
            {t.sbt_reward.replace('{reward}', mission.reward.toString())}
          </div>
        </div>
      </div>
    </div>
    <div className="absolute right-4 bottom-4">
      <button disabled={isTaking} onClick={() => onTake(mission.id)} className="h-10 px-5 rounded-2xl btn-primary flex items-center gap-2">
        {isTaking ? (
          <><Loader2 size={14} className="animate-spin" /><span className="text-[10px] font-bold uppercase tracking-wider">{t.taking}</span></>
        ) : (
          <><span className="text-[10px] font-bold uppercase tracking-wider">{t.details}</span><ChevronRight size={14} /></>
        )}
      </button>
    </div>
  </motion.div>
);

const ActiveMissionView = ({ mission, onReport, onScan, t }: { 
  mission: Mission, onReport: () => void, onScan: () => void, t: Record<string, string>
}) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Activity size={20} className="text-primary" />
      </div>
      <h2 className="text-2xl font-black font-display text-[var(--theme-text)]">{t.active_mission_title}</h2>
    </div>
    <div className="glass-card p-6 space-y-6">
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-bold text-[var(--theme-text)]">{mission.title}</h3>
        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-wider border border-primary/20">{mission.id}</span>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-xl text-primary"><MapIcon size={20} /></div>
          <div>
            <p className="text-[10px] font-bold uppercase text-[var(--theme-text-muted)]">{t.district_label}</p>
            <p className="text-sm font-bold text-[var(--theme-text)]">{mission.location.district || "Батыс-2"}</p>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-xl text-primary"><Package size={20} /></div>
          <div>
            <p className="text-[10px] font-bold uppercase text-[var(--theme-text-muted)]">{t.cargo_label}</p>
            <p className="text-sm font-bold text-[var(--theme-text)]">{mission.cargo || "Продукты (15кг)"}</p>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-xl text-primary"><Shield size={20} /></div>
          <div>
            <p className="text-[10px] font-bold uppercase text-[var(--theme-text-muted)]">{t.reward_label}</p>
            <p className="text-sm font-bold text-[var(--theme-text)]">{t.sbt_reward.replace('{reward}', mission.reward.toString())}</p>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--theme-text-muted)]">{t.instructions}</p>
        <p className="text-[var(--theme-text)] opacity-80 text-sm leading-relaxed">{mission.description}</p>
      </div>
      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
        <p className="text-[10px] font-bold uppercase text-[var(--theme-text-muted)] mb-1">{t.address_label}</p>
        <p className="text-sm font-bold text-[var(--theme-text)]">{mission.location.address}</p>
        <button 
          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${mission.location.lat},${mission.location.lng}`)}
          className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary underline underline-offset-4"
        >
          <ExternalLink size={14} />{t.navigate}
        </button>
      </div>
    </div>
    <div className="grid gap-4">
      <button onClick={onReport} className="w-full h-14 btn-primary rounded-2xl flex items-center justify-center gap-3">
        <Camera size={20} />{t.submit_report}
      </button>
      <button onClick={onScan} className="w-full h-14 glass-panel rounded-2xl font-black uppercase tracking-widest text-[var(--theme-text-muted)] flex items-center justify-center gap-3 active:scale-95 transition-transform">
        <QrCode size={20} />{t.scan_qr}
      </button>
    </div>
  </motion.div>
);

const AgreementModal = ({ mission, onAgree, onCancel, isTaking, t }: { 
  mission: Mission, onAgree: () => void, onCancel: () => void, isTaking: boolean, t: Record<string, string>
}) => (
  <AnimatePresence>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="glass-card w-full max-w-sm p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield size={24} className="text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-black font-display text-[var(--theme-text)]">{t.agreement_title}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-text-muted)]">{mission.id}</p>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-2xl bg-primary/5 border border-primary/10">
          <p className="text-sm leading-relaxed text-[var(--theme-text)] opacity-80 italic">"{t.agreement_text}"</p>
        </div>
        <div className="space-y-3">
          <button disabled={isTaking} onClick={onAgree} className="w-full h-14 btn-primary rounded-2xl flex items-center justify-center gap-3">
            {isTaking ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
            {t.agree_button}
          </button>
          <button disabled={isTaking} onClick={onCancel} className="w-full h-14 glass-panel rounded-2xl font-black uppercase tracking-widest text-[var(--theme-text-muted)] flex items-center justify-center gap-3 active:scale-95 transition-transform">
            {t.cancel_button}
          </button>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const Intro = () => (
  <div className="intro-scene">
    <div className="logo-wrap" aria-label="Animated logo">
      <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="rainbowGradient" x1="160" y1="120" x2="370" y2="360" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFB6C1"/>
            <stop offset="100%" stopColor="#FAFAD2"/>
          </linearGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="15" result="blur"/>
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.3 0" result="glow"/>
            <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx="256" cy="256" r="180" fill="white" opacity="0.1" filter="url(#softGlow)" />
        <g className="outer-group">
          <circle className="outer-ring" cx="256" cy="256" r="150" stroke="#9370DB" strokeWidth="20" strokeLinecap="round" />
          <g transform="rotate(-45, 256, 256)">
            <circle cx="256" cy="80" r="22" stroke="#9370DB" strokeWidth="12" fill="none" />
            <rect x="250" y="95" width="12" height="15" fill="#9370DB" />
          </g>
        </g>
        <g className="rainbow-group">
          <circle className="rainbow-ring" cx="256" cy="256" r="110" stroke="url(#rainbowGradient)" strokeWidth="20" strokeLinecap="round" opacity="0.8" />
        </g>
        <g className="star-group">
          <path d="M256 160 C275 210, 302 237, 352 256 C302 275, 275 302, 256 352 C237 302, 210 275, 160 256 C210 237, 237 210, 256 160Z" fill="#9370DB" />
        </g>
      </svg>
    </div>
  </div>
);

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center flex-1 py-3 px-1 transition-all relative ${active ? 'text-primary' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}`}>
      <div className={`transition-all duration-300 ${active ? 'scale-110' : ''}`}>{icon}</div>
      <span className={`text-[8px] font-black uppercase tracking-widest mt-1.5 transition-all duration-300 ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
      {active && <motion.div layoutId="nav-glow" className="absolute -bottom-2 w-12 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(147,112,219,0.3)]" />}
    </button>
  );
}

function NewsCard({ title, date, content }: { title: string, date: string, content: string }) {
  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center justify-between mb-3 relative z-10">
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)]">{date}</span>
        <Newspaper size={14} className="text-primary/40" />
      </div>
      <h4 className="text-lg font-bold mb-2 relative z-10 text-[var(--theme-text)]">{title}</h4>
      <p className="text-[var(--theme-text-muted)] text-sm leading-relaxed relative z-10">{content}</p>
    </div>
  );
}

function ThemeOption({ current, color, onClick }: { current: boolean, color: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-12 h-12 rounded-2xl shrink-0 border-2 transition-all flex items-center justify-center shadow-sm ${current ? 'border-primary scale-110' : 'border-black/5 opacity-60'}`} style={{ backgroundColor: color }}>
      {current && <Check size={20} className={color === '#F1F5F9' ? 'text-primary' : 'text-primary-foreground'} />}
    </button>
  );
}

// --- Main App ---
export default function QaiyrymApp() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'map' | 'news' | 'settings'>('tasks');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeType>('sky-blue');
  
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [takingMissionId, setTakingMissionId] = useState<string | null>(null);
  const [selectedMissionForAgreement, setSelectedMissionForAgreement] = useState<Mission | null>(null);
  const [alert, setAlert] = useState<string | null>(null);

  const tg = window.Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user;

  const t = useMemo(() => {
    const lang = profile?.lang || user?.language_code || 'ru';
    return translations[lang as keyof typeof translations] || translations.ru;
  }, [profile?.lang, user?.language_code]);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (tg) { tg.expand(); tg.ready(); }

    async function syncUserData() {
      // Demo mode — no backend connected
      setTimeout(() => {
        const demoUser = user || { id: 12345, first_name: "Test", last_name: "User" };
        setProfile({
          ...demoUser,
          id: demoUser.id,
          first_name: demoUser.first_name,
          last_name: demoUser.last_name,
          username: demoUser.username,
          photo_url: demoUser.photo_url,
          role: 'COORDINATOR',
          sbt_balance: 750,
          missions_completed: 24,
          registration_date: "2023-11-20",
          lang: ((demoUser.language_code as 'ru' | 'kk') || 'ru'),
          last_tx_hash: "7xR...2mP"
        });
        setLoading(false);
      }, 2000);
    }

    syncUserData();
  }, []);

  useEffect(() => {
    if (!loading && profile) {
      const mockMissions: Mission[] = [
        {
          id: "TX-777", type: 'GUM', title: "Гумпомощь #402",
          description: "Доставка продуктовых наборов для 5 семей. Вес около 15кг. Нужно забрать со склада до 14:00.",
          reward: 50, location: { lat: 50.28, lng: 57.16, address: "ул. Абулхаир Хана, 45", district: "Батыс-2" },
          cargo: "Продукты (15кг)", status: 'OPEN', color: 'indigo'
        },
        {
          id: "TX-888", type: 'CUSTOM', title: "Медикаменты",
          description: "Купить и доставить инсулин по адресу. Рецепт прикреплен в боте.",
          reward: 30, location: { lat: 50.29, lng: 57.18, address: "пр. Санкибай Батыра, 12", district: "12 мкр" },
          cargo: "Инсулин (0.5кг)", status: 'OPEN', color: 'rose'
        },
        {
          id: "TX-999", type: 'GUM', title: "Помощь пожилым",
          description: "Помочь с уборкой снега во дворе частного дома.",
          reward: 40, location: { lat: 50.30, lng: 57.20, address: "ул. Маресьева, 8", district: "Старый город" },
          cargo: "Инвентарь (5кг)", status: 'OPEN', color: 'emerald'
        }
      ];
      setMissions(mockMissions);
    }
  }, [loading, profile]);

  useEffect(() => { localStorage.setItem('app-theme', theme); }, [theme]);

  const handleTabChange = (tab: 'tasks' | 'map' | 'news' | 'settings') => {
    tg?.HapticFeedback?.impactOccurred('light');
    setActiveTab(tab);
  };

  const handleTakeMission = async (missionId: string) => {
    tg?.HapticFeedback?.impactOccurred('medium');
    setTakingMissionId(missionId);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mission = missions.find(m => m.id === missionId);
      if (mission) {
        tg?.HapticFeedback?.impactOccurred('medium');
        setActiveMission({ ...mission, status: 'IN_PROGRESS' });
        setMissions(prev => prev.filter(m => m.id !== missionId));
        setSelectedMissionForAgreement(null);
      }
    } catch {
      setAlert(t.mission_taken_error);
    } finally {
      setTakingMissionId(null);
    }
  };

  const handleOpenAgreement = (missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (mission) setSelectedMissionForAgreement(mission);
  };

  const handleLanguageChange = (lang: 'ru' | 'kk') => {
    tg?.HapticFeedback?.impactOccurred('medium');
    if (profile) setProfile({ ...profile, lang });
  };

  if (showIntro) return <Intro />;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Loader2 className="text-primary w-12 h-12" />
        </motion.div>
        <p className="mt-4 text-[var(--theme-text-muted)] text-[10px] font-bold uppercase tracking-widest animate-pulse">{t.loading}</p>
      </div>
    );
  }

  if (error === "SYNC_ERROR") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="text-amber-500 w-12 h-12 mb-4" />
        <h2 className="text-lg font-bold mb-4 text-[var(--theme-text)]">{t.sync_error}</h2>
        <button onClick={() => window.location.reload()} className="px-8 py-4 btn-primary rounded-2xl">{t.retry}</button>
      </div>
    );
  }

  if (error === "NOT_REGISTERED") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="text-destructive w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold mb-2 text-[var(--theme-text)]">{t.not_registered}</h2>
        <p className="text-[var(--theme-text-muted)] text-sm">@qaiyrym_bot</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background text-[var(--theme-text)] font-sans selection:bg-primary/30 theme-${theme} relative`}>
      {/* Global Video Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
          <source src="/videos/main-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />
      </div>
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative z-10">
        {/* Header */}
        <header className="p-6 flex items-center justify-between glass-panel sticky top-0 z-50 rounded-b-[32px] border-b border-primary/10">
          <div className="flex items-center gap-4">
            <Avatar user={profile || {}} onClick={() => setIsProfileOpen(true)} />
            <div>
              <h1 className="font-display font-black text-xl leading-tight text-[var(--theme-text)]">{profile?.first_name}</h1>
              <div className="flex items-center gap-1.5">
                <Shield size={12} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                  {profile?.role ? t[profile.role.toLowerCase() as keyof typeof t] : t.guest}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2.5 glass-panel rounded-xl hover:bg-primary/5 transition-colors"><Bell size={20} className="text-primary" /></button>
            <button className="p-2.5 glass-panel rounded-xl hover:bg-primary/5 transition-colors"><QrCode size={20} className="text-primary" /></button>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 pb-32 flex-1">
          <AnimatePresence mode="wait">
            {activeMission ? (
              <ActiveMissionView 
                key="active-mission"
                mission={activeMission} 
                onReport={() => tg?.HapticFeedback?.impactOccurred('medium')}
                onScan={() => tg?.HapticFeedback?.impactOccurred('medium')}
                t={t}
              />
            ) : (
              <>
                {activeTab === 'tasks' && (
                  <motion.div key="tasks" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-black font-display">{t.tasks}</h2>
                      <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary neon-glow" />
                        <div className="w-2 h-2 rounded-full bg-muted" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      {missions.map(mission => (
                        <TaskCard key={mission.id} mission={mission} onTake={handleOpenAgreement} isTaking={takingMissionId === mission.id} t={t} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'settings' && (
                  <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 relative">
                    <h2 className="text-2xl font-black font-display">{t.settings}</h2>
                    <div className="glass-card p-6 space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-2xl text-primary"><Settings size={20} /></div>
                        <h3 className="text-lg font-bold">{t.language}</h3>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => handleLanguageChange('ru')} className={`flex-1 py-4 rounded-3xl font-bold border transition-all ${profile?.lang === 'ru' ? 'btn-primary border-primary' : 'bg-muted/5 border-border text-[var(--theme-text-muted)]'}`}>Русский</button>
                        <button onClick={() => handleLanguageChange('kk')} className={`flex-1 py-4 rounded-3xl font-bold border transition-all ${profile?.lang === 'kk' ? 'btn-primary border-primary' : 'bg-muted/5 border-border text-[var(--theme-text-muted)]'}`}>Қазақша</button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'map' && (
                  <motion.div key="map" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="space-y-6">
                    <h2 className="text-2xl font-black font-display">{t.map}</h2>
                    <div className="aspect-[3/4] rounded-[40px] glass-card flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-5 pointer-events-none"><MapIcon size={400} className="absolute -top-20 -left-20" /></div>
                      <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6 relative z-10 neon-glow"><MapIcon size={48} className="text-primary" /></div>
                      <h3 className="text-xl font-bold mb-2 relative z-10 text-[var(--theme-text)]">Актобе</h3>
                      <p className="text-[var(--theme-text-muted)] text-sm relative z-10 leading-relaxed">Карта активных миссий и волонтеров в реальном времени</p>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'news' && (
                  <motion.div key="news" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <h2 className="text-2xl font-black font-display">{t.news}</h2>
                    <div className="space-y-4">
                      <NewsCard title="Triple-Check AI" date="Сегодня, 10:30" content="Новая система верификации отчетов с помощью ИИ уже доступна для всех волонтеров." />
                      <NewsCard title="Итоги февраля" date="Вчера, 18:15" content="Вместе мы помогли более 500 семьям в Актюбинской области. Спасибо за ваш труд!" />
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 glass-panel border-t border-primary/5 pb-safe pt-2 z-50 rounded-t-[40px]">
          <div className="max-w-md mx-auto flex items-center justify-around px-4">
            <NavButton active={activeTab === 'tasks'} onClick={() => handleTabChange('tasks')} icon={<ListChecks size={24} />} label={t.tasks} />
            <NavButton active={activeTab === 'map'} onClick={() => handleTabChange('map')} icon={<MapIcon size={24} />} label={t.map} />
            <NavButton active={activeTab === 'news'} onClick={() => handleTabChange('news')} icon={<Newspaper size={24} />} label={t.news} />
            <NavButton active={activeTab === 'settings'} onClick={() => handleTabChange('settings')} icon={<Settings size={24} />} label={t.settings} />
          </div>
        </nav>

        {/* Agreement Modal */}
        {selectedMissionForAgreement && (
          <AgreementModal 
            mission={selectedMissionForAgreement}
            onAgree={() => handleTakeMission(selectedMissionForAgreement.id)}
            onCancel={() => setSelectedMissionForAgreement(null)}
            isTaking={takingMissionId === selectedMissionForAgreement.id}
            t={t}
          />
        )}
      </div>

      {/* Profile Bottom Sheet */}
      <AnimatePresence>
        {isProfileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProfileOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-background rounded-t-[40px] border-t border-border z-[70] p-8 max-h-[95vh] overflow-y-auto scrollbar-hide">
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8" />
              <div className="flex flex-col items-center mb-8">
                <Avatar user={profile || {}} />
                <h2 className="text-3xl font-black font-display mt-4 text-[var(--theme-text)]">{profile?.first_name} {profile?.last_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Shield size={16} className="text-primary neon-glow" />
                  <span className="text-xs font-black uppercase tracking-widest text-primary neon-text">
                    {profile?.role ? t[profile.role.toLowerCase() as keyof typeof t] : t.guest}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <BentoCard icon={<Shield size={20} />} label={t.sbt_balance} value={profile?.sbt_balance || 0} subValue="SBT" />
                <BentoCard icon={<Trophy size={20} />} label={t.rank} value="Master" subValue="LVL 4" />
                <BentoCard icon={<Activity size={20} />} label={t.trust_score} value={98} progress={98} />
                <BentoCard icon={<CheckCircle2 size={20} />} label="Solana Tx" value="Success" subValue={profile?.last_tx_hash || "No hash"} />
              </div>
              <button onClick={() => setIsProfileOpen(false)} className="w-full py-5 glass-panel rounded-3xl font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-colors mt-4">
                Закрыть
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Alert */}
      <AnimatePresence>
        {alert && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="fixed bottom-32 left-6 right-6 z-[100] glass-card p-6 border-amber-500/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500"><AlertCircle size={24} /></div>
              <div className="flex-1"><p className="text-sm font-bold text-[var(--theme-text)] opacity-90">{alert}</p></div>
              <button onClick={() => setAlert(null)} className="p-2 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"><X size={20} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
