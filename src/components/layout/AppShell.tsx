import { BookOpen, Compass, Gamepad2, Home, Menu, Moon, Newspaper, Sun, Timer, UserRound, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { CATEGORIES } from '../../content/categories'
import { dayKey } from '../../lib/random'
import { earnedBadgeIds } from '../../lib/badges'
import { actions, getState, useAppState } from '../../lib/store'
import { DeclicRing, Logo } from '../ui/DeclicRing'

const NAV = [
  { to: '/actus', label: 'Actualités', icon: Newspaper },
  { to: '/decouvrir', label: 'Découvrir', icon: Compass },
  { to: '/jouer', label: 'Jouer', icon: Gamepad2 },
  { to: '/apprendre', label: 'Apprendre', icon: BookOpen },
]

function useTodayProgress() {
  const declic = useAppState((s) => s.declic)
  const day = declic[dayKey()]
  return day?.completed ? 5 : (day?.step ?? 0)
}

function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useAppState((s) => s.prefs.theme)
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  return (
    <button
      type="button"
      onClick={() => actions.setPrefs({ theme: isDark ? 'light' : 'dark' })}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-2 hover:bg-ink/6 hover:text-ink ${className}`}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      {isDark ? <Sun size={19} aria-hidden /> : <Moon size={19} aria-hidden />}
    </button>
  )
}

function Header() {
  const progress = useTodayProgress()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  useEffect(() => setOpen(false), [location.pathname])
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/92 backdrop-blur-md supports-[backdrop-filter]:bg-paper/80">
      <div className="wrap flex h-15 items-center gap-3 lg:h-16">
        <Link to="/" className="rounded-md text-ink" aria-label="Déclic, accueil">
          <Logo />
        </Link>
        <nav aria-label="Navigation principale" className="ml-6 hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 text-[0.9375rem] font-medium transition-colors ${isActive ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-ink/6 hover:text-ink'}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <Link to="/2-minutes" className="hidden h-10 items-center gap-1.5 rounded-full border border-line-ui px-3.5 text-[0.875rem] font-semibold hover:border-ink sm:inline-flex">
            <Timer size={16} aria-hidden /> Je n'ai que 2 minutes
          </Link>
          <Link to="/declic" className="hidden h-10 items-center gap-2 rounded-full bg-ink pr-4 pl-2.5 text-[0.875rem] font-semibold text-paper hover:bg-ink/85 lg:inline-flex">
            <DeclicRing size={22} progress={progress} tone="vermilion" track="paper" /> Déclic du jour
          </Link>
          <ThemeToggle />
          <NavLink to="/moi" className={({ isActive }) => `inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-ink/6 ${isActive ? 'bg-ink/8 text-ink' : 'text-ink-2'}`} aria-label="Mon espace">
            <UserRound size={19} aria-hidden />
          </NavLink>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-2 hover:bg-ink/6 lg:hidden"
            aria-label="Toutes les rubriques"
            aria-expanded={open}
            aria-controls="menu-sheet"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>
      {open && <MenuSheet onClose={() => setOpen(false)} />}
    </header>
  )
}

function MenuSheet({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('a')?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const links = [
    { to: '/', label: 'Accueil' },
    { to: '/declic', label: 'Déclic du jour' },
    { to: '/2-minutes', label: "Je n'ai que 2 minutes" },
    ...NAV.map((n) => ({ to: n.to, label: n.label })),
    { to: '/apprendre/frise', label: 'La frise du temps' },
    { to: '/moi', label: 'Mon espace' },
  ]
  return (
    <div id="menu-sheet" ref={ref} className="border-t border-rule bg-paper lg:hidden">
      <nav aria-label="Menu" className="wrap grid grid-cols-2 gap-x-6 py-4">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="border-b border-rule py-3 t-h3 hover:text-vermilion-ink">
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}

function BottomNav() {
  const progress = useTodayProgress()
  const items = [
    { to: '/', label: 'Accueil', icon: Home, end: true },
    { to: '/actus', label: 'Actus', icon: Newspaper },
    { to: '/declic', label: 'Déclic', icon: null },
    { to: '/jouer', label: 'Jouer', icon: Gamepad2 },
    { to: '/apprendre', label: 'Apprendre', icon: BookOpen },
  ]
  return (
    <nav aria-label="Navigation rapide" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper/95 backdrop-blur-md lg:hidden">
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {items.map((it) => (
          <li key={it.to} className="flex">
            <NavLink
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-semibold tracking-tight ${isActive ? 'text-ink' : 'text-ink-3'}`
              }
            >
              {({ isActive }) => (
                <>
                  {it.icon ? (
                    <span className={`flex h-7 w-12 items-center justify-center rounded-full ${isActive ? 'bg-ink/8' : ''}`}>
                      <it.icon size={20} strokeWidth={isActive ? 2.4 : 1.9} aria-hidden />
                    </span>
                  ) : (
                    <span className="-mt-5 flex h-13 w-13 items-center justify-center rounded-full bg-ink shadow-lift">
                      <DeclicRing size={30} progress={progress} tone="vermilion" track="paper" />
                    </span>
                  )}
                  {it.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-ink bg-paper pb-28 lg:pb-12">
      <div className="wrap grid gap-8 pt-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm font-serif text-[1.0625rem] text-ink-2 italic">Aujourd'hui, le monde a encore des choses à t'apprendre.</p>
          <p className="mt-2 max-w-sm text-[0.9375rem] text-ink-2">
            Cinq minutes par jour pour comprendre le monde, apprendre quelque chose et se faire plaisir. Gratuit, sans compte, sans publicité.
          </p>
        </div>
        <nav aria-label="Rubriques">
          <p className="t-label">Rubriques</p>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[0.9375rem]">
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <Link className="link-ed" to={`/actus/${c.id}`}>
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="t-label">Comment ça marche</p>
          <ul className="mt-2 space-y-1.5 text-[0.9375rem] text-ink-2">
            <li>Titres et chapôs repris tels quels des flux RSS publics des médias, avec lien vers l'article original.</li>
            <li>Aucun résumé n'est inventé ou généré automatiquement.</li>
          </ul>
        </div>
        <div>
          <p className="t-label">Coulisses</p>
          <ul className="mt-2 space-y-1.5 text-[0.9375rem]">
            <li><Link className="link-ed" to="/diagnostic">État des sources</Link></li>
            <li><Link className="link-ed" to="/moi">Mes données (stockées sur cet appareil)</Link></li>
            <li><Link className="link-ed" to="/apprendre/frise">La frise du temps</Link></li>
            <li><a className="link-ed" href="./data/une.xml" type="application/rss+xml">Flux RSS « À la une »</a></li>
            <li><Link className="link-ed" to="/moi#widget">Les titres en widget sur ton téléphone</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  )
}

/** Attribue les badges dès que l'état local le permet (idempotent). */
function BadgeWatcher() {
  const declic = useAppState((s) => s.declic)
  const scores = useAppState((s) => s.scores)
  const discovered = useAppState((s) => s.discovered)
  const learned = useAppState((s) => s.learned)
  const found = useAppState((s) => s.countriesFound)
  const history = useAppState((s) => s.history)
  useEffect(() => {
    actions.grantBadges(earnedBadgeIds(getState()))
  }, [declic, scores, discovered, learned, found, history])
  return null
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  const immersive = pathname.startsWith('/declic')
  return (
    <div className="min-h-dvh">
      <a href="#contenu" className="sr-only z-50 rounded-full bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Aller au contenu
      </a>
      {!immersive && <Header />}
      <main id="contenu" tabIndex={-1} className="outline-none">
        {children}
      </main>
      {!immersive && <Footer />}
      {!immersive && <BottomNav />}
      <BadgeWatcher />
    </div>
  )
}
