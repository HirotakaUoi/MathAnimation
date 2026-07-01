const automataPages = {
  formal_language: {
    badge: "Σ, word, language",
    title: "形式言語",
    subtitle: "アルファベット、語、空語、連接、閉包、言語を具体例で確認します。",
    examples: [
      { id: "binary", label: "Σ = {0, 1}", alphabet: ["0", "1"], word: "0101" },
      { id: "abc", label: "Σ = {a, b, c}", alphabet: ["a", "b", "c"], word: "abca" },
      { id: "acz", label: "Σ = {a, c, z}", alphabet: ["a", "c", "z"], word: "azca" },
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
    title: "非決定性有限オートマトンとその生成言語",
    subtitle: "1つの入力で複数の遷移先を持てます。ε遷移も使えます。",
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
      { id: "expr", label: "E -> (E+E) | a | b", input: "((a+b)+a)" },
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

function renderTransitionGraph({ states, start, accept, edges, title }) {
  const width = 860;
  const height = 430;
  const centerX = width / 2;
  const centerY = height / 2 + 12;
  const radiusX = states.length <= 3 ? 250 : 310;
  const radiusY = states.length <= 3 ? 115 : 145;
  const nodeRadius = 42;
  const positioned = new Map();
  states.forEach((state, index) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / Math.max(states.length, 1);
    positioned.set(stateKey(state), {
      x: centerX + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY,
      label: formatStateLabel(state),
    });
  });

  const grouped = new Map();
  for (const edge of edges) {
    const key = `${stateKey(edge.from)}->${stateKey(edge.to)}`;
    const existing = grouped.get(key) || { from: stateKey(edge.from), to: stateKey(edge.to), labels: [] };
    existing.labels.push(edge.label);
    grouped.set(key, existing);
  }

  const edgeMarkup = [...grouped.values()].map((edge, index) => {
    const from = positioned.get(edge.from);
    const to = positioned.get(edge.to);
    const label = edge.labels.join(", ");
    if (!from || !to) return "";
    if (edge.from === edge.to) {
      const loopX = from.x;
      const loopY = from.y - nodeRadius - 8;
      return `
        <path class="automata-edge" d="M ${from.x - 18} ${from.y - nodeRadius + 4} C ${loopX - 74} ${loopY - 70}, ${loopX + 74} ${loopY - 70}, ${from.x + 18} ${from.y - nodeRadius + 4}" marker-end="url(#automata-arrow)" />
        <text class="automata-edge-label" x="${loopX}" y="${loopY - 56}">${escapeHtml(label)}</text>
      `;
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
    const curve = ((index % 2 === 0 ? 1 : -1) * Math.min(58, distance * 0.18));
    const controlX = (startX + endX) / 2 - uy * curve;
    const controlY = (startY + endY) / 2 + ux * curve;
    return `
      <path class="automata-edge" d="M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}" marker-end="url(#automata-arrow)" />
      <text class="automata-edge-label" x="${controlX}" y="${controlY - 8}">${escapeHtml(label)}</text>
    `;
  }).join("");

  const startNode = positioned.get(stateKey(start));
  const startMarkup = startNode ? `
    <path class="automata-start-edge" d="M ${startNode.x - 96} ${startNode.y} L ${startNode.x - nodeRadius - 8} ${startNode.y}" marker-end="url(#automata-arrow)" />
    <text class="automata-start-label" x="${startNode.x - 104}" y="${startNode.y - 10}">start</text>
  ` : "";

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
        ${edgeMarkup}
        ${startMarkup}
        ${nodeMarkup}
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
  if (id === "ancbn") {
    return {
      rules: ["S -> aSb", "S -> c"],
      test: (w) => {
        const m = w.match(/^(a*)c(b*)$/);
        return Boolean(m && m[1].length === m[2].length);
      },
      derive: (w) => {
        const m = w.match(/^(a*)c(b*)$/);
        if (!m || m[1].length !== m[2].length) return null;
        let sentential = "S";
        const steps = [sentential];
        for (let i = 0; i < m[1].length; i += 1) {
          sentential = sentential.replace("S", "aSb");
          steps.push(sentential);
        }
        steps.push(sentential.replace("S", "c"));
        return steps;
      },
    };
  }
  if (id === "expr") {
    return {
      rules: ["E -> (E+E)", "E -> a", "E -> b"],
      test: (w) => parseExpr(w),
      derive: () => ["E", "(E+E)", "((E+E)+E)", "((a+b)+a)"],
    };
  }
  return {
    rules: ["S -> aSb", "S -> ε"],
    test: (w) => {
      const m = w.match(/^(a*)(b*)$/);
      return Boolean(m && m[1].length === m[2].length);
    },
    derive: (w) => {
      const m = w.match(/^(a*)(b*)$/);
      if (!m || m[1].length !== m[2].length) return null;
      let sentential = "S";
      const steps = [sentential];
      for (let i = 0; i < m[1].length; i += 1) {
        sentential = sentential.replace("S", "aSb");
        steps.push(sentential);
      }
      steps.push(sentential.replace("S", "ε").replace("ε", ""));
      return steps;
    },
  };
}

function parseExpr(input) {
  let index = 0;
  function parseE() {
    if (input[index] === "a" || input[index] === "b") {
      index += 1;
      return true;
    }
    if (input[index] === "(") {
      index += 1;
      if (!parseE()) return false;
      if (input[index] !== "+") return false;
      index += 1;
      if (!parseE()) return false;
      if (input[index] !== ")") return false;
      index += 1;
      return true;
    }
    return false;
  }
  return parseE() && index === input.length;
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

function renderFormal(page, example, input) {
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
  const def = dfaDefinitions(example.id);
  const sim = simulateDfa(def, input);
  const transitionRows = def.states.map((state) => [
    makePill(state, def.accept.includes(state) ? "accept" : state === def.start ? "start" : ""),
    ...def.alphabet.map((symbol) => makePill(def.transition[state]?.[symbol] || "-")),
  ]);
  setHtml("automataPrimaryStage", `
    ${renderTransitionGraph({ states: def.states, start: def.start, accept: def.accept, edges: dfaEdges(def), title: "状態遷移図" })}
    ${makeTable(["状態", ...def.alphabet], transitionRows)}
    <div class="automata-result ${sim.accepted ? "is-accepted" : "is-rejected"}">${sim.accepted ? "受理" : "不受理"}: 最終状態 ${escapeHtml(sim.state)}</div>
  `);
  setHtml("automataTraceStage", makeTable(["現在状態", "入力", "次の状態"], sim.rows));
}

function renderRegex(page, example, input) {
  const data = regexSamples(example.id);
  const accepted = data.test(input);
  setHtml("automataPrimaryStage", `
    <div class="automata-expression">${escapeHtml(data.expression)}</div>
    <p>${escapeHtml(data.description)}</p>
    <div class="automata-word-list">${data.samples.map((sample) => makePill(sample)).join("")}</div>
    <div class="automata-result ${accepted ? "is-accepted" : "is-rejected"}">${escapeHtml(input || "ε")} は ${accepted ? "L(R) に含まれる" : "L(R) に含まれない"}</div>
  `);
  setHtml("automataTraceStage", `<p>正規表現で表せる言語は、有限オートマトンで受理できる言語と一致します。</p>`);
}

function renderNfa(page, example, input) {
  const def = nfaDefinitions(example.id);
  const sim = simulateNfa(def, input);
  const headers = ["状態", ...def.alphabet, "ε"];
  const rows = def.states.map((state) => [
    makePill(state, def.accept.includes(state) ? "accept" : state === def.start ? "start" : ""),
    ...def.alphabet.map((symbol) => formatStateSet(new Set(def.transition[state]?.[symbol] || []))),
    formatStateSet(new Set(def.epsilon[state] || [])),
  ]);
  setHtml("automataPrimaryStage", `
    ${renderTransitionGraph({ states: def.states, start: def.start, accept: def.accept, edges: nfaEdges(def), title: "状態遷移図" })}
    ${makeTable(headers, rows)}
    <div class="automata-result ${sim.accepted ? "is-accepted" : "is-rejected"}">${sim.accepted ? "どれかの経路が受理状態へ到達" : "受理状態へ到達する経路なし"}</div>
  `);
  setHtml("automataTraceStage", makeTable(["操作", "入力", "到達可能状態"], sim.rows));
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
  const steps = def.derive(input) || def.derive("") || [];
  setHtml("automataPrimaryStage", `
    <div class="automata-rule-list">${def.rules.map((rule) => makePill(rule)).join("")}</div>
    <div class="automata-result ${accepted ? "is-accepted" : "is-rejected"}">${escapeHtml(input || "ε")} は ${accepted ? "生成できる" : "この例の文法では生成できない"}</div>
  `);
  setHtml("automataTraceStage", makeTable(["段階", "句形式"], steps.map((step, index) => [String(index), makePill(step || "ε")])));
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
  const badge = byId("automataBadge");
  const title = byId("automataTitle");
  const subtitle = byId("automataSubtitle");
  const notes = byId("automataNotes");

  if (badge) badge.textContent = page.badge;
  if (title) title.textContent = page.title;
  if (subtitle) subtitle.textContent = page.subtitle;

  select.innerHTML = page.examples.map((example) => `<option value="${example.id}">${escapeHtml(example.label)}</option>`).join("");

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
    update();
  });
  input.addEventListener("input", update);
  byId("automataRun")?.addEventListener("click", update);
  input.value = page.examples[0].input || page.examples[0].word || "";
  update();
}

function renderNotes(pageId) {
  const notes = {
    formal_language: [
      ["アルファベット Σ", "使える記号の有限集合です。"],
      ["語 w", "Σ の記号を有限個並べたものです。長さ0の語は ε です。"],
      ["言語 L", "Σ* の部分集合、つまり語の集合です。"],
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
      ["NFA", "次状態が複数あってよい有限オートマトンです。"],
      ["ε遷移", "入力を読まずに状態を移れます。"],
      ["受理", "可能な経路のうち1つでも受理状態へ到達すれば受理です。"],
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
