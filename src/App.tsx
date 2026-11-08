import { lazy, Suspense, type ReactNode } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Skeleton } from './components/ui/bits'
import { HomePage } from './pages/HomePage'
import { NewsPage } from './pages/NewsPage'
import { NotFound } from './pages/NotFound'

// Les écrans lourds (jeux, carte, frise, diagnostic) sont chargés à la demande.
const DeclicPage = lazy(() => import('./pages/DeclicPage'))
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'))
const PlayPage = lazy(() => import('./pages/PlayPage'))
const QuizGame = lazy(() => import('./games/QuizGame'))
const TrueFalseGame = lazy(() => import('./games/TrueFalseGame'))
const ChronologyGame = lazy(() => import('./games/ChronologyGame'))
const SixtyGame = lazy(() => import('./games/SixtyGame'))
const VoyageGame = lazy(() => import('./games/VoyageGame'))
const LearnPage = lazy(() => import('./pages/LearnPage'))
const FichePage = lazy(() => import('./pages/FichePage'))
const TimelinePage = lazy(() => import('./pages/TimelinePage'))
const MePage = lazy(() => import('./pages/MePage'))
const QuickPage = lazy(() => import('./pages/QuickPage'))
const DiagnosticPage = lazy(() => import('./pages/DiagnosticPage'))

function Loading() {
  return (
    <div className="wrap py-10" role="status" aria-live="polite">
      <span className="sr-only">Chargement…</span>
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="mt-4 h-5 w-1/2" />
      <Skeleton className="mt-8 h-56 w-full" />
    </div>
  )
}

const L = ({ children }: { children: ReactNode }) => <Suspense fallback={<Loading />}>{children}</Suspense>

export function App() {
  return (
    <HashRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/actus" element={<NewsPage />} />
            <Route path="/actus/:rubrique" element={<NewsPage />} />
            <Route path="/declic" element={<L><DeclicPage /></L>} />
            <Route path="/decouvrir" element={<L><DiscoverPage /></L>} />
            <Route path="/decouvrir/:id" element={<L><DiscoverPage /></L>} />
            <Route path="/jouer" element={<L><PlayPage /></L>} />
            <Route path="/jouer/quiz" element={<L><QuizGame /></L>} />
            <Route path="/jouer/vrai-faux" element={<L><TrueFalseGame /></L>} />
            <Route path="/jouer/chronologie" element={<L><ChronologyGame /></L>} />
            <Route path="/jouer/60-secondes" element={<L><SixtyGame /></L>} />
            <Route path="/jouer/voyage" element={<L><VoyageGame /></L>} />
            <Route path="/apprendre" element={<L><LearnPage /></L>} />
            <Route path="/apprendre/frise" element={<L><TimelinePage /></L>} />
            <Route path="/apprendre/:id" element={<L><FichePage /></L>} />
            <Route path="/moi" element={<L><MePage /></L>} />
            <Route path="/2-minutes" element={<L><QuickPage /></L>} />
            <Route path="/diagnostic" element={<L><DiagnosticPage /></L>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppShell>
    </HashRouter>
  )
}
