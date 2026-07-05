const automataPages = {
  formal_language: {
    badge: "Σ, word, language",
    title: "形式言語",
    subtitle: "アルファベット、語、空語、連接、閉包、言語と集合演算を具体例で確認します。",
    examples: [
      { id: "binary", label: "Σ = {0, 1}", alphabet: ["0", "1"], word: "0101" },
      { id: "abc", label: "Σ = {a, b, c}", alphabet: ["a", "b", "c"], word: "abca" },
      { id: "acz", label: "Σ = {a, c, z}", alphabet: ["a", "c", "z"], word: "azca" },
      { id: "union", label: "L1 ∪ L2", alphabet: ["0", "1"], word: "1010", operation: "union" },
      { id: "intersection", label: "L1 ∩ L2", alphabet: ["0", "1"], word: "110", operation: "intersection" },
      { id: "complement", label: "L1 の補集合", alphabet: ["0", "1"], word: "1011", operation: "complement" },
      { id: "combo", label: "L1 ∩ 補(L2)", alphabet: ["0", "1"], word: "010", operation: "combo" },
    ],
  },
  dfa_language: {
    badge: "DFA",
    title: "(決定性)有限オートマトンとその受理言語",
    subtitle: "各状態と入力記号から、次の状態がただ1つに決まるオートマトンです。",
    examples: [
      { id: "abstarc", label: "L = {ab^n c | n >= 0}", input: "abbc" },
      { id: "ends01", label: "0と1からなり 01 で終わる語", input: "1001" },
      { id: "even0", label: "0の個数が偶数の語", input: "10100" },
    ],
  },
  regular_expression: {
    badge: "Regular expression",
    title: "正規表現とその生成言語",
    subtitle: "連結、和集合、閉包を使って、語の集合を短く表します。",
    examples: [
      { id: "a_or_b", label: "a|b", input: "a" },
      { id: "abstarccstar", label: "ab*cc*", input: "abbcc" },
      { id: "abc_bc_star", label: "(abc|bc)*", input: "abcbc" },
      { id: "b_blocks_b", label: "b(c*a|a*c)*b", input: "bcaaab" },
    ],
  },
  nfa_language: {
    badge: "NFA",
    title: "非決定性有限オートマトンとその受理言語",
    subtitle: "各状態と入力記号から、複数の次状態へ分岐できます。入力を読まないε遷移も使えます。",
    examples: [
      { id: "a_or_abstarc", label: "L = (a|ab*c)+", input: "abca" },
      { id: "contains_ab_or_ba", label: "部分語 ab または ba を含む", input: "caba" },
    ],
  },
  nfa_to_dfa: {
    badge: "subset construction",
    title: "決定性オートマトンと非決定性オートマトンの等価性と変換",
    subtitle: "NFAの状態集合をDFAの1状態として扱う部分集合構成を表示します。",
    examples: [
      { id: "epsilon_loop", label: "ε遷移を含むNFA", input: "abc" },
      { id: "choice", label: "ab と ac を受理するNFA", input: "ac" },
    ],
  },
  cfg_language: {
    badge: "CFG",
    title: "文脈自由文法とその生成言語",
    subtitle: "生成規則を開始記号に適用して語を作ります。",
    examples: [
      { id: "anbn", label: "S -> aSb | ε", input: "aaabbb" },
      { id: "ancbn", label: "S -> aSb | c", input: "aacbb" },
      { id: "blocks", label: "S -> AB, A -> aA | ε, B -> bB | ε", input: "aaabbb" },
      { id: "anbn_cm", label: "S -> AC, A -> aAb | ε, C -> cC | ε", input: "aabbcc" },
      { id: "palindrome", label: "S -> aSa | bSb | A, A -> c | ε", input: "abcba" },
      { id: "expr", label: "E,T,F の算術式文法", input: "a+a*b" },
    ],
  },
  pda_language: {
    badge: "PDA",
    title: "プッシュダウンオートマトンとその受理言語",
    subtitle: "有限状態にスタックを足すと、対応する個数の照合を扱えます。",
    examples: [
      { id: "ancbn", label: "L = {a^n c b^n | n >= 0}", input: "aaacbbb" },
      { id: "balanced", label: "括弧が正しく対応する語", input: "(()())" },
    ],
  },
  turing_machine: {
    badge: "Turing machine",
    title: "チューリング機械の例",
    subtitle: "テープを読み書きし、ヘッドを左右に動かしながら計算します。",
    examples: [
      { id: "unary_increment", label: "単項数に 1 を足す", input: "111" },
      { id: "erase_ones", label: "1を右へ読みながら消す", input: "1111" },
    ],
  },
};

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function setHtml(id, html) {
  const element = byId(id);
  if (element) element.innerHTML = html;
}

function makePill(text, tone = "") {
  return `<span class="automata-pill ${tone}">${escapeHtml(text)}</span>`;
}

