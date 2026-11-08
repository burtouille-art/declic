// Applique le thème avant le premier rendu (évite un flash). Clair par défaut ;
// « Automatique » (suivre le téléphone) seulement si le visiteur l'a choisi.
try {
  var p = JSON.parse(localStorage.getItem('declic:v1') || '{}').prefs || {};
  var t = p.theme === 'dark' ? 'dark' : p.theme === 'system' && p.themeChosen ? null : 'light';
  if (t) document.documentElement.dataset.theme = t;
} catch (e) {
  document.documentElement.dataset.theme = 'light';
}
