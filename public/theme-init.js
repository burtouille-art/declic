// Applique le thème choisi avant le premier rendu (évite un flash clair/sombre).
try {
  var t = (JSON.parse(localStorage.getItem('declic:v1') || '{}').prefs || {}).theme;
  if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t;
} catch (e) {}