function makeTable(headers, rows) {
  return `<table class="automata-table"><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

function formatStateLabel(state) {
  if (state instanceof Set) return `{${[...state].sort().join(", ") || "∅"}}`;
  return String(state);
}

function stateKey(state) {
  return formatStateLabel(state);
}

function svgLabelSize(label, className = "automata-edge-label") {
  const charWidth = className === "automata-start-label" ? 9 : 11;
  return {
    width: Math.max(34, label.length * charWidth + 18),
    height: 28,
  };
}

function makeLabelRect(label, x, y, className = "automata-edge-label", padding = 8) {
  const { width, height } = svgLabelSize(label, className);
  return {
    left: x - width / 2 - padding,
    right: x + width / 2 + padding,
    top: y - height / 2 - padding,
    bottom: y + height / 2 + padding,
  };
}

function rectsOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function overlapArea(a, b) {
  if (!rectsOverlap(a, b)) return 0;
  return (Math.min(a.right, b.right) - Math.max(a.left, b.left)) * (Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
}

function makeSvgLabel(label, x, y, className = "automata-edge-label") {
  const { width, height } = svgLabelSize(label, className);
  return `
    <g class="automata-label-group" transform="translate(${x} ${y})">
      <rect class="automata-label-bg" x="${-width / 2}" y="${-height / 2}" width="${width}" height="${height}" rx="8"></rect>
      <text class="${className}" y="7">${escapeHtml(label)}</text>
    </g>
  `;
}

function placeSvgLabel(label, candidates, occupiedRects, bounds, className = "automata-edge-label") {
  const { width, height } = svgLabelSize(label, className);
  const margin = 8;
  const normalized = candidates.map((candidate) => ({
    x: Math.min(Math.max(candidate.x, width / 2 + margin), bounds.width - width / 2 - margin),
    y: Math.min(Math.max(candidate.y, height / 2 + margin), bounds.height - height / 2 - margin),
    anchorX: candidate.anchorX ?? candidate.x,
    anchorY: candidate.anchorY ?? candidate.y,
    penalty: candidate.penalty ?? 0,
  }));
  let best = normalized[0];
  let bestScore = Infinity;
  for (const candidate of normalized) {
    const rect = makeLabelRect(label, candidate.x, candidate.y, className);
    const overlap = occupiedRects.reduce((sum, occupied) => sum + overlapArea(rect, occupied), 0);
    const anchorDistance = Math.hypot(candidate.x - candidate.anchorX, candidate.y - candidate.anchorY);
    const preferredDistance = Math.hypot(candidate.x - normalized[0].x, candidate.y - normalized[0].y);
    const score = overlap * 100000 + anchorDistance * 8 + preferredDistance + candidate.penalty;
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
    if (overlap === 0) break;
  }
  occupiedRects.push(makeLabelRect(label, best.x, best.y, className));
  return makeSvgLabel(label, best.x, best.y, className);
}

function pointOnQuadratic(start, control, end, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * start.x + 2 * mt * t * control.x + t * t * end.x,
    y: mt * mt * start.y + 2 * mt * t * control.y + t * t * end.y,
  };
}

function tangentOnQuadratic(start, control, end, t) {
  return {
    x: 2 * (1 - t) * (control.x - start.x) + 2 * t * (end.x - control.x),
    y: 2 * (1 - t) * (control.y - start.y) + 2 * t * (end.y - control.y),
  };
}

function edgeLabelCandidates(start, control, end, preferredT = 0.5) {
  const build = (t, penalty = 0) => {
    const anchor = pointOnQuadratic(start, control, end, t);
    return {
      x: anchor.x,
      y: anchor.y,
      anchorX: anchor.x,
      anchorY: anchor.y,
      penalty,
    };
  };
  return [
    build(preferredT, 0),
    build(preferredT - 0.1, 14),
    build(preferredT + 0.1, 14),
    build(preferredT - 0.18, 34),
    build(preferredT + 0.18, 34),
    build(preferredT - 0.26, 62),
    build(preferredT + 0.26, 62),
    build(preferredT - 0.34, 96),
    build(preferredT + 0.34, 96),
    build(preferredT - 0.4, 140),
    build(preferredT + 0.4, 140),
  ];
}

function renderTransitionGraph({ states, start, accept, edges, title }) {
  const width = 860;
  const height = 430;
  const centerX = width / 2;
  const centerY = height / 2 + 12;
  const radiusX = states.length <= 3 ? 250 : 310;
  const radiusY = states.length <= 3 ? 115 : 145;
  const nodeRadius = 42;
  const positioned = new Map();
  const stateOrder = new Map();
  states.forEach((state, index) => {
    stateOrder.set(stateKey(state), index);
    const fixedThree = [
      { x: centerX, y: 112 },
      { x: centerX + 250, y: 310 },
      { x: centerX - 250, y: 310 },
    ];
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / Math.max(states.length, 1);
    const fallback = {
      x: centerX + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY,
    };
    const pos = states.length === 3 ? fixedThree[index] : fallback;
    positioned.set(stateKey(state), {
      x: pos.x,
      y: pos.y,
      label: formatStateLabel(state),
    });
  });
  const occupiedRects = [...positioned.values()].map((pos) => ({
    left: pos.x - nodeRadius - 14,
    right: pos.x + nodeRadius + 14,
    top: pos.y - nodeRadius - 14,
    bottom: pos.y + nodeRadius + 14,
  }));
  const graphBounds = { width, height };

  const grouped = new Map();
  const pairCounts = new Map();
  for (const edge of edges) {
    const key = `${stateKey(edge.from)}->${stateKey(edge.to)}`;
    const existing = grouped.get(key) || { from: stateKey(edge.from), to: stateKey(edge.to), labels: [] };
    existing.labels.push(edge.label);
    grouped.set(key, existing);
    const unordered = [stateKey(edge.from), stateKey(edge.to)].sort().join("<->");
    pairCounts.set(unordered, (pairCounts.get(unordered) || 0) + 1);
  }

  const edgePaths = [];
  const edgeLabels = [];
  [...grouped.values()].forEach((edge) => {
    const from = positioned.get(edge.from);
    const to = positioned.get(edge.to);
    const label = edge.labels.join(", ");
    if (!from || !to) return;
    if (edge.from === edge.to) {
      const loopX = from.x;
      const loopY = from.y - nodeRadius - 8;
      const loopLabelCandidates = [
        { x: loopX, y: loopY - 56 },
        { x: loopX - 28, y: loopY - 60, penalty: 14 },
        { x: loopX + 28, y: loopY - 60, penalty: 14 },
        { x: loopX - 48, y: loopY - 52, penalty: 34 },
        { x: loopX + 48, y: loopY - 52, penalty: 34 },
      ];
      edgePaths.push(`<path class="automata-edge" d="M ${from.x - 18} ${from.y - nodeRadius + 4} C ${loopX - 74} ${loopY - 70}, ${loopX + 74} ${loopY - 70}, ${from.x + 18} ${from.y - nodeRadius + 4}" marker-end="url(#automata-arrow)" />`);
      edgeLabels.push(placeSvgLabel(label, loopLabelCandidates, occupiedRects, graphBounds));
      return;
    }

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy) || 1;
    const ux = dx / distance;
    const uy = dy / distance;
    const startX = from.x + ux * nodeRadius;
    const startY = from.y + uy * nodeRadius;
    const endX = to.x - ux * (nodeRadius + 4);
    const endY = to.y - uy * (nodeRadius + 4);
    const pairDensity = pairCounts.get([edge.from, edge.to].sort().join("<->")) || 1;
    const curveMagnitude = Math.min(130, distance * (pairDensity > 1 ? 0.38 : 0.26));
    const curve = curveMagnitude;
    const controlX = (startX + endX) / 2 - uy * curve;
    const controlY = (startY + endY) / 2 + ux * curve;
    const labelCandidates = edgeLabelCandidates(
      { x: startX, y: startY },
      { x: controlX, y: controlY },
      { x: endX, y: endY },
      0.5
    );
    edgePaths.push(`<path class="automata-edge" d="M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}" marker-end="url(#automata-arrow)" />`);
    edgeLabels.push(placeSvgLabel(label, labelCandidates, occupiedRects, graphBounds));
  });

  const startNode = positioned.get(stateKey(start));
  const startPathMarkup = startNode ? `<path class="automata-start-edge" d="M ${startNode.x - 96} ${startNode.y} L ${startNode.x - nodeRadius - 8} ${startNode.y}" marker-end="url(#automata-arrow)" />` : "";
  const startLabelMarkup = startNode ? placeSvgLabel("start", [
      { x: startNode.x - 104, y: startNode.y - 10 },
      { x: startNode.x - 118, y: startNode.y - 34 },
      { x: startNode.x - 118, y: startNode.y + 28 },
    ], occupiedRects, graphBounds, "automata-start-label") : "";

  const nodeMarkup = states.map((state) => {
    const key = stateKey(state);
    const pos = positioned.get(key);
    const isAccept = accept.map(String).includes(String(state)) || accept.map(formatStateLabel).includes(formatStateLabel(state));
    const label = pos.label.length > 13 ? `${pos.label.slice(0, 12)}...` : pos.label;
    return `
      <g class="automata-node ${isAccept ? "is-accept" : ""}" transform="translate(${pos.x} ${pos.y})">
        <circle r="${nodeRadius}"></circle>
        ${isAccept ? `<circle class="accept-ring" r="${nodeRadius - 7}"></circle>` : ""}
        <text>${escapeHtml(label)}</text>
        ${label !== pos.label ? `<title>${escapeHtml(pos.label)}</title>` : ""}
      </g>
    `;
  }).join("");

  return `
    <div class="automata-graph-card">
      <h3>${escapeHtml(title)}</h3>
      <svg class="automata-transition-graph" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(title)}">
        <defs>
          <marker id="automata-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z"></path>
          </marker>
        </defs>
        ${edgePaths.join("")}
        ${startPathMarkup}
        ${nodeMarkup}
        ${edgeLabels.join("")}
        ${startLabelMarkup}
      </svg>
    </div>
  `;
}

function dfaEdges(def) {
  const edges = [];
  for (const state of def.states) {
    for (const symbol of def.alphabet) {
      const target = def.transition[state]?.[symbol];
      if (target) edges.push({ from: state, to: target, label: symbol });
    }
  }
  return edges;
}

function nfaEdges(def) {
  const edges = [];
  for (const state of def.states) {
    for (const symbol of def.alphabet) {
      for (const target of def.transition[state]?.[symbol] || []) {
        edges.push({ from: state, to: target, label: symbol });
      }
    }
    for (const target of def.epsilon[state] || []) {
      edges.push({ from: state, to: target, label: "ε" });
    }
  }
  return edges;
}

function wordPower(alphabet, length) {
  if (length === 0) return ["ε"];
  let words = [""];
  for (let i = 0; i < length; i += 1) {
    words = words.flatMap((word) => alphabet.map((symbol) => word + symbol));
  }
  return words;
}

function languageOperationDefinition(operation) {
  const definitions = {
    union: {
      title: "和集合 L1 ∪ L2",
      expression: "L1 ∪ L2",
      operationText: "L1 または L2 の少なくとも一方に含まれる語",
      tree: { type: "union", left: { type: "atom", id: "L1" }, right: { type: "atom", id: "L2" } },
    },
    intersection: {
      title: "積集合 L1 ∩ L2",
      expression: "L1 ∩ L2",
      operationText: "L1 と L2 の両方に含まれる語",
      tree: { type: "intersection", left: { type: "atom", id: "L1" }, right: { type: "atom", id: "L2" } },
    },
    complement: {
      title: "補集合 補(L1)",
      expression: "補(L1)",
      operationText: "Σ* の語のうち、L1 に含まれない語",
      tree: { type: "complement", child: { type: "atom", id: "L1" } },
    },
    combo: {
      title: "組み合わせ L1 ∩ 補(L2)",
      expression: "L1 ∩ 補(L2)",
      operationText: "L1 に含まれ、かつ L2 には含まれない語",
      tree: {
        type: "intersection",
        left: { type: "atom", id: "L1" },
        right: { type: "complement", child: { type: "atom", id: "L2" } },
      },
    },
  };
  return definitions[operation] || definitions.union;
}

function formalLanguagePredicates(alphabet) {
  return {
    L1: {
      label: "L1",
      description: "0で終わる語",
      accepts: (word) => alphabet.includes("0") && word.endsWith("0"),
    },
    L2: {
      label: "L2",
      description: "11を部分語として含む語",
      accepts: (word) => alphabet.includes("1") && word.includes("11"),
    },
  };
}

function evaluateLanguageTree(tree, predicates, word) {
  if (tree.type === "atom") return predicates[tree.id].accepts(word);
  if (tree.type === "union") return evaluateLanguageTree(tree.left, predicates, word) || evaluateLanguageTree(tree.right, predicates, word);
  if (tree.type === "intersection") return evaluateLanguageTree(tree.left, predicates, word) && evaluateLanguageTree(tree.right, predicates, word);
  if (tree.type === "complement") return !evaluateLanguageTree(tree.child, predicates, word);
  return false;
}

function displayWord(word) {
  return word || "ε";
}

const dfaEditorState = {
  exampleId: null,
  def: null,
};

const nfaEditorState = {
  exampleId: null,
  def: null,
};

function cloneDfaDefinition(def) {
  return {
    states: [...def.states],
    start: def.start,
    accept: [...def.accept],
    alphabet: [...def.alphabet],
    transition: Object.fromEntries(
      def.states.map((state) => [state, Object.fromEntries(def.alphabet.map((symbol) => [symbol, def.transition[state]?.[symbol] || def.states[0]]))])
    ),
  };
}

function getEditableDfaDefinition(example) {
  if (dfaEditorState.exampleId !== example.id || !dfaEditorState.def) {
    dfaEditorState.exampleId = example.id;
    dfaEditorState.def = cloneDfaDefinition(dfaDefinitions(example.id));
  }
  return dfaEditorState.def;
}

function cloneNfaDefinition(def) {
  return {
    states: [...def.states],
    start: def.start,
    accept: [...def.accept],
    alphabet: [...def.alphabet],
    epsilon: Object.fromEntries(def.states.map((state) => [state, [...(def.epsilon[state] || [])]])),
    transition: Object.fromEntries(
      def.states.map((state) => [
        state,
        Object.fromEntries(def.alphabet.map((symbol) => [symbol, [...(def.transition[state]?.[symbol] || [])]])),
      ])
    ),
  };
}

function getEditableNfaDefinition(example) {
  if (nfaEditorState.exampleId !== example.id || !nfaEditorState.def) {
    nfaEditorState.exampleId = example.id;
    nfaEditorState.def = cloneNfaDefinition(nfaDefinitions(example.id));
  }
  return nfaEditorState.def;
}

function dfaDefinitions(id) {
  if (id === "ends01") {
    return {
      states: ["A", "B", "C"],
      start: "A",
      accept: ["C"],
      alphabet: ["0", "1"],
      transition: {
        A: { 0: "B", 1: "A" },
        B: { 0: "B", 1: "C" },
        C: { 0: "B", 1: "A" },
      },
    };
  }
  if (id === "even0") {
    return {
      states: ["Even", "Odd"],
      start: "Even",
      accept: ["Even"],
      alphabet: ["0", "1"],
      transition: {
        Even: { 0: "Odd", 1: "Even" },
        Odd: { 0: "Even", 1: "Odd" },
      },
    };
  }
  return {
    states: ["A", "B", "C", "D"],
    start: "A",
    accept: ["C"],
    alphabet: ["a", "b", "c"],
    transition: {
      A: { a: "B", b: "D", c: "D" },
      B: { a: "D", b: "B", c: "C" },
      C: { a: "D", b: "D", c: "D" },
      D: { a: "D", b: "D", c: "D" },
    },
  };
}

function simulateDfa(def, input) {
  let state = def.start;
  const rows = [["開始", "ε", makePill(state, "start")]];
  for (const symbol of input) {
    const next = def.transition[state]?.[symbol] || "未定義";
    rows.push([escapeHtml(state), escapeHtml(symbol), makePill(next, def.accept.includes(next) ? "accept" : "")]);
    state = next;
  }
  return { state, accepted: def.accept.includes(state), rows };
}

function makeDfaTransitionEditor(def) {
  const rows = def.states
    .map((state) => {
      const cells = def.alphabet
        .map((symbol) => {
          const current = def.transition[state]?.[symbol] || def.states[0];
          const options = def.states
            .map((target) => `<option value="${escapeHtml(target)}" ${target === current ? "selected" : ""}>${escapeHtml(target)}</option>`)
            .join("");
          return `<td><select class="automata-transition-select" data-dfa-state="${escapeHtml(state)}" data-dfa-symbol="${escapeHtml(symbol)}" aria-label="${escapeHtml(`${state} で ${symbol} を読んだ次状態`)}">${options}</select></td>`;
        })
        .join("");
      return `<tr><td>${makePill(state, def.accept.includes(state) ? "accept" : state === def.start ? "start" : "")}</td>${cells}</tr>`;
    })
    .join("");
  return `<table class="automata-table automata-editable-table"><thead><tr>${["状態", ...def.alphabet]
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join("")}</tr></thead><tbody>${rows}</tbody></table>`;
}

function formatTargetList(targets) {
  return targets.join(", ");
}

function makeNfaTransitionEditor(def) {
  const headers = ["状態", ...def.alphabet, "ε"];
  const rows = def.states
    .map((state) => {
      const cells = def.alphabet
        .map((symbol) => {
          const value = formatTargetList(def.transition[state]?.[symbol] || []);
          return `<td><input class="automata-transition-input" data-nfa-state="${escapeHtml(state)}" data-nfa-symbol="${escapeHtml(symbol)}" value="${escapeHtml(value)}" aria-label="${escapeHtml(`${state} で ${symbol} を読んだ到達先集合`)}" placeholder="∅" /></td>`;
        })
        .join("");
      const epsilonValue = formatTargetList(def.epsilon[state] || []);
      return `<tr><td>${makePill(state, def.accept.includes(state) ? "accept" : state === def.start ? "start" : "")}</td>${cells}<td><input class="automata-transition-input" data-nfa-state="${escapeHtml(state)}" data-nfa-epsilon="true" value="${escapeHtml(epsilonValue)}" aria-label="${escapeHtml(`${state} からのε遷移先集合`)}" placeholder="∅" /></td></tr>`;
    })
    .join("");
  return `<table class="automata-table automata-editable-table"><thead><tr>${headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join("")}</tr></thead><tbody>${rows}</tbody></table>`;
}

function parseNfaTargetList(value, states) {
  const normalized = value.trim().replace(/^\{|\}$/g, "").trim();
  if (!normalized || normalized === "∅") return [];
  const targets = normalized.split(/[,\s]+/).filter(Boolean);
  if (targets.some((target) => !states.includes(target))) return null;
  return [...new Set(targets)];
}

function regexSamples(id) {
  const data = {
    a_or_b: {
      expression: "a|b",
      description: "a だけの語、または b だけの語を表します。",
      samples: ["a", "b"],
      test: (w) => w === "a" || w === "b",
    },
    abstarccstar: {
      expression: "ab*cc*",
      description: "a の後ろに b を0個以上、続けて c を1個以上並べます。",
      samples: ["ac", "acc", "abc", "abbc", "abbccc"],
      test: (w) => /^ab*c+$/.test(w),
    },
    abc_bc_star: {
      expression: "(abc|bc)*",
      description: "abc または bc というブロックを0個以上連接します。",
      samples: ["ε", "abc", "bc", "abcbc", "bcabc", "abcabc"],
      test: (w) => /^(abc|bc)*$/.test(w),
    },
    b_blocks_b: {
      expression: "b(c*a|a*c)*b",
      description: "b で始まり b で終わり、中央に c*a または a*c のブロックを繰り返します。",
      samples: ["bb", "bab", "bcb", "bcab", "bacb", "bccab"],
      test: (w) => /^b(c*a|a*c)*b$/.test(w),
    },
  };
  return data[id];
}

function parseTeachingRegex(expression) {
  const source = expression.replace(/\s+/g, "");
  if (!source) throw new Error("正規表現を入力してください。");
  let index = 0;

  function parseUnion() {
    let node = parseConcat();
    while (source[index] === "|") {
      index += 1;
      node = { type: "union", left: node, right: parseConcat() };
    }
    return node;
  }

  function parseConcat() {
    const parts = [];
    while (index < source.length && source[index] !== ")" && source[index] !== "|") {
      parts.push(parseRepeat());
    }
    if (!parts.length) return { type: "epsilon" };
    return parts.reduce((left, right) => ({ type: "concat", left, right }));
  }

  function parseRepeat() {
    let node = parseAtom();
    while (source[index] === "*") {
      index += 1;
      node = { type: "star", child: node };
    }
    return node;
  }

  function parseAtom() {
    const token = source[index];
    if (token === "(") {
      index += 1;
      const node = parseUnion();
      if (source[index] !== ")") throw new Error("閉じ括弧 ) が不足しています。");
      index += 1;
      return node;
    }
    if (token === "ε") {
      index += 1;
      return { type: "epsilon" };
    }
    if (/^[a-z0-9]$/i.test(token || "")) {
      index += 1;
      return { type: "literal", value: token };
    }
    throw new Error(`使えない記号 ${token || "末尾"} があります。`);
  }

  const ast = parseUnion();
  if (index !== source.length) throw new Error(`位置 ${index + 1} で解析できません。`);
  return ast;
}

function regexAstToSource(node) {
  if (node.type === "epsilon") return "";
  if (node.type === "literal") return node.value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
  if (node.type === "concat") return `${regexAstToSource(node.left)}${regexAstToSource(node.right)}`;
  if (node.type === "union") return `(?:${regexAstToSource(node.left)}|${regexAstToSource(node.right)})`;
  if (node.type === "star") return `(?:${regexAstToSource(node.child)})*`;
  return "";
}

function regexAlphabet(expression) {
  return [...new Set([...expression.replace(/\s+/g, "")].filter((char) => /^[a-z0-9]$/i.test(char)))].sort();
}

function generateRegexSamples(test, alphabet, maxLength = 4, limit = 18) {
  const samples = [];
  const chars = alphabet.length ? alphabet : ["a", "b"];
  for (let length = 0; length <= maxLength && samples.length < limit; length += 1) {
    for (const word of wordPower(chars, length)) {
      const actual = word === "ε" ? "" : word;
      if (test(actual)) samples.push(displayWord(actual));
      if (samples.length >= limit) break;
    }
  }
  return samples.length ? samples : ["該当する短い語なし"];
}

function makeEditableRegexData(expression) {
  const ast = parseTeachingRegex(expression);
  const alphabet = regexAlphabet(expression);
  const matcher = new RegExp(`^(?:${regexAstToSource(ast)})$`);
  const test = (word) => matcher.test(word);
  return {
    expression,
    alphabet,
    description: "入力した正規表現から短い語を列挙して、判定する語が生成言語 L(R) に含まれるかを調べます。",
    samples: generateRegexSamples(test, alphabet),
    test,
  };
}

function epsilonClosure(states, epsilonTransitions) {
  const stack = [...states];
  const closure = new Set(states);
  while (stack.length) {
    const state = stack.pop();
    for (const next of epsilonTransitions[state] || []) {
      if (!closure.has(next)) {
        closure.add(next);
        stack.push(next);
      }
    }
  }
  return closure;
}

function nfaDefinitions(id) {
  if (id === "contains_ab_or_ba") {
    return {
      states: ["S", "A", "B", "AB", "BA"],
      start: "S",
      accept: ["AB", "BA"],
      alphabet: ["a", "b", "c"],
      epsilon: {},
      transition: {
        S: { a: ["S", "A"], b: ["S", "B"], c: ["S"] },
        A: { b: ["AB"] },
        B: { a: ["BA"] },
        AB: { a: ["AB"], b: ["AB"], c: ["AB"] },
        BA: { a: ["BA"], b: ["BA"], c: ["BA"] },
      },
    };
  }
  return {
    states: ["S", "A", "B", "C"],
    start: "S",
    accept: ["A", "C"],
    alphabet: ["a", "b", "c"],
    epsilon: { S: ["A"] },
    transition: {
      S: { a: ["A"] },
      A: { a: ["A", "B"], b: ["B"] },
      B: { b: ["B"], c: ["C"] },
      C: { a: ["A"] },
    },
  };
}

function moveNfa(def, states, symbol) {
  const next = new Set();
  for (const state of states) {
    for (const target of def.transition[state]?.[symbol] || []) next.add(target);
  }
  return epsilonClosure(next, def.epsilon);
}

function simulateNfa(def, input) {
  let states = epsilonClosure([def.start], def.epsilon);
  const rows = [["開始", "ε", formatStateSet(states)]];
  for (const symbol of input) {
    states = moveNfa(def, states, symbol);
    rows.push(["集合遷移", escapeHtml(symbol), formatStateSet(states)]);
  }
  const accepted = [...states].some((state) => def.accept.includes(state));
  return { states, accepted, rows };
}

function formatStateSet(states) {
  const list = [...states].sort();
  return makePill(`{${list.join(", ") || "∅"}}`, list.length ? "" : "reject");
}

function subsetConstruction(def) {
  const start = epsilonClosure([def.start], def.epsilon);
  const seen = new Map();
  const queue = [start];
  const keyOf = (set) => [...set].sort().join(",");
  seen.set(keyOf(start), start);
  const rows = [];
  while (queue.length) {
    const current = queue.shift();
    const row = [formatStateSet(current)];
    for (const symbol of def.alphabet) {
      const next = moveNfa(def, current, symbol);
      const key = keyOf(next);
      if (!seen.has(key)) {
        seen.set(key, next);
        queue.push(next);
      }
      row.push(formatStateSet(next));
    }
    row.push([...current].some((state) => def.accept.includes(state)) ? makePill("受理", "accept") : "");
    rows.push(row);
  }
  return rows;
}

function subsetDfaDefinition(def) {
  const start = epsilonClosure([def.start], def.epsilon);
  const keyOf = (set) => [...set].sort().join(",");
  const labelOf = (set) => `{${[...set].sort().join(", ") || "∅"}}`;
  const seen = new Map();
  const queue = [start];
  seen.set(keyOf(start), start);
  const transition = {};
  while (queue.length) {
    const current = queue.shift();
    const currentLabel = labelOf(current);
    transition[currentLabel] = {};
    for (const symbol of def.alphabet) {
      const next = moveNfa(def, current, symbol);
      const nextKey = keyOf(next);
      if (!seen.has(nextKey)) {
        seen.set(nextKey, next);
        queue.push(next);
      }
      transition[currentLabel][symbol] = labelOf(next);
    }
  }
  const states = [...seen.values()].map(labelOf);
  return {
    states,
    start: labelOf(start),
    accept: states.filter((stateLabel) => {
      const stateSet = [...seen.values()].find((set) => labelOf(set) === stateLabel);
      return [...stateSet].some((state) => def.accept.includes(state));
    }),
    alphabet: def.alphabet,
    transition,
  };
}

function cfgDefinitions(id) {
  const makeSteps = (start) => [{ before: "", rule: "開始", location: "-", after: start, focusStart: -1, focusLength: 0 }];
  const pushStep = (steps, before, rule, location, after, focusStart = -1, focusLength = 0) => {
    steps.push({ before, rule, location, after, focusStart, focusLength });
  };
  const replaceFocus = (source, target, replacement) => {
    const focusStart = source.indexOf(target);
    if (focusStart < 0) return null;
    return {
      after: `${source.slice(0, focusStart)}${replacement}${source.slice(focusStart + target.length)}`,
      focusStart,
      focusLength: target.length,
    };
  };
  const pushReplacement = (steps, before, target, replacement, rule, location) => {
    const result = replaceFocus(before, target, replacement);
    if (!result) return before;
    pushStep(steps, before, rule, location, result.after, result.focusStart, result.focusLength);
    return result.after;
  };
  if (id === "ancbn") {
    return {
      nonterminals: ["S"],
      terminals: ["a", "b", "c"],
      start: "S",
      rules: ["S -> aSb", "S -> c"],
      sample: "aacbb",
      test: (w) => {
        const m = w.match(/^(a*)c(b*)$/);
        return Boolean(m && m[1].length === m[2].length);
      },
      derive: (w) => {
        const m = w.match(/^(a*)c(b*)$/);
        if (!m || m[1].length !== m[2].length) return null;
        let sentential = "S";
        const steps = makeSteps(sentential);
        for (let i = 0; i < m[1].length; i += 1) {
          sentential = pushReplacement(steps, sentential, "S", "aSb", "S -> aSb", `${i + 1}回目に残っている S`);
        }
        sentential = pushReplacement(steps, sentential, "S", "c", "S -> c", "中央の S");
        return steps;
      },
    };
  }
  if (id === "blocks") {
    return {
      nonterminals: ["S", "A", "B"],
      terminals: ["a", "b"],
      start: "S",
      rules: ["S -> AB", "A -> aA", "A -> ε", "B -> bB", "B -> ε"],
      sample: "aaabbb",
      test: (w) => /^a*b*$/.test(w),
      derive: (w) => {
        const m = w.match(/^(a*)(b*)$/);
        if (!m) return null;
        let sentential = "S";
        const steps = makeSteps(sentential);
        sentential = pushReplacement(steps, sentential, "S", "AB", "S -> AB", "開始記号 S");
        for (let i = 0; i < m[1].length; i += 1) {
          sentential = pushReplacement(steps, sentential, "A", "aA", "A -> aA", `左側の A (${i + 1}個目の a)`);
        }
        sentential = pushReplacement(steps, sentential, "A", "", "A -> ε", "左側の A");
        for (let i = 0; i < m[2].length; i += 1) {
          sentential = pushReplacement(steps, sentential, "B", "bB", "B -> bB", `右側の B (${i + 1}個目の b)`);
        }
        sentential = pushReplacement(steps, sentential, "B", "", "B -> ε", "右側の B");
        return steps;
      },
    };
  }
  if (id === "anbn_cm") {
    return {
      nonterminals: ["S", "A", "C"],
      terminals: ["a", "b", "c"],
      start: "S",
      rules: ["S -> AC", "A -> aAb", "A -> ε", "C -> cC", "C -> ε"],
      sample: "aabbcc",
      test: (w) => {
        const m = w.match(/^(a*)(b*)(c*)$/);
        return Boolean(m && m[1].length === m[2].length);
      },
      derive: (w) => {
        const m = w.match(/^(a*)(b*)(c*)$/);
        if (!m || m[1].length !== m[2].length) return null;
        let sentential = "S";
        const steps = makeSteps(sentential);
        sentential = pushReplacement(steps, sentential, "S", "AC", "S -> AC", "開始記号 S");
        for (let i = 0; i < m[1].length; i += 1) {
          sentential = pushReplacement(steps, sentential, "A", "aAb", "A -> aAb", `A (${i + 1}組目の a,b)`);
        }
        sentential = pushReplacement(steps, sentential, "A", "", "A -> ε", "A");
        for (let i = 0; i < m[3].length; i += 1) {
          sentential = pushReplacement(steps, sentential, "C", "cC", "C -> cC", `C (${i + 1}個目の c)`);
        }
        sentential = pushReplacement(steps, sentential, "C", "", "C -> ε", "C");
        return steps;
      },
    };
  }
  if (id === "palindrome") {
    return {
      nonterminals: ["S", "A"],
      terminals: ["a", "b", "c"],
      start: "S",
      rules: ["S -> aSa", "S -> bSb", "S -> A", "A -> c", "A -> ε"],
      sample: "abcba",
      test: (w) => w === [...w].reverse().join("") && /^[abc]*$/.test(w) && (w.length % 2 === 0 || w.includes("c")),
      derive: (w) => {
        if (!w || w !== [...w].reverse().join("") || !/^[abc]*$/.test(w)) return null;
        let left = 0;
        let right = w.length - 1;
        let sentential = "S";
        const steps = makeSteps(sentential);
        while (left < right) {
          if (w[left] !== w[right]) return null;
          const rule = w[left] === "a" ? "S -> aSa" : "S -> bSb";
          sentential = pushReplacement(steps, sentential, "S", `${w[left]}S${w[right]}`, rule, `中央に残っている S (${left + 1}文字目と${right + 1}文字目を作る)`);
          left += 1;
          right -= 1;
        }
        if (left === right) {
          if (w[left] !== "c") return null;
          sentential = pushReplacement(steps, sentential, "S", "A", "S -> A", "中央の S");
          sentential = pushReplacement(steps, sentential, "A", "c", "A -> c", "中央の A");
          return steps;
        }
        sentential = pushReplacement(steps, sentential, "S", "A", "S -> A", "中央の S");
        sentential = pushReplacement(steps, sentential, "A", "", "A -> ε", "中央の A");
        return steps;
      },
    };
  }
  if (id === "expr") {
    return {
      nonterminals: ["E", "T", "F"],
      terminals: ["a", "b", "+", "*", "(", ")"],
      start: "E",
      rules: ["E -> E+T", "E -> T", "T -> T*F", "T -> F", "F -> a", "F -> b", "F -> (E)"],
      sample: "a+a*b",
      test: (w) => parseArithmeticExpr(w),
      derive: (w) => {
        if (!/^[ab](\*[ab])*(\+[ab](\*[ab])*)*$/.test(w)) return null;
        const steps = makeSteps("E");
        const terms = w.split("+");
        let sentential = "E";
        for (let i = 1; i < terms.length; i += 1) {
          sentential = pushReplacement(steps, sentential, "E", "E+T", "E -> E+T", `左端の E (${i + 1}個目の項を追加)`);
        }
        sentential = pushReplacement(steps, sentential, "E", "T", "E -> T", "左端の E");
        terms.forEach((term, termIndex) => {
          const factors = term.split("*");
          for (let i = 1; i < factors.length; i += 1) {
            sentential = pushReplacement(steps, sentential, "T", "T*F", "T -> T*F", `${termIndex + 1}個目の項の T (${i + 1}個目の因子を追加)`);
          }
          sentential = pushReplacement(steps, sentential, "T", "F", "T -> F", `${termIndex + 1}個目の項の T`);
          factors.forEach((factor, factorIndex) => {
            sentential = pushReplacement(steps, sentential, "F", factor, `F -> ${factor}`, `${termIndex + 1}個目の項の${factorIndex + 1}個目の F`);
          });
        });
        return steps;
      },
    };
  }
  return {
    nonterminals: ["S"],
    terminals: ["a", "b"],
    start: "S",
    rules: ["S -> aSb", "S -> ε"],
    sample: "aaabbb",
    test: (w) => {
      const m = w.match(/^(a*)(b*)$/);
      return Boolean(m && m[1].length === m[2].length);
    },
    derive: (w) => {
      const m = w.match(/^(a*)(b*)$/);
      if (!m || m[1].length !== m[2].length) return null;
      let sentential = "S";
      const steps = makeSteps(sentential);
      for (let i = 0; i < m[1].length; i += 1) {
        sentential = pushReplacement(steps, sentential, "S", "aSb", "S -> aSb", `${i + 1}回目に残っている S`);
      }
      sentential = pushReplacement(steps, sentential, "S", "", "S -> ε", "中央の S");
      return steps;
    },
  };
}

function parseArithmeticExpr(input) {
  let index = 0;
  function parseF() {
    if (input[index] === "a" || input[index] === "b") {
      index += 1;
      return true;
    }
    if (input[index] === "(") {
      index += 1;
      if (!parseE()) return false;
      if (input[index] !== ")") return false;
      index += 1;
      return true;
    }
    return false;
  }
  function parseT() {
    if (!parseF()) return false;
    while (input[index] === "*") {
      index += 1;
      if (!parseF()) return false;
    }
    return true;
  }
  function parseE() {
    if (!parseT()) return false;
    while (input[index] === "+") {
      index += 1;
      if (!parseT()) return false;
    }
    return true;
  }
  return input.length > 0 && parseE() && index === input.length;
}

function simulatePda(id, input) {
  if (id === "balanced") {
    const stack = ["Z"];
    const rows = [["q", "ε", stack.join(""), "開始"]];
    let ok = true;
    for (const ch of input) {
      if (ch === "(") {
        stack.push("(");
        rows.push(["q", ch, stack.join(""), "push"]);
      } else if (ch === ")" && stack.at(-1) === "(") {
        stack.pop();
        rows.push(["q", ch, stack.join(""), "pop"]);
      } else {
        ok = false;
        rows.push(["q", ch, stack.join(""), "対応なし"]);
      }
    }
    return { accepted: ok && stack.length === 1, rows };
  }
  const stack = ["Z"];
  let phase = "push";
  let accepted = true;
  const rows = [["q0", "ε", stack.join(""), "開始"]];
  for (const ch of input) {
    if (phase === "push" && ch === "a") {
      stack.push("A");
      rows.push(["q0", ch, stack.join(""), "Aを積む"]);
    } else if (phase === "push" && ch === "c") {
      phase = "pop";
      rows.push(["q1", ch, stack.join(""), "中央のcを読む"]);
    } else if (phase === "pop" && ch === "b" && stack.at(-1) === "A") {
      stack.pop();
      rows.push(["q1", ch, stack.join(""), "Aを降ろす"]);
    } else {
      accepted = false;
      rows.push(["qx", ch, stack.join(""), "遷移なし"]);
    }
  }
  return { accepted: accepted && phase === "pop" && stack.length === 1, rows };
}

function simulateTuring(id, input) {
  const tape = input.split("");
  let head = 0;
  let state = "q0";
  const rows = [];
  const snapshot = (action) => rows.push([state, String(head), renderTape(tape, head), action]);
  snapshot("開始");
  for (let step = 0; step < 20 && state !== "halt"; step += 1) {
    const symbol = tape[head] || "B";
    if (id === "erase_ones") {
      if (state === "q0" && symbol === "1") {
        tape[head] = "B";
        head += 1;
        snapshot("1をBに書き換えて右へ");
      } else {
        state = "halt";
        snapshot("空白で停止");
      }
    } else if (symbol === "1") {
      head += 1;
      snapshot("1を読み、右へ");
    } else {
      tape[head] = "1";
      state = "halt";
      snapshot("空白に1を書いて停止");
    }
  }
  return rows;
}

function renderTape(tape, head) {
  const cells = [];
  const max = Math.max(tape.length + 1, head + 1);
  for (let i = 0; i < max; i += 1) {
    const symbol = tape[i] || "B";
    cells.push(`<span class="tape-cell ${i === head ? "is-head" : ""}">${escapeHtml(symbol)}</span>`);
  }
  return `<span class="tape-row">${cells.join("")}</span>`;
}

function renderFormalOperation(example, input) {
  const alphabet = example.alphabet;
  const predicates = formalLanguagePredicates(alphabet);
  const operation = languageOperationDefinition(example.operation);
  const valid = [...input].every((symbol) => alphabet.includes(symbol));
  const accepted = valid && evaluateLanguageTree(operation.tree, predicates, input);
  const sampleWords = [""]
    .concat(wordPower(alphabet, 1), wordPower(alphabet, 2), wordPower(alphabet, 3))
    .slice(0, 18);
  const rows = sampleWords.map((word) => {
    const inL1 = predicates.L1.accepts(word);
    const inL2 = predicates.L2.accepts(word);
    const inResult = evaluateLanguageTree(operation.tree, predicates, word);
    return [
      makePill(displayWord(word)),
      makePill(inL1 ? "○" : "×", inL1 ? "accept" : "reject"),
      makePill(inL2 ? "○" : "×", inL2 ? "accept" : "reject"),
      makePill(inResult ? "○" : "×", inResult ? "accept" : "reject"),
    ];
  });

  setHtml("automataPrimaryStage", `
    <div class="automata-definition-grid">
      ${makePill(`Σ = {${alphabet.join(", ")}}`, "start")}
      ${makePill(`${predicates.L1.label}: ${predicates.L1.description}`)}
      ${makePill(`${predicates.L2.label}: ${predicates.L2.description}`)}
      ${makePill(operation.expression, "start")}
    </div>
    <div class="automata-expression">${escapeHtml(operation.title)}</div>
    ${makeTable(["語", "L1", "L2", operation.expression], rows)}
    <div class="automata-result ${accepted ? "is-accepted" : "is-rejected"}">
      ${escapeHtml(displayWord(input))} は ${valid ? escapeHtml(operation.expression) : "Σ*"} に${accepted ? "含まれる" : "含まれない"}
    </div>
  `);
  setHtml("automataTraceStage", `
    <p>${escapeHtml(operation.operationText)}として判定します。補集合はこのページでは Σ* に対する補集合、つまり「同じアルファベットで作れる全ての語」から元の言語を除いた集合です。</p>
  `);
}

function renderFormal(page, example, input) {
  if (example.operation) {
    renderFormalOperation(example, input);
    return;
  }
  const alphabet = example.alphabet;
  const words2 = wordPower(alphabet, 2);
  const words3 = wordPower(alphabet, 3);
  const valid = [...input].every((symbol) => alphabet.includes(symbol));
  setHtml("automataPrimaryStage", `
    <div class="automata-definition-grid">
      ${makePill(`Σ = {${alphabet.join(", ")}}`, "start")}
      ${makePill(`入力語 x = ${input || "ε"}`)}
      ${makePill(`|x| = ${input.length}`)}
      ${makePill(valid ? "x ∈ Σ*" : "x ∉ Σ*", valid ? "accept" : "reject")}
    </div>
    ${makeTable(["集合", "例"], [
      ["Σ<sup>2</sup>", words2.map((w) => makePill(w)).join("")],
      ["Σ<sup>3</sup>", words3.slice(0, 18).map((w) => makePill(w)).join("") + (words3.length > 18 ? makePill("...") : "")],
      ["Σ*", [makePill("ε"), ...alphabet.map(makePill), ...words2.slice(0, 6).map(makePill), makePill("...")].join("")],
      ["連接", `${makePill(input || "ε")} ${makePill("+")} ${makePill(example.word)} ${makePill("=")} ${makePill((input || "") + example.word)}`],
    ])}
  `);
  setHtml("automataTraceStage", `<p>形式言語は Σ* の部分集合です。条件を決めると、例えば「0で終わる語全体」「aを偶数個含む語全体」のような言語になります。</p>`);
}

function renderDfa(page, example, input) {
  const def = getEditableDfaDefinition(example);
  const sim = simulateDfa(def, input);
  setHtml("automataPrimaryStage", `
    ${renderTransitionGraph({ states: def.states, start: def.start, accept: def.accept, edges: dfaEdges(def), title: "状態遷移図" })}
    ${makeDfaTransitionEditor(def)}
    <div class="automata-result ${sim.accepted ? "is-accepted" : "is-rejected"}">${sim.accepted ? "受理" : "不受理"}: 最終状態 ${escapeHtml(sim.state)}</div>
  `);
  setHtml("automataTraceStage", makeTable(["現在状態", "入力", "次の状態"], sim.rows));
}

function renderRegex(page, example, input) {
  const expression = byId("automataRegex")?.value.trim() || regexSamples(example.id).expression;
  const word = input === "ε" ? "" : input;
  const displayInput = input === "ε" ? "ε" : displayWord(input);
  let data;
  try {
    data = makeEditableRegexData(expression);
  } catch (error) {
    setHtml("automataPrimaryStage", `
      <div class="automata-expression">${escapeHtml(expression || "未入力")}</div>
      <div class="automata-result is-rejected">${escapeHtml(error.message)}</div>
    `);
    setHtml("automataTraceStage", `<p>使える記号は英数字、ε、括弧、和集合 |、閉包 * です。連結は記号を続けて書きます。</p>`);
    return;
  }
  const accepted = data.test(word);
  setHtml("automataPrimaryStage", `
    <div class="automata-expression">${escapeHtml(data.expression)}</div>
    <div class="automata-definition-grid">
      ${makePill(`Σ = {${data.alphabet.join(", ") || "ε"}}`, "start")}
      ${makePill("和集合 |")}
      ${makePill("連結")}
      ${makePill("閉包 *")}
    </div>
    <p>${escapeHtml(data.description)}</p>
    <div class="automata-word-list">${data.samples.map((sample) => makePill(sample)).join("")}</div>
    <div class="automata-result ${accepted ? "is-accepted" : "is-rejected"}">${escapeHtml(displayInput)} は ${accepted ? "L(R) に含まれる" : "L(R) に含まれない"}</div>
  `);
  setHtml("automataTraceStage", `<p>正規表現で表せる言語は、有限オートマトンで受理できる言語と一致します。</p>`);
}

function renderNfa(page, example, input) {
  const def = getEditableNfaDefinition(example);
  const sim = simulateNfa(def, input);
  const reachedAccepts = def.accept.filter((state) => sim.states.has(state));
  const accepts = reachedAccepts.map((state) => makePill(state, "accept")).join(" ");
  setHtml("automataPrimaryStage", `
    <div class="automata-definition-grid">
      ${makePill(`Q = {${def.states.join(", ")}}`)}
      ${makePill(`Σ = {${def.alphabet.join(", ")}}`, "start")}
      ${makePill(`q0 = ${def.start}`, "start")}
      ${makePill(`F = {${def.accept.join(", ")}}`, "accept")}
    </div>
    ${renderTransitionGraph({ states: def.states, start: def.start, accept: def.accept, edges: nfaEdges(def), title: "NFAの状態遷移図" })}
    ${makeNfaTransitionEditor(def)}
    <div class="automata-result ${sim.accepted ? "is-accepted" : "is-rejected"}">
      入力 ${escapeHtml(input || "ε")} は ${sim.accepted ? "受理" : "不受理"}:
      最終到達集合 ${formatStateSet(sim.states)}
      ${sim.accepted ? ` が受理状態 ${accepts} を含む` : " は受理状態を含まない"}
    </div>
  `);
  setHtml("automataTraceStage", makeTable(["操作", "入力", "到達可能状態集合"], sim.rows));
}

function renderNfaToDfa(page, example, input) {
  const def = example.id === "choice"
    ? {
        states: ["S", "A", "B", "F"],
        start: "S",
        accept: ["F"],
        alphabet: ["a", "b", "c"],
        epsilon: { S: ["A", "B"] },
        transition: { A: { a: ["A"], b: ["F"] }, B: { a: ["A"], c: ["F"] }, F: {} },
      }
    : nfaDefinitions("a_or_abstarc");
  const sim = simulateNfa(def, input);
  const rows = subsetConstruction(def);
  const converted = subsetDfaDefinition(def);
  setHtml("automataPrimaryStage", `
    ${renderTransitionGraph({ states: def.states, start: def.start, accept: def.accept, edges: nfaEdges(def), title: "元のNFAの状態遷移図" })}
    ${renderTransitionGraph({ states: converted.states, start: converted.start, accept: converted.accept, edges: dfaEdges(converted), title: "変換後DFAの状態遷移図" })}
    ${makeTable(["DFA状態", ...def.alphabet, "受理"], rows)}
    <div class="automata-result ${sim.accepted ? "is-accepted" : "is-rejected"}">入力 ${escapeHtml(input || "ε")} は ${sim.accepted ? "受理" : "不受理"}</div>
  `);
  setHtml("automataTraceStage", makeTable(["操作", "入力", "NFAでの到達可能状態"], sim.rows));
}

function renderCfg(page, example, input) {
  const def = cfgDefinitions(example.id);
  const accepted = def.test(input);
  const inputSteps = def.derive(input);
  const steps = inputSteps || def.derive(def.sample) || [];
  const shownWord = inputSteps ? input : def.sample;
  const rows = steps.map((step, index) => [
    String(index),
    renderCfgSentential(step),
    escapeHtml(step.rule),
    renderCfgLocation(step),
  ]);
  setHtml("automataPrimaryStage", `
    <div class="automata-definition-grid">
      ${makePill(`V = {${def.nonterminals.join(", ")}}`, "start")}
      ${makePill(`Σ = {${def.terminals.join(", ")}}`)}
      ${makePill(`開始記号 ${def.start}`, "start")}
      ${makePill(`入力 ${input || "ε"}`, accepted ? "accept" : "reject")}
    </div>
    <div class="automata-rule-list">${def.rules.map((rule) => makePill(rule)).join("")}</div>
    <div class="automata-result ${accepted ? "is-accepted" : "is-rejected"}">${escapeHtml(input || "ε")} は ${accepted ? "生成できる" : "この例の文法では生成できない"}</div>
  `);
  setHtml("automataTraceStage", `
    ${renderCfgAnimation(steps, shownWord)}
    ${makeTable(["段階", "句形式", "適用した生成規則", "適用個所"], rows)}
  `);
}

function renderCfgSentential(step) {
  const value = step.before || step.after || "";
  if (!value) return makePill("ε");
  if (step.focusStart < 0 || !step.focusLength) return makePill(value);
  const before = value.slice(0, step.focusStart);
  const focus = value.slice(step.focusStart, step.focusStart + step.focusLength);
  const after = value.slice(step.focusStart + step.focusLength);
  return `<span class="cfg-sentential"><span>${escapeHtml(before)}<mark class="cfg-focus-symbol">${escapeHtml(focus)}</mark>${escapeHtml(after)}</span><span class="cfg-derive-arrow">=&gt;</span><span>${escapeHtml(step.after || "ε")}</span></span>`;
}

function renderCfgLocation(step) {
  if (step.focusStart < 0 || !step.focusLength) return escapeHtml(step.location);
  return `<span class="cfg-location">${escapeHtml(step.location)}<span class="cfg-location-index">${step.focusStart + 1}文字目</span></span>`;
}

function renderCfgAnimation(steps, word) {
  if (!steps.length) return `<p>この入力語に対する導出例はありません。</p>`;
  const duration = Math.max(steps.length, 1) * 1.2;
  return `
    <div class="cfg-animation" aria-label="${escapeHtml(`${word || "ε"} の導出アニメーション`)}" style="--cfg-cycle: ${duration}s">
      ${steps
        .map((step, index) => `
          <div class="cfg-animation-step" style="--cfg-step: ${index}; --cfg-count: ${steps.length}">
            <span class="cfg-step-index">${index}</span>
            <span class="cfg-step-form">${renderCfgSentential(step)}</span>
            <span class="cfg-step-rule">${escapeHtml(step.rule)}</span>
          </div>
        `)
        .join("")}
    </div>
  `;
}

function renderPda(page, example, input) {
  const sim = simulatePda(example.id, input);
  setHtml("automataPrimaryStage", `
    <div class="automata-definition-grid">
      ${makePill("有限状態制御部", "start")}
      ${makePill("入力ヘッド")}
      ${makePill("プッシュダウンスタック")}
      ${makePill(sim.accepted ? "受理" : "不受理", sim.accepted ? "accept" : "reject")}
    </div>
    <div class="automata-result ${sim.accepted ? "is-accepted" : "is-rejected"}">${escapeHtml(input || "ε")} は ${sim.accepted ? "受理される" : "受理されない"}</div>
  `);
  setHtml("automataTraceStage", makeTable(["状態", "読む記号", "スタック", "操作"], sim.rows.map((row) => row.map(escapeHtml))));
}

function renderTuring(page, example, input) {
  const rows = simulateTuring(example.id, input);
  setHtml("automataPrimaryStage", `
    <div class="automata-definition-grid">
      ${makePill("状態 q0", "start")}
      ${makePill("テープ")}
      ${makePill("読み書きヘッド")}
      ${makePill("停止状態 halt", "accept")}
    </div>
    <p>テープの空白記号は B で表示します。</p>
  `);
  setHtml("automataTraceStage", makeTable(["状態", "ヘッド", "テープ", "動作"], rows));
}

const renderers = {
  formal_language: renderFormal,
  dfa_language: renderDfa,
  regular_expression: renderRegex,
  nfa_language: renderNfa,
  nfa_to_dfa: renderNfaToDfa,
  cfg_language: renderCfg,
  pda_language: renderPda,
  turing_machine: renderTuring,
};

function renderAutomataPage() {
  const pageId = document.body.dataset.automataPage;
  const page = automataPages[pageId];
  if (!page) return;

  const select = byId("automataExample");
  const input = byId("automataInput");
  const regexInput = byId("automataRegex");
  const epsilonButton = byId("automataInsertEpsilon");
  const badge = byId("automataBadge");
  const title = byId("automataTitle");
  const subtitle = byId("automataSubtitle");
  const notes = byId("automataNotes");

  if (badge) badge.textContent = page.badge;
  if (title) title.textContent = page.title;
  if (subtitle) subtitle.textContent = page.subtitle;

  select.innerHTML = page.examples.map((example) => `<option value="${example.id}">${escapeHtml(example.label)}</option>`).join("");
  if (pageId === "regular_expression" && regexInput) {
    regexInput.value = regexSamples(page.examples[0].id).expression;
  }

  function update() {
    const example = page.examples.find((item) => item.id === select.value) || page.examples[0];
    if (!input.value && example.input) input.value = example.input;
    if (pageId === "formal_language") input.value = input.value || example.word;
    renderers[pageId](page, example, input.value.trim());
    if (notes) notes.innerHTML = renderNotes(pageId);
  }

  select.addEventListener("change", () => {
    const example = page.examples.find((item) => item.id === select.value) || page.examples[0];
    input.value = example.input || example.word || "";
    if (pageId === "regular_expression" && regexInput) regexInput.value = regexSamples(example.id).expression;
    update();
  });
  input.addEventListener("input", update);
  regexInput?.addEventListener("input", update);
  let regexTargetInput = input;
  [regexInput, input].forEach((control) => {
    control?.addEventListener("focus", () => {
      regexTargetInput = control;
    });
  });
  epsilonButton?.addEventListener("click", () => {
    const target = regexTargetInput || input;
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    target.value = `${target.value.slice(0, start)}ε${target.value.slice(end)}`;
    target.focus();
    target.setSelectionRange(start + 1, start + 1);
    target.dispatchEvent(new Event("input", { bubbles: true }));
  });
  byId("automataRun")?.addEventListener("click", update);
  function applyTransitionEdit(control) {
    if (!control?.matches?.("[data-dfa-state][data-dfa-symbol], [data-nfa-state]")) return;
    const example = page.examples.find((item) => item.id === select.value) || page.examples[0];
    if (pageId === "dfa_language" && control.matches?.("[data-dfa-state][data-dfa-symbol]")) {
      const def = getEditableDfaDefinition(example);
      const state = control.dataset.dfaState;
      const symbol = control.dataset.dfaSymbol;
      if (def.transition[state] && def.alphabet.includes(symbol) && def.states.includes(control.value)) {
        def.transition[state][symbol] = control.value;
        update();
      }
      return;
    }
    if (pageId === "nfa_language" && control.matches?.("[data-nfa-state]")) {
      const def = getEditableNfaDefinition(example);
      const state = control.dataset.nfaState;
      const targets = parseNfaTargetList(control.value, def.states);
      if (!targets) {
        control.setCustomValidity(`状態は ${def.states.join(", ")} から選んでください。`);
        control.reportValidity();
        return;
      }
      control.setCustomValidity("");
      if (control.dataset.nfaEpsilon === "true") {
        def.epsilon[state] = targets;
      } else {
        const symbol = control.dataset.nfaSymbol;
        if (!def.transition[state]) def.transition[state] = {};
        if (!def.alphabet.includes(symbol)) return;
        def.transition[state][symbol] = targets;
      }
      update();
    }
  }

  const primaryStage = byId("automataPrimaryStage");
  let nfaEditTimer = null;
  primaryStage?.addEventListener("change", (event) => applyTransitionEdit(event.target));
  primaryStage?.addEventListener("input", (event) => {
    if (pageId !== "nfa_language" || !event.target?.matches?.("[data-nfa-state]")) return;
    window.clearTimeout(nfaEditTimer);
    const control = event.target;
    nfaEditTimer = window.setTimeout(() => applyTransitionEdit(control), 250);
  });
  primaryStage?.addEventListener("focusout", (event) => {
    window.clearTimeout(nfaEditTimer);
    applyTransitionEdit(event.target);
  });
  primaryStage?.addEventListener("keydown", (event) => {
    if (pageId === "nfa_language" && event.key === "Enter" && event.target?.matches?.("[data-nfa-state]")) {
      event.preventDefault();
      event.target.blur();
    }
  });
  input.value = page.examples[0].input || page.examples[0].word || "";
  update();
}

function renderNotes(pageId) {
  const notes = {
    formal_language: [
      ["アルファベット Σ", "使える記号の有限集合です。"],
      ["語 w", "Σ の記号を有限個並べたものです。長さ0の語は ε です。"],
      ["言語 L", "Σ* の部分集合、つまり語の集合です。"],
      ["和集合 L1 ∪ L2", "L1 または L2 のどちらかに含まれる語の集合です。"],
      ["積集合 L1 ∩ L2", "L1 と L2 の両方に含まれる語の集合です。"],
      ["補集合 補(L)", "同じアルファベットで作れる全ての語から L を除いた集合です。"],
    ],
    dfa_language: [
      ["DFA", "状態、入力アルファベット、受理状態、初期状態、遷移関数の五つ組です。"],
      ["受理言語 L(M)", "初期状態から入力を読み、最後に受理状態へ到達する語の集合です。"],
      ["決定性", "状態と入力記号を決めると次状態が1つに決まります。"],
    ],
    regular_expression: [
      ["連結", "RS は R の語の後ろに S の語をつなげます。"],
      ["和集合 |", "R|S は R または S のどちらかで生成できる語です。"],
      ["閉包 *", "R* は R の語を0個以上連接した語です。"],
    ],
    nfa_language: [
      ["NFA", "状態、入力アルファベット、受理状態、初期状態、遷移関係の五つ組です。"],
      ["受理言語 L(M)", "初期状態から入力を読み、どれか1つの経路が最後に受理状態へ到達する語の集合です。"],
      ["非決定性", "状態と入力記号を決めても次状態が0個、1個、または複数個ありえます。"],
      ["ε遷移", "入力を読まずに状態を移れます。到達可能状態集合にはε遷移で進める状態も含めます。"],
    ],
    nfa_to_dfa: [
      ["等価性", "DFAとNFAが受理できる言語の範囲は同じです。"],
      ["部分集合構成", "NFAの到達可能状態集合をDFAの1状態として扱います。"],
      ["受理状態", "集合の中に元NFAの受理状態が含まれれば受理状態です。"],
    ],
    cfg_language: [
      ["CFG", "非終端記号、終端記号、生成規則、開始記号の四つ組です。"],
      ["導出", "開始記号から規則を適用し、終端記号だけの語にします。"],
      ["文脈自由言語", "CFGで生成できる言語です。"],
    ],
    pda_language: [
      ["PDA", "NFAにスタックを加えた計算モデルです。"],
      ["スタック", "最後に積んだ記号を先に取り出す LIFO 構造です。"],
      ["受理", "入力を読み終え、最終状態または空スタック条件を満たすと受理します。"],
    ],
    turing_machine: [
      ["テープ", "空白を含む記号を書けるマスが並びます。"],
      ["ヘッド", "1マスを読み書きし、左・右・停止方向へ動きます。"],
      ["停止", "停止状態に入ると計算が終わります。"],
    ],
  };
  return `<dl>${notes[pageId].map(([term, desc]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(desc)}</dd></div>`).join("")}</dl>`;
}

document.addEventListener("DOMContentLoaded", renderAutomataPage);
