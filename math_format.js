(function () {
  const LEAF_TARGET_SELECTORS = [
    "#formula",
    "#equationDisplay",
    "#resultSummary",
    "#resultDetail",
    "#resultText",
    "#labelR",
    "#characteristicEquation",
    "#eigenvalueSummary",
    "#eigenSummary",
    "#diagonalizationSummary",
    "#standardSummary",
    "#rotationSummary",
    "#inverseSummary",
    ".history-item span",
    ".history-item strong",
    ".status-strip span",
    ".topic-inline-copy",
    ".animation-card span",
    ".matrix-panel h2",
    ".result-note",
    ".math-matrix-label",
    ".equation-line",
    ".topic-summary-box",
    ".formula",
  ].join(", ");

  const INLINE_TARGET_SELECTORS = [
    ".math-text",
  ].join(", ");

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function normalizeVectorTuple(body) {
    return body.trim().replace(/\s+/g, ", ");
  }

  function formatMathText(text) {
    let html = escapeHtml(text);
    html = html.replace(/sqrt\(([^()]+)\)/g, "√($1)");
    html = html.replace(/\[([A-Za-z0-9λθφψχuvwxyzaei,\s+-]+)\](<sup>T<\/sup>)?/g, (_, body, transpose = "") => `(${normalizeVectorTuple(body)})${transpose}`);
    html = html.replace(/(\|[A-Za-zα-ωΑ-Ωλθ]+\|)\^(-?\d+|T)/g, "$1<sup>$2</sup>");
    html = html.replace(/([A-Za-zα-ωΑ-Ωλθφψχ0-9)\]])\^(-?\d+|T)/g, "$1<sup>$2</sup>");
    html = html.replace(/\b([A-Za-zα-ωΑ-Ωλθ])(\d+)\b/g, "$1<sub>$2</sub>");
    html = html.replace(/R\^-1/g, "R<sup>-1</sup>");
    html = html.replace(/q\^-1/g, "q<sup>-1</sup>");
    html = html.replace(/A\^-1/g, "A<sup>-1</sup>");
    html = html.replace(/B\^-1/g, "B<sup>-1</sup>");
    return html;
  }

  function formatElement(element) {
    const source = element.textContent;
    if (!source || !source.trim()) return;
    const html = formatMathText(source);
    if (html === escapeHtml(source)) return;
    element.innerHTML = html;
  }

  function applyMathFormatting() {
    document.querySelectorAll(LEAF_TARGET_SELECTORS).forEach((element) => {
      if (element.closest("[data-math-skip='true']")) return;
      if (element.childElementCount > 0) return;
      formatElement(element);
    });
    document.querySelectorAll(INLINE_TARGET_SELECTORS).forEach((element) => {
      if (element.closest("[data-math-skip='true']")) return;
      formatElement(element);
    });
  }

  let scheduled = false;
  function scheduleFormatting() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      applyMathFormatting();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyMathFormatting();
    const observer = new MutationObserver(() => scheduleFormatting());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  });
}());
