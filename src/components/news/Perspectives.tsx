import { ArrowUpRight, Lightbulb } from "lucide-react";
import type { Article, Cluster } from "../../lib/news";
import { actions } from "../../lib/store";
import { articleSaved } from "./Story";

/** Pays d'édition du média : une information factuelle, jamais une étiquette politique. */
export function CountryTag({
  country,
  className = "",
}: {
  country?: string | null;
  className?: string;
}) {
  if (!country || country === "France") return null;
  return (
    <span
      className={`rounded-sm bg-paper-3 px-1.5 py-px text-[0.6875rem] font-semibold text-ink-2 ${className}`}
    >
      {country}
    </span>
  );
}

type Item = {
  sourceName: string;
  sourceCountry?: string | null;
  title: string;
  url: string;
  lang: string;
  article?: Article;
};

function open(a?: Article) {
  if (a) actions.addHistory(articleSaved(a));
}

/**
 * Les titres de plusieurs médias sur un même événement, côte à côte, puis les analyses liées.
 * Aucune étiquette de « bord » : le lecteur compare lui-même les angles.
 */
export function PerspectiveList({
  items,
  analyses = [],
  compact = false,
}: {
  items: Item[];
  analyses?: Article[];
  compact?: boolean;
}) {
  return (
    <div>
      {items.length > 0 && (
        <ul className="divide-y divide-rule border-y border-rule">
          {items.map((it) => (
            <li key={it.url} className={compact ? "py-2.5" : "py-3"}>
              <p className="flex flex-wrap items-center gap-1.5">
                <span className="font-sans text-[0.8125rem] leading-tight font-semibold text-ink">
                  {it.sourceName}
                </span>
                <CountryTag country={it.sourceCountry} />
                {it.lang === "en" && (
                  <span className="rounded-[3px] border border-line-ui px-1 text-[0.6875rem] font-semibold text-ink-2">
                    EN
                  </span>
                )}
              </p>
              <a
                href={it.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => open(it.article)}
                className="mt-0.5 block t-h4 text-pretty hover:underline"
              >
                {it.title}
                <span className="sr-only">
                  {" "}
                  — lire sur {it.sourceName} (nouvel onglet)
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {analyses.length > 0 && (
        <div className="mt-3 border-l-2 border-petrol bg-petrol/8 py-3 pr-3 pl-4">
          <p className="flex items-center gap-1.5 t-label text-petrol-ink">
            <Lightbulb size={15} aria-hidden /> Pour prendre du recul
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {analyses.map((a) => (
              <li key={a.id}>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => open(a)}
                  className="group inline-flex items-start gap-1 text-[0.9375rem] leading-snug"
                >
                  <span className="group-hover:underline">{a.title}</span>
                  <span className="shrink-0 t-meta">
                    ({a.sourceName}
                    {a.kind === "opinion" ? ", tribune" : ""})
                  </span>
                  <ArrowUpRight
                    size={14}
                    className="mt-0.5 shrink-0"
                    aria-hidden
                  />
                  <span className="sr-only">(nouvel onglet)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function clusterItems(
  cluster: Cluster,
  byId: Map<string, Article>,
  exclude?: string,
): Item[] {
  return cluster.articleIds
    .map((id) => byId.get(id))
    .filter((a): a is Article => !!a && a.id !== exclude)
    .map((a) => ({
      sourceName: a.sourceName,
      sourceCountry: a.sourceCountry,
      title: a.title,
      url: a.url,
      lang: a.lang,
      article: a,
    }));
}

export function clusterAnalyses(
  cluster: Cluster,
  byId: Map<string, Article>,
): Article[] {
  return cluster.analysisIds
    .map((id) => byId.get(id))
    .filter((a): a is Article => !!a);
}

/** Résumé factuel de la diversité d'un sujet : nombre de médias, pays, langues. */
export function diversityLine(cluster: Cluster): string {
  const parts = [`${cluster.sourceCount} médias`];
  const foreign = cluster.countries.filter((c) => c !== "France");
  if (foreign.length) parts.push(`dont ${foreign.join(", ")}`);
  if (cluster.langs.includes("en") && cluster.langs.includes("fr"))
    parts.push("en français et en anglais");
  return parts.join(" · ");
}
