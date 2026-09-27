function sourceKey(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function validDocument(document) {
  return document?.schema_version === 1
    && /^\d{4}-\d{2}-\d{2}$/.test(document.report_date || "")
    && ["opportunity", "project-opportunity"].includes(document.report_section)
    && Array.isArray(document.opportunities);
}

/** Share only DOI *candidates* from an identical news URL; never share verification. */
export function reconcileRelatedSources(document, related) {
  if (!validDocument(document)) throw new Error("Unsupported opportunity document");
  if (!related) return document;
  if (!validDocument(related) || related.report_date !== document.report_date || related.report_section === document.report_section) {
    throw new Error("Related document must be the other section for the same date");
  }
  return {
    ...document,
    opportunities: document.opportunities.map((record) => {
      const sources = new Set((record.source_urls || []).map(sourceKey).filter(Boolean));
      const matches = related.opportunities.filter((other) =>
        other.opportunity_id !== record.opportunity_id
        && (other.source_urls || []).some((url) => sources.has(sourceKey(url))));
      const shared = matches.flatMap((other) => (other.primary_source_candidates || [])
        .filter((candidate) => sources.has(sourceKey(candidate.discovered_from))
          && /^10\.\d{4,9}\/[a-z0-9._;()/:+-]+$/i.test(candidate.doi || "")
          && candidate.url === `https://doi.org/${candidate.doi}`)
        .map((candidate) => ({ ...candidate, relationship_verified: false, shared_candidate_from: other.opportunity_id })));
      const candidates = [...new Map([...shared, ...(record.primary_source_candidates || [])]
        .map((candidate) => [candidate.doi?.toLowerCase(), candidate])).values()];
      return {
        ...record,
        primary_source_candidates: candidates,
        related_opportunity_ids: matches.map((other) => other.opportunity_id).sort(),
      };
    }),
  };
}
