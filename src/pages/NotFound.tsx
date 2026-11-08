import { ButtonLink } from '../components/ui/Button'

export function NotFound() {
  return (
    <div className="wrap py-20">
      <p className="t-meta">Erreur 404</p>
      <h1 className="mt-2 t-display">Cette page n'existe pas.</h1>
      <p className="mt-4 t-lede text-ink-2">Le lien est peut-être ancien, ou l'adresse a été mal recopiée.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink to="/">Revenir à l'accueil</ButtonLink>
        <ButtonLink to="/actus" variant="outline">
          Voir l'actualité
        </ButtonLink>
      </div>
    </div>
  )
}
