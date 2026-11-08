/** Test de la tache aveugle (œil droit) : croix à gauche, point à droite. */
export function BlindSpot() {
  return (
    <div className="rounded-[22px] bg-paper p-4 ring-1 ring-rule sm:p-6">
      <div className="flex items-center justify-between px-[6%] py-10 select-none" aria-hidden>
        <span className="font-sans text-[2.2rem] leading-none font-bold">+</span>
        <span className="h-6 w-6 rounded-full bg-vermilion" />
      </div>
      <ol className="list-decimal space-y-1 pl-5 text-[0.9375rem] text-ink-2">
        <li>Ferme l'œil gauche (ou couvre-le).</li>
        <li>Avec l'œil droit, fixe la croix, sans quitter la croix du regard.</li>
        <li>Rapproche lentement ton visage de l'écran, à 25 à 50 cm environ : à une certaine distance, le point rouge disparaît.</li>
      </ol>
      <p className="mt-3 text-[0.875rem] text-ink-2">Le point tombe alors sur ta tache aveugle. Ton cerveau « remplit » la zone avec la couleur du fond.</p>
    </div>
  )
}
