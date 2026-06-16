const elements = {
  topicSelect: document.querySelector("#topicSelect"),
  exampleSelect: document.querySelector("#exampleSelect"),
  inputValue: document.querySelector("#inputValue"),
  setAInput: document.querySelector("#setAInput"),
  setBInput: document.querySelector("#setBInput"),
  setCInput: document.querySelector("#setCInput"),
  binomialAInput: document.querySelector("#binomialAInput"),
  binomialBInput: document.querySelector("#binomialBInput"),
  binomialCInput: document.querySelector("#binomialCInput"),
  binomialAGroup: document.querySelector("#binomialAGroup"),
  binomialBGroup: document.querySelector("#binomialBGroup"),
  binomialCGroup: document.querySelector("#binomialCGroup"),
  stepBack: document.querySelector("#stepBack"),
  playPause: document.querySelector("#playPause"),
  stepForward: document.querySelector("#stepForward"),
  chapterStatus: document.querySelector("#chapterStatus"),
  topicStatus: document.querySelector("#topicStatus"),
  message: document.querySelector("#message"),
  visualTitle: document.querySelector("#visualTitle"),
  visualSubtitle: document.querySelector("#visualSubtitle"),
  visualStage: document.querySelector("#visualStage"),
  stepBadge: document.querySelector("#stepBadge"),
  formulaTitle: document.querySelector("#formulaTitle"),
  formula: document.querySelector("#formula"),
  historyList: document.querySelector("#historyList"),
};

const state = {
  topic: document.body.dataset.discreteTopic || "sets",
  example: 0,
  step: 0,
  timerId: null,
  sets: {
    A: [1, 3, 5, 7],
    B: [2, 3, 6, 7],
    C: [4, 5, 6, 7, 9],
  },
};

const TOPICS = {
  sets: {
    chapter: "基礎知識",
    title: "集合とベン図",
    subtitle: "和集合・積集合・補集合・差集合を領域で見る",
    formulaTitle: "集合演算",
    formula: "U = {1,2,3,4,5,6,7,8,9}\nA = {1,3,5,7}\nB = {2,3,6,7}\nC = {4,5,6,7,9}",
    examples: ["A∪B", "A∩B", "A-B", "A∩B∩C", "Aの補集合"],
    input: "",
  },
  relations: {
    chapter: "基礎知識",
    title: "関係",
    subtitle: "順序対の集合を矢印と0-1行列で見る",
    formulaTitle: "関係R",
    formula: "R ⊆ A×B。a∈A と b∈B の間に関係があるとき (a,b)∈R と書く。",
    examples: ["約数関係: aはbを割り切る", "3で割った余りが等しい", "差が2以下"],
    input: "",
  },
  functions: {
    chapter: "基礎知識",
    title: "関数",
    subtitle: "各入力から出る矢印の本数で関数かどうかを判定する",
    formulaTitle: "関数f",
    formula: "Aの各要素に対して、Bの要素がちょうど1つ対応するとき f:A→B は関数。",
    examples: ["関数", "関数でない", "単射", "全射", "全単射"],
    input: "",
  },
  "relations-functions": {
    chapter: "基礎知識",
    title: "関係と関数",
    subtitle: "順序対・関係行列・写像の条件",
    formulaTitle: "関係と関数",
    formula: "関係は A×B の部分集合。関数は A の各要素から B の要素へちょうど1本の矢印を持つ関係。",
    examples: [
      "関係: 約数関係: aはbを割り切る",
      "関係: 3で割った余りが等しい",
      "関係: 差が2以下",
      "関係: 逆関係",
      "関係: 合成関係",
      "関係: 合成関係の逆関係",
      "関数: 関数",
      "関数: 関数でない",
      "関数: 単射",
      "関数: 全射",
      "関数: 全単射",
      "関数: 逆関数",
      "関数: 合成関数",
      "関数: 合成関数の逆関数",
    ],
    input: "",
  },
  counting: {
    chapter: "基礎知識",
    title: "順列と組み合わせ",
    subtitle: "積の法則・順列・組み合わせ・二項係数",
    formulaTitle: "数え上げ",
    formula: "順列 nPr = n!/(n-r)!、組合せ nCr = n!/(r!(n-r)!)。",
    examples: ["積の法則", "順列 6P2", "組合せ 6C2", "二項定理"],
    input: "",
  },
  "binomial-coefficients": {
    chapter: "基礎知識",
    title: "二項係数",
    subtitle: "n乗を入力し、パスカルの三角形を順に構成する",
    formulaTitle: "二項係数",
    formula: "nCr = n!/(r!(n-r)!)。n個からr個を選ぶ組合せの数で、(a+b)^n の a^(n-r)b^r の係数にもなる。",
    examples: ["パスカルの三角形", "(a+b√c)^n"],
    input: "5",
  },
  "multinomial-theorem": {
    chapter: "基礎知識",
    title: "多項定理",
    subtitle: "k+l+m=n の組を生成し、多項係数を順に計算する",
    formulaTitle: "多項定理",
    formula: "(x1+x2+...+xm)^n = Σ n!/(k1!k2!...km!) x1^k1 x2^k2 ... xm^km。ただし k1+...+km=n。",
    examples: ["(x+y+z)^n"],
    input: "4",
  },
  logic: {
    chapter: "5章",
    title: "命題論理",
    subtitle: "真理値表で論理式の値を確かめる",
    formulaTitle: "論理式",
    formula: "¬, ∧, ∨, → を真理値表で評価する。P→Q は Pが真でQが偽のときだけ偽。",
    examples: ["p∧q", "p∨q", "p→q", "ド・モルガン"],
    input: "",
  },
  circuits: {
    chapter: "5章",
    title: "論理回路",
    subtitle: "ゲート回路・ブール代数・簡略化",
    formulaTitle: "ブール代数",
    formula: "AND, OR, NOT を組み合わせた回路は論理式として表せる。同値変形で回路を簡単にできる。",
    examples: ["XOR回路", "吸収律", "ド・モルガン回路"],
    input: "",
  },
  automata: {
    chapter: "6章",
    title: "有限オートマトン",
    subtitle: "入力を1文字ずつ読み、状態を遷移する",
    formulaTitle: "DFA",
    formula: "DFA M=(S,Σ,f,q0,F)。現在状態と入力文字から次の状態が一意に決まる。",
    examples: ["偶数個の1", "abで終わる", "aを含む"],
    input: "10110",
  },
  nfa: {
    chapter: "6章",
    title: "NFAからDFA",
    subtitle: "状態の集合をDFAの1状態として扱う",
    formulaTitle: "部分集合構成法",
    formula: "NFAの複数の可能状態を集合としてまとめ、その集合をDFAの状態にする。",
    examples: ["aまたはabを含むNFA", "ε遷移つきNFA"],
    input: "ab",
  },
  grammar: {
    chapter: "6章",
    title: "形式言語とCFG",
    subtitle: "生成規則で文字列を導出する",
    formulaTitle: "CFG",
    formula: "G=(N,Σ,P,S)。開始記号Sから生成規則を適用して言語の文字列を作る。",
    examples: ["a^n b^n", "括弧列", "回文"],
    input: "aabb",
  },
  pda: {
    chapter: "6章",
    title: "プッシュダウンオートマトン",
    subtitle: "有限状態にスタックを加えて文脈自由言語を受理する",
    formulaTitle: "PDA",
    formula: "入力を読みながらスタックへpush/popする。a^n b^n のような数の対応を記憶できる。",
    examples: ["a^n b^n", "括弧列"],
    input: "aaabbb",
  },
  turing: {
    chapter: "6章",
    title: "チューリング機械",
    subtitle: "テープ上の読み書きとヘッド移動で計算を表す",
    formulaTitle: "計算モデル",
    formula: "状態、テープ、ヘッド、遷移規則でアルゴリズムを表す。停止するかどうかが決定可能性の焦点になる。",
    examples: ["単項数に1を足す", "0と1を反転", "決定可能性の直感"],
    input: "111",
  },
};

function setMessage(text = "") {
  elements.message.textContent = text;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function factorial(n) {
  return Array.from({ length: n }, (_, i) => i + 1).reduce((acc, value) => acc * value, 1);
}

function stopTimer() {
  if (state.timerId) window.clearInterval(state.timerId);
  state.timerId = null;
  elements.playPause.textContent = "再生";
}

function getFrames() {
  const topic = state.topic;
  const example = TOPICS[topic].examples[state.example];
  if (topic === "sets") return framesForSets(example);
  if (topic === "relations") return framesForRelations(example);
  if (topic === "functions") return framesForFunctions(example);
  if (topic === "relations-functions") return framesForRelationsFunctions(example);
  if (topic === "counting") return framesForCounting(example);
  if (topic === "binomial-coefficients") return framesForBinomialCoefficients(example);
  if (topic === "multinomial-theorem") return framesForMultinomialTheorem(example);
  if (topic === "logic") return framesForLogic(example);
  if (topic === "circuits") return framesForCircuits(example);
  if (topic === "automata") return framesForAutomata(example, elements.inputValue.value);
  if (topic === "nfa") return framesForNfa(example, elements.inputValue.value);
  if (topic === "grammar") return framesForGrammar(example, elements.inputValue.value);
  if (topic === "pda") return framesForPda(example, elements.inputValue.value);
  return framesForTuring(example, elements.inputValue.value);
}

function render() {
  const topic = TOPICS[state.topic];
  if (state.topic === "sets") readSetInputs();
  updateBinomialRadicalControls();
  const frames = getFrames();
  state.step = Math.max(0, Math.min(state.step, frames.length - 1));
  const frame = frames[state.step];
  elements.chapterStatus.textContent = topic.chapter;
  elements.topicStatus.textContent = topic.title;
  elements.visualTitle.textContent = topic.title;
  elements.visualSubtitle.textContent = topic.subtitle;
  elements.formulaTitle.textContent = topic.formulaTitle;
  elements.formula.innerHTML = escapeHtml(frame.formula || topic.formula).replace(/\n/g, "<br>");
  elements.stepBadge.textContent = `Step ${state.step + 1} / ${frames.length}`;
  elements.visualStage.innerHTML = frame.html;
  elements.historyList.innerHTML = frames.map((item, index) => `<li class="${index === state.step ? "is-active" : ""}">${escapeHtml(item.note)}</li>`).join("");
}

function renderTopicOptions() {
  const topic = TOPICS[state.topic];
  elements.exampleSelect.innerHTML = topic.examples.map((label, index) => `<option value="${index}">${escapeHtml(label)}</option>`).join("");
  elements.exampleSelect.value = String(state.example);
  if (elements.inputValue) {
    elements.inputValue.value = topic.input;
    elements.inputValue.disabled = !["automata", "nfa", "grammar", "pda", "turing", "binomial-coefficients", "multinomial-theorem"].includes(state.topic);
  }
  updateBinomialRadicalControls();
}

function updateBinomialRadicalControls() {
  const show = state.topic === "binomial-coefficients" && TOPICS[state.topic].examples[state.example] === "(a+b√c)^n";
  [elements.binomialAGroup, elements.binomialBGroup, elements.binomialCGroup].filter(Boolean).forEach((group) => {
    group.hidden = !show;
  });
}

function parseSetInput(source) {
  const values = String(source || "")
    .split(/[,\s、]+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => Number.parseInt(value, 10));
  if (values.some((value) => !Number.isInteger(value) || value < 1 || value > 9)) {
    throw new Error("A, B, C には 1 から 9 の整数を入れてください。");
  }
  return [...new Set(values)].sort((a, b) => a - b);
}

function readSetInputs() {
  if (!elements.setAInput || !elements.setBInput || !elements.setCInput) return;
  try {
    [elements.setAInput, elements.setBInput, elements.setCInput].forEach((input) => input.classList.remove("invalid"));
    state.sets = {
      A: parseSetInput(elements.setAInput.value),
      B: parseSetInput(elements.setBInput.value),
      C: parseSetInput(elements.setCInput.value),
    };
    setMessage("");
  } catch (error) {
    [elements.setAInput, elements.setBInput, elements.setCInput].forEach((input) => input.classList.add("invalid"));
    setMessage(error.message);
  }
}

function setList(values) {
  return `{${values.join(",")}}`;
}

function vennSvg(active, label, members) {
  const isActive = (name) => active.includes(name);
  const chips = members.map((value) => `<span>${value}</span>`).join("");
  const elementPositions = computeVennElementPositions();
  return `
    <div class="venn-wrap">
      <svg viewBox="0 0 520 360" role="img" aria-label="${escapeHtml(label)}">
        <rect x="24" y="24" width="472" height="318" rx="10" class="venn-universe ${isActive("U") ? "is-active" : ""}" />
        <circle cx="220" cy="150" r="82" class="venn-region region-a ${isActive("A") ? "is-active" : ""}" />
        <circle cx="300" cy="150" r="82" class="venn-region region-b ${isActive("B") ? "is-active" : ""}" />
        <circle cx="260" cy="210" r="82" class="venn-region region-c ${isActive("C") ? "is-active" : ""}" />
        <text x="150" y="82" class="venn-set-label">A</text><text x="360" y="82" class="venn-set-label">B</text><text x="260" y="316" class="venn-set-label">C</text><text x="40" y="52" class="venn-set-label">U</text>
        ${elementPositions.map(({ value, x, y, fontSize }) => `<text x="${x}" y="${y}" style="font-size:${fontSize}px" class="venn-member ${members.includes(value) ? "member-on" : ""}">${value}</text>`).join("")}
      </svg>
      <div class="topic-summary-box">${label} = { ${chips || " "} }</div>
    </div>
  `;
}

function framesForSets(example) {
  const U = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const { A, B, C } = state.sets;
  const set = {
    "A∪B": [...new Set([...A, ...B])].sort(),
    "A∩B": A.filter((x) => B.includes(x)),
    "A-B": A.filter((x) => !B.includes(x)),
    "A∩B∩C": A.filter((x) => B.includes(x) && C.includes(x)),
    "Aの補集合": U.filter((x) => !A.includes(x)),
  }[example];
  const active = example === "Aの補集合" ? ["U"] : example.match(/[ABC]/g) || [];
  return [
    { note: "全体集合Uと部分集合A,B,Cを確認する", html: vennSvg(["A", "B", "C"], "U", U), formula: `U = ${setList(U)}\nA = ${setList(A)}\nB = ${setList(B)}\nC = ${setList(C)}` },
    { note: `${example} に含まれる領域だけを見る`, html: vennSvg(active, example, set) },
    { note: `要素を列挙して結果を確定する`, html: vennSvg(active, example, set), formula: `${example} = { ${set.join(", ")} }` },
  ];
}

function computeVennElementPositions() {
  const regionKeys = ["", "A", "B", "C", "AB", "AC", "BC", "ABC"];
  const grouped = Object.fromEntries(regionKeys.map((key) => [key, []]));
  Array.from({ length: 9 }, (_, index) => index + 1).forEach((value) => {
    const membership = ["A", "B", "C"].filter((name) => state.sets[name].includes(value)).join("");
    grouped[membership].push(value);
  });
  return Object.entries(grouped).flatMap(([membership, values]) => {
    const fontSize = values.length <= 3 ? 22 : values.length <= 6 ? 16 : 12;
    const slots = slotsForMembership(membership, values.length, fontSize);
    return values.map((value, index) => {
      const slot = slots[index];
      return {
        value,
        x: slot.x,
        y: slot.y,
        fontSize,
      };
    });
  }).sort((left, right) => left.value - right.value);
}

function slotsForMembership(membership, count, fontSize) {
  if (count === 0) return [];
  const preferred = {
    "": { x: 438, y: 258 },
    A: { x: 178, y: 142 },
    B: { x: 342, y: 142 },
    C: { x: 260, y: 258 },
    AB: { x: 260, y: 110 },
    AC: { x: 205, y: 206 },
    BC: { x: 315, y: 206 },
    ABC: { x: 260, y: 172 },
  }[membership];
  const step = fontSize <= 12 ? 12 : fontSize <= 16 ? 16 : 22;
  const minMarginOptions = [Math.max(4, fontSize * 0.42), 2, 0];
  for (const minMargin of minMarginOptions) {
    const candidates = [];
    for (let y = 52; y <= 278; y += step) {
      for (let x = 56; x <= 476; x += step) {
        if (pointMatchesMembership(x, y, membership, minMargin)) candidates.push({ x, y });
      }
    }
    candidates.sort((left, right) => {
      const leftDistance = (left.x - preferred.x) ** 2 + (left.y - preferred.y) ** 2;
      const rightDistance = (right.x - preferred.x) ** 2 + (right.y - preferred.y) ** 2;
      return leftDistance - rightDistance || left.y - right.y || left.x - right.x;
    });
    if (candidates.length >= count) return candidates.slice(0, count);
  }
  return Array.from({ length: count }, (_, index) => ({
    x: preferred.x + (index % 3 - 1) * step,
    y: preferred.y + (Math.floor(index / 3) - 1) * step,
  }));
}

function pointMatchesMembership(x, y, membership, minMargin) {
  const circles = {
    A: { x: 220, y: 150, r: 82 },
    B: { x: 300, y: 150, r: 82 },
    C: { x: 260, y: 210, r: 82 },
  };
  return Object.entries(circles).every(([name, circle]) => {
    const margin = circle.r - Math.hypot(x - circle.x, y - circle.y);
    return membership.includes(name) ? margin >= minMargin : margin <= -minMargin;
  });
}

function arrowDiagram(left, right, pairs, activeIndex = -1, caption = "", labels = ["A", "B"]) {
  const rowCount = Math.max(left.length, right.length);
  const nodeRadius = 24;
  const top = 84;
  const rowGap = 52;
  const height = top + (rowCount - 1) * rowGap + 52;
  const leftX = 92;
  const rightX = 388;
  const nodeY = (index) => top + index * rowGap;
  const lines = pairs.map(([a, b], index) => {
    const y1 = nodeY(left.indexOf(a));
    const y2 = nodeY(right.indexOf(b));
    return `<line x1="${leftX + nodeRadius}" y1="${y1}" x2="${rightX - nodeRadius}" y2="${y2}" class="${index === activeIndex ? "is-active" : ""}" />`;
  }).join("");
  const nodes = (values, x) => values.map((value, index) => `
    <g class="map-node" transform="translate(${x} ${nodeY(index)})">
      <circle r="${nodeRadius}" />
      <text>${escapeHtml(value)}</text>
    </g>
  `).join("");
  const activePair = pairs[activeIndex];
  const activeNote = activePair ? `赤線: いま見ている対応 (${activePair[0]}, ${activePair[1]})` : "";
  return `
    <div class="mapping-grid">
      ${caption ? `<div class="mapping-caption">${escapeHtml(caption)}</div>` : ""}
      ${activeNote ? `<div class="mapping-active-note">${escapeHtml(activeNote)}</div>` : ""}
      <svg class="mapping-svg" viewBox="0 0 480 ${height}" role="img" aria-label="集合Aから集合Bへの対応">
        <rect class="map-set-box" x="28" y="20" width="128" height="${height - 40}" rx="8" />
        <rect class="map-set-box" x="324" y="20" width="128" height="${height - 40}" rx="8" />
        <text class="map-set-label" x="${leftX}" y="43">${escapeHtml(labels[0])}</text>
        <text class="map-set-label" x="${rightX}" y="43">${escapeHtml(labels[1])}</text>
        <g class="map-arrows">${lines}</g>
        ${nodes(left, leftX)}
        ${nodes(right, rightX)}
      </svg>
    </div>
  `;
}

function relationMatrix(left, right, pairs) {
  return `<div class="logic-table-wrap"><table class="logic-table"><thead><tr><th>R</th>${right.map((b) => `<th>${b}</th>`).join("")}</tr></thead><tbody>${left.map((a) => `<tr><th>${a}</th>${right.map((b) => `<td class="${pairs.some(([x, y]) => x === a && y === b) ? "truth-true" : ""}">${pairs.some(([x, y]) => x === a && y === b) ? "1" : "0"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function pairList(pairs) {
  return pairs.map(([a, b]) => `(${a},${b})`).join(", ");
}

function inversePairs(pairs) {
  return pairs.map(([a, b]) => [b, a]);
}

function composePairs(first, second) {
  const composed = [];
  first.forEach(([a, b]) => {
    second.filter(([x]) => x === b).forEach(([, c]) => {
      if (!composed.some(([left, right]) => left === a && right === c)) composed.push([a, c]);
    });
  });
  return composed;
}

function chainDiagram(A, B, C, firstPairs, secondPairs, composedPairs = [], activeIndex = -1, caption = "", options = {}) {
  const rowCount = Math.max(A.length, B.length, C.length);
  const nodeRadius = 22;
  const top = 82;
  const rowGap = 52;
  const height = top + (rowCount - 1) * rowGap + 56;
  const xs = { A: 70, B: 240, C: 410 };
  const nodeY = (values, value) => top + values.indexOf(value) * rowGap;
  const nodes = (values, x, label, className = "") => `
    <g class="${className}">
    <rect class="map-set-box" x="${x - 48}" y="20" width="96" height="${height - 40}" rx="8" />
    <text class="map-set-label" x="${x}" y="43">${label}</text>
    ${values.map((value, index) => `
      <g class="map-node" transform="translate(${x} ${top + index * rowGap})">
        <circle r="${nodeRadius}" />
        <text>${escapeHtml(value)}</text>
      </g>
    `).join("")}
    </g>
  `;
  const firstLines = firstPairs.map(([a, b]) => `<line x1="${xs.A + nodeRadius}" y1="${nodeY(A, a)}" x2="${xs.B - nodeRadius}" y2="${nodeY(B, b)}" />`).join("");
  const secondLines = secondPairs.map(([b, c]) => `<line x1="${xs.B + nodeRadius}" y1="${nodeY(B, b)}" x2="${xs.C - nodeRadius}" y2="${nodeY(C, c)}" />`).join("");
  const composedLines = composedPairs.map(([a, c], index) => {
    const className = index === activeIndex ? "is-active is-composed" : "is-composed";
    return `<path d="M ${xs.A + nodeRadius} ${nodeY(A, a)} C 170 ${nodeY(A, a) - 42}, 310 ${nodeY(C, c) - 42}, ${xs.C - nodeRadius} ${nodeY(C, c)}" class="${className}" />`;
  }).join("");
  const activePair = composedPairs[activeIndex];
  const activeNote = activePair
    ? `${options.resultOverlay ? "点線" : "赤線"}: 合成で得た対応 (${activePair[0]}, ${activePair[1]})`
    : "";
  return `
    <div class="mapping-grid">
      ${caption ? `<div class="mapping-caption">${escapeHtml(caption)}</div>` : ""}
      ${activeNote ? `<div class="mapping-active-note">${escapeHtml(activeNote)}</div>` : ""}
      <svg class="mapping-svg mapping-svg-wide" viewBox="0 0 480 ${height}" role="img" aria-label="3つの集合の合成">
        <g class="map-arrows">${firstLines}</g>
        <g class="map-arrows map-arrows-secondary">${secondLines}</g>
        ${options.resultOverlay ? "" : `<g class="map-arrows">${composedLines}</g>`}
        ${nodes(A, xs.A, "A")}
        ${nodes(B, xs.B, "B", options.fadeMiddle ? "map-set-faded" : "")}
        ${nodes(C, xs.C, "C")}
        ${options.resultOverlay ? `<g class="map-arrows map-arrows-overlay">${composedLines}</g>` : ""}
      </svg>
    </div>
  `;
}

function framesForRelations(example) {
  const A = [2, 3, 5, 6];
  const B = [1, 3, 4, 6, 8];
  const isDivisorRelation = example.startsWith("約数関係");
  const condition = isDivisorRelation
    ? "条件: Aの要素aがBの要素bを割り切る（例: 2→4, 2→6, 3→3）"
    : example === "3で割った余りが等しい"
      ? "条件: a∈A, b∈B, aとbを3で割った余りが等しい"
      : "条件: a∈A, b∈B, |a-b|≦2";
  const pairs = isDivisorRelation
    ? A.flatMap((a) => B.filter((b) => b % a === 0).map((b) => [a, b]))
    : example === "3で割った余りが等しい"
      ? A.flatMap((a) => B.filter((b) => a % 3 === b % 3).map((b) => [a, b]))
      : A.flatMap((a) => B.filter((b) => Math.abs(a - b) <= 2).map((b) => [a, b]));
  const pairFrames = pairs.map((pair, index) => ({
    note: isDivisorRelation
      ? `Aの${pair[0]}はBの${pair[1]}を割り切るので (${pair[0]},${pair[1]}) を追加`
      : `条件を満たす (${pair[0]},${pair[1]}) を追加`,
    html: arrowDiagram(A, B, pairs.slice(0, index + 1), index, condition),
  }));
  return [
    ...pairFrames,
    { note: "同じ関係を0-1行列で表す", html: relationMatrix(A, B, pairs), formula: `${condition}\nR = { ${pairs.map(([a, b]) => `(${a},${b})`).join(", ")} }` },
  ];
}

function framesForFunctions(example) {
  const examples = {
    "関数": {
      A: ["p", "q", "r"],
      B: [2, 4, 6],
      pairs: [["p", 2], ["q", 4], ["r", 4]],
    },
    "関数でない": {
      A: ["p", "q", "r"],
      B: [2, 4, 6],
      pairs: [["p", 2], ["p", 4], ["q", 4], ["r", 6]],
    },
    "単射": {
      A: ["p", "q", "r"],
      B: [2, 4, 6, 8],
      pairs: [["p", 2], ["q", 4], ["r", 6]],
    },
    "全射": {
      A: ["p", "q", "r", "s"],
      B: [2, 4, 6],
      pairs: [["p", 2], ["q", 4], ["r", 6], ["s", 6]],
    },
    "全単射": {
      A: ["p", "q", "r"],
      B: [2, 4, 6],
      pairs: [["p", 2], ["q", 4], ["r", 6]],
    },
  };
  const { A, B, pairs } = examples[example];
  const verdict = example === "関数でない"
    ? "pから矢印が2本出るので関数ではない"
    : example === "単射"
      ? "異なる入力が同じ出力に届かないので単射。ただし8には届かないので全射ではない"
    : example === "全射"
      ? "Bのすべての要素に少なくとも1本の矢印が届くので全射"
      : example === "全単射"
        ? "一対一で、Bのすべての要素に届くので全単射"
      : `${example}の条件を満たす`;
  return [
    { note: "入力集合Aの各要素を見る", html: arrowDiagram(A, B, pairs.slice(0, 1), 0) },
    { note: "すべての対応を矢印で表示する", html: arrowDiagram(A, B, pairs, pairs.length - 1) },
    { note: verdict, html: `<div class="verdict ${example === "関数でない" ? "is-false" : "is-true"}">${verdict}</div>${arrowDiagram(A, B, pairs)}` },
  ];
}

function framesForInverseRelation() {
  const A = ["a", "b", "c"];
  const B = [1, 2, 3];
  const R = [["a", 1], ["a", 2], ["b", 2], ["c", 3]];
  const inverse = inversePairs(R);
  return [
    { note: "元の関係 R を A から B への矢印で見る", html: arrowDiagram(A, B, R, -1, `R = { ${pairList(R)} }`, ["A", "B"]) },
    { note: "順序対の左右を入れ替える", html: arrowDiagram(B, A, inverse.slice(0, 1), 0, "逆関係 R^-1 は (a,b) を (b,a) に入れ替えた関係", ["B", "A"]), formula: `R^-1 = { ${pairList(inverse)} }` },
    { note: "すべての矢印を逆向きにしたものが逆関係", html: arrowDiagram(B, A, inverse, inverse.length - 1, `R^-1 = { ${pairList(inverse)} }`, ["B", "A"]), formula: `R = { ${pairList(R)} }\nR^-1 = { ${pairList(inverse)} }` },
  ];
}

function framesForInverseFunction() {
  const A = ["p", "q", "r"];
  const B = [2, 4, 6];
  const f = [["p", 2], ["q", 4], ["r", 6]];
  const inverse = inversePairs(f);
  return [
    { note: "f は全単射なので逆関数を持つ", html: arrowDiagram(A, B, f, -1, "f:A→B は一対一で、Bの全要素に届く", ["A", "B"]) },
    { note: "矢印を逆にしても各入力から1本だけ出る", html: arrowDiagram(B, A, inverse, inverse.length - 1, "f^-1:B→A は f の対応を逆向きにした関数", ["B", "A"]), formula: `f = { ${pairList(f)} }\nf^-1 = { ${pairList(inverse)} }` },
    { note: "f^-1 は B の各要素を元の A の要素へ戻す", html: `<div class="verdict is-true">逆関数 f^-1 が定義できる</div>${arrowDiagram(B, A, inverse, -1, "", ["B", "A"])}` },
  ];
}

function framesForCompositeRelation(inverse = false) {
  const A = [1, 2, 3];
  const B = ["x", "y"];
  const C = ["u", "v", "w"];
  const R = [[1, "x"], [1, "y"], [2, "y"], [3, "x"]];
  const S = [["x", "u"], ["x", "v"], ["y", "v"], ["y", "w"]];
  const composed = composePairs(R, S);
  const inverseComposed = inversePairs(composed);
  if (inverse) {
    return [
      { note: "まず A→B→C の合成関係 S∘R を作る", html: chainDiagram(A, B, C, R, S, composed, composed.length - 1, "S∘R: aRb かつ bSc となる b があるとき a(S∘R)c", { fadeMiddle: true, resultOverlay: true }), formula: `S∘R = { ${pairList(composed)} }` },
      { note: "合成関係の順序対を左右入れ替える", html: arrowDiagram(C, A, inverseComposed.slice(0, 1), 0, "(S∘R)^-1 は C から A への逆関係", ["C", "A"]) },
      { note: "合成関係の逆関係を表示する", html: arrowDiagram(C, A, inverseComposed, inverseComposed.length - 1, `(S∘R)^-1 = { ${pairList(inverseComposed)} }`, ["C", "A"]), formula: `(S∘R)^-1 = { ${pairList(inverseComposed)} }` },
    ];
  }
  return [
    { note: "R は A から B への関係", html: chainDiagram(A, B, C, R, [], [], -1, `R = { ${pairList(R)} }`) },
    { note: "S は B から C への関係", html: chainDiagram(A, B, C, R, S, [], -1, `S = { ${pairList(S)} }`) },
    ...composed.map((pair, index) => ({
      note: `Aの${pair[0]}からCの${pair[1]}へ到達できるので (${pair[0]},${pair[1]}) を追加`,
      html: chainDiagram(A, B, C, R, S, composed.slice(0, index + 1), index, "青: R、緑: S、赤: 合成関係 S∘R"),
    })),
    {
      note: "集合Bを経由点として薄くし、合成関係 S∘R をAからCへの点線で表す",
      html: `${chainDiagram(A, B, C, R, S, composed, composed.length - 1, "点線: 合成関係 S∘R の結果", { fadeMiddle: true, resultOverlay: true })}${relationMatrix(A, C, composed)}`,
      formula: `S∘R = { ${pairList(composed)} }`,
    },
  ];
}

function framesForCompositeFunction(inverse = false) {
  const A = ["p", "q", "r"];
  const B = [2, 4, 6];
  const C = ["U", "V", "W"];
  const f = [["p", 2], ["q", 4], ["r", 6]];
  const g = [[2, "U"], [4, "V"], [6, "W"]];
  const composed = composePairs(f, g);
  const inverseComposed = inversePairs(composed);
  if (inverse) {
    return [
      { note: "合成関数 g∘f を作る", html: chainDiagram(A, B, C, f, g, composed, composed.length - 1, "g∘f:A→C", { fadeMiddle: true, resultOverlay: true }) },
      { note: "全単射の合成なので逆関数を持つ", html: arrowDiagram(C, A, inverseComposed, inverseComposed.length - 1, "(g∘f)^-1:C→A", ["C", "A"]), formula: `(g∘f)^-1 = { ${pairList(inverseComposed)} }` },
      { note: "逆関数は C の各要素を元の A の要素へ戻す", html: `<div class="verdict is-true">合成関数の逆関数が定義できる</div>${arrowDiagram(C, A, inverseComposed, -1, "", ["C", "A"])}` },
    ];
  }
  return [
    { note: "f は A から B への関数", html: chainDiagram(A, B, C, f, [], [], -1, `f = { ${pairList(f)} }`) },
    { note: "g は B から C への関数", html: chainDiagram(A, B, C, f, g, [], -1, `g = { ${pairList(g)} }`) },
    ...composed.map((pair, index) => ({
      note: `g(f(${pair[0]})) = ${pair[1]} なので (${pair[0]},${pair[1]}) を追加`,
      html: chainDiagram(A, B, C, f, g, composed.slice(0, index + 1), index, "青: f、緑: g、赤: 合成関数 g∘f"),
    })),
    {
      note: "集合Bを経由点として薄くし、合成関数 g∘f をAからCへの点線で表す",
      html: `<div class="verdict is-true">g∘f は関数</div>${chainDiagram(A, B, C, f, g, composed, composed.length - 1, "点線: 合成関数 g∘f の結果", { fadeMiddle: true, resultOverlay: true })}`,
      formula: `g∘f = { ${pairList(composed)} }`,
    },
  ];
}

function framesForRelationsFunctions(example) {
  if (example === "関係: 逆関係") return framesForInverseRelation();
  if (example === "関係: 合成関係") return framesForCompositeRelation(false);
  if (example === "関係: 合成関係の逆関係") return framesForCompositeRelation(true);
  if (example === "関数: 逆関数") return framesForInverseFunction();
  if (example === "関数: 合成関数") return framesForCompositeFunction(false);
  if (example === "関数: 合成関数の逆関数") return framesForCompositeFunction(true);
  if (example.startsWith("関係: ")) {
    return framesForRelations(example.replace("関係: ", ""));
  }
  return framesForFunctions(example.replace("関数: ", ""));
}

function framesForCounting(example) {
  if (example === "積の法則") {
    return [
      { note: "主菜が2通りある", html: choiceGrid(["カレー", "パスタ"], []) },
      { note: "飲み物が3通りあるので枝が分かれる", html: choiceGrid(["カレー", "パスタ"], ["水", "茶", "ジュース"]) },
      { note: "合計は 2×3=6 通り", html: `<div class="count-result">2 × 3 = 6</div>${choiceGrid(["カレー", "パスタ"], ["水", "茶", "ジュース"])}` },
    ];
  }
  if (example === "順列 6P2") {
    return countFormulaFrames("6P2", "6個から順に2個選んで並べる", ["1番目: 6通り", "2番目: 5通り"], 6 * 5);
  }
  if (example === "組合せ 6C2") {
    return countFormulaFrames("6C2", "並び順を区別しないので 2! で割る", ["まず 6P2 = 30", "同じ組を 2! = 2 回数えている", "30 / 2 = 15"], 15);
  }
  return countFormulaFrames("(a+b)^4", "係数は二項係数で並ぶ", ["1", "4", "6", "4", "1"], 16);
}

function choiceGrid(first, second) {
  const rows = first.flatMap((a) => second.length ? second.map((b) => `${a}-${b}`) : [a]);
  return `<div class="choice-grid">${rows.map((item) => `<span>${item}</span>`).join("")}</div>`;
}

function countFormulaFrames(label, intro, pieces, answer) {
  return [
    { note: intro, html: `<div class="count-result">${label}</div>` },
    { note: "積の法則で段階ごとに掛ける", html: `<div class="choice-grid">${pieces.map((p) => `<span>${p}</span>`).join("")}</div>` },
    { note: `答えは ${answer}`, html: `<div class="count-result">${label} = ${answer}</div>` },
  ];
}

function combination(n, r) {
  if (r < 0 || r > n) return 0;
  return factorial(n) / (factorial(r) * factorial(n - r));
}

function binomialRow(n, activeIndex = -1) {
  const cells = Array.from({ length: n + 1 }, (_, r) => {
    const active = r === activeIndex ? " is-active" : "";
    return `<span class="${active}">${combination(n, r)}</span>`;
  }).join("");
  return `<div class="coefficient-row">${cells}</div>`;
}

function pascalTriangle(rows, activeRow = -1) {
  const html = Array.from({ length: rows + 1 }, (_, n) => {
    const cells = Array.from({ length: n + 1 }, (_, r) => `<span>${combination(n, r)}</span>`).join("");
    return `<div class="pascal-row ${n === activeRow ? "is-active" : ""}">${cells}</div>`;
  }).join("");
  return `<div class="pascal-triangle">${html}</div>`;
}

function termList(terms, activeIndex = -1) {
  return `<div class="term-list">${terms.map((term, index) => `<span class="${index === activeIndex ? "is-active" : ""}">${term}</span>`).join("")}</div>`;
}

function readPowerInput(defaultValue, maxValue = 8) {
  if (!elements.inputValue) return defaultValue;
  const raw = Number(elements.inputValue.value);
  const valid = Number.isInteger(raw) && raw >= 0 && raw <= maxValue;
  elements.inputValue.classList.toggle("invalid", !valid);
  setMessage(valid ? "" : `n は 0 から ${maxValue} までの整数で入力してください。`);
  return valid ? raw : defaultValue;
}

function readIntegerInput(input, label, defaultValue, { min = -20, max = 20 } = {}) {
  if (!input) return defaultValue;
  const raw = Number(input.value);
  const valid = Number.isInteger(raw) && raw >= min && raw <= max;
  input.classList.toggle("invalid", !valid);
  if (!valid) setMessage(`${label} は ${min} から ${max} までの整数で入力してください。`);
  return valid ? raw : defaultValue;
}

function readBinomialRadicalInputs() {
  const a = readIntegerInput(elements.binomialAInput, "a", 1);
  const b = readIntegerInput(elements.binomialBInput, "b", 1);
  const c = readIntegerInput(elements.binomialCInput, "c", 2, { min: 0, max: 50 });
  return { a, b, c };
}

function binomialTerms(n) {
  return Array.from({ length: n + 1 }, (_, r) => {
    const coefficient = combination(n, r);
    const aPower = n - r;
    const bPower = r;
    const factors = [
      aPower === 0 ? "" : aPower === 1 ? "a" : `a^${aPower}`,
      bPower === 0 ? "" : bPower === 1 ? "b" : `b^${bPower}`,
    ].filter(Boolean).join("");
    return `${coefficient === 1 && factors ? "" : coefficient}${factors || "1"}`;
  });
}

function radicalTermContribution(n, r, a, b, c) {
  if (c === 0 && r > 0) return { integer: 0, radical: 0 };
  const coefficient = combination(n, r) * (a ** (n - r)) * (b ** r);
  if (r % 2 === 0) {
    return { integer: coefficient * (c ** (r / 2)), radical: 0 };
  }
  return { integer: 0, radical: coefficient * (c ** ((r - 1) / 2)) };
}

function formatSignedTerm(value, unit = "") {
  if (value === 0) return "";
  const sign = value > 0 ? "+" : "-";
  const abs = Math.abs(value);
  return `${sign} ${abs}${unit}`;
}

function formatRadicalResult(integerPart, radicalPart, c) {
  if (radicalPart === 0) return String(integerPart);
  if (integerPart === 0) {
    const sign = radicalPart < 0 ? "-" : "";
    return `${sign}${Math.abs(radicalPart)}√${c}`;
  }
  return `${integerPart} ${formatSignedTerm(radicalPart, `√${c}`)}`;
}

function formatRadicalBase(a, b, c) {
  if (b === 0) return String(a);
  const radical = `${Math.abs(b)}√${c}`;
  if (a === 0) return b < 0 ? `-${radical}` : radical;
  return `${a} ${b > 0 ? "+" : "-"} ${radical}`;
}

function pascalTriangleBuild(rows, activeRow = -1, activeCol = -1) {
  const html = Array.from({ length: rows + 1 }, (_, n) => {
    const cells = Array.from({ length: n + 1 }, (_, r) => {
      const active = n === activeRow && r === activeCol ? " is-active" : "";
      const edge = r === 0 || r === n ? " is-edge" : "";
      return `<span class="${active}${edge}">${combination(n, r)}</span>`;
    }).join("");
    return `<div class="pascal-row ${n === activeRow ? "is-active-row" : ""}">${cells}</div>`;
  }).join("");
  return `<div class="pascal-triangle">${html}</div>`;
}

function framesForBinomialCoefficients() {
  const n = readPowerInput(5);
  const example = TOPICS[state.topic].examples[state.example];
  if (example === "(a+b√c)^n") return framesForBinomialRadicalPower(n);
  const frames = [
    {
      note: "0段目を置く",
      html: pascalTriangleBuild(0, 0, 0),
      formula: "(a+b)^0 = 1",
    },
  ];
  for (let row = 1; row <= n; row += 1) {
    frames.push({
      note: `${row}段目の左端に 1 を置く`,
      html: pascalTriangleBuild(row, row, 0),
      formula: `${row}C0 = 1`,
    });
    for (let col = 1; col < row; col += 1) {
      const left = combination(row - 1, col - 1);
      const right = combination(row - 1, col);
      frames.push({
        note: `${row}段目 ${col}番目は上の2つを足す`,
        html: pascalTriangleBuild(row, row, col),
        formula: `${row}C${col} = ${row - 1}C${col - 1} + ${row - 1}C${col} = ${left} + ${right} = ${left + right}`,
      });
    }
    if (row > 0) {
      frames.push({
        note: `${row}段目の右端に 1 を置く`,
        html: pascalTriangleBuild(row, row, row),
        formula: `${row}C${row} = 1`,
      });
    }
  }
  frames.push({
    note: `${n}段目を (a+b)^${n} の係数として読む`,
    html: `${pascalTriangleBuild(n, n)}<div class="coefficient-caption">係数: ${Array.from({ length: n + 1 }, (_, r) => combination(n, r)).join(", ")}</div>${termList(binomialTerms(n))}`,
    formula: `(a+b)^${n} = ${binomialTerms(n).join(" + ")}`,
  });
  return frames;
}

function framesForBinomialRadicalPower(n) {
  const { a, b, c } = readBinomialRadicalInputs();
  const base = formatRadicalBase(a, b, c);
  const terms = Array.from({ length: n + 1 }, (_, r) => radicalTermContribution(n, r, a, b, c));
  const frames = [
    {
      note: `${n}段目のパスカル係数を使う`,
      html: `${pascalTriangleBuild(n, n)}<div class="coefficient-caption">係数: ${Array.from({ length: n + 1 }, (_, r) => combination(n, r)).join(", ")}</div>`,
      formula: `(${base})^${n} = Σ ${n}Cr ${a}^(n-r) (${b}√${c})^r`,
    },
  ];
  let integerPart = 0;
  let radicalPart = 0;
  terms.forEach((term, r) => {
    integerPart += term.integer;
    radicalPart += term.radical;
    const coefficient = combination(n, r);
    const source = `${coefficient} × ${a}^${n - r} × ${b}^${r} × (√${c})^${r}`;
    const reduced = term.radical ? `${term.radical}√${c}` : String(term.integer);
    frames.push({
      note: `r=${r} の項を計算して加える`,
      html: `
        ${pascalTriangleBuild(n, n, r)}
        <div class="radical-power-grid">
          <span><strong>項</strong>${source}</span>
          <span><strong>整理</strong>${reduced}</span>
          <span><strong>途中結果</strong>${formatRadicalResult(integerPart, radicalPart, c)}</span>
        </div>
      `,
      formula: `r=${r}: ${source} = ${reduced}`,
    });
  });
  frames.push({
    note: "整数部分と √c の係数をまとめる",
    html: `
      ${pascalTriangleBuild(n, n)}
      <div class="count-result">${formatRadicalResult(integerPart, radicalPart, c)}</div>
    `,
    formula: `(${base})^${n} = ${formatRadicalResult(integerPart, radicalPart, c)}`,
  });
  return frames;
}

function multinomialCoefficient(parts) {
  const total = parts.reduce((sum, value) => sum + value, 0);
  return factorial(total) / parts.reduce((product, value) => product * factorial(value), 1);
}

function compositions(total, count) {
  if (count === 1) return [[total]];
  return Array.from({ length: total + 1 }, (_, index) => total - index)
    .flatMap((value) => compositions(total - value, count - 1).map((rest) => [value, ...rest]));
}

function multinomialTerm(parts, variables = ["x", "y", "z"]) {
  const coefficient = multinomialCoefficient(parts);
  const factors = parts.map((power, index) => {
    if (power === 0) return "";
    return power === 1 ? variables[index] : `${variables[index]}^${power}`;
  }).filter(Boolean).join("");
  return `${coefficient === 1 ? "" : coefficient}${factors || "1"}`;
}

function multinomialGrid(partsList, activeIndex = -1) {
  return `<div class="multinomial-grid">${partsList.map((parts, index) => `<span class="${index === activeIndex ? "is-active" : ""}"><strong>(${parts.join(",")})</strong><em class="math-text">${multinomialTerm(parts)}</em></span>`).join("")}</div>`;
}

function multinomialProgress(partsList, activeIndex = -1) {
  const generated = partsList.slice(0, activeIndex + 1);
  const remaining = Math.max(0, partsList.length - generated.length);
  return `
    <div class="multinomial-progress">
      <div class="topic-summary-box">生成済み ${generated.length} / ${partsList.length} 組${remaining ? `、残り ${remaining} 組` : ""}</div>
      ${multinomialGrid(generated, activeIndex)}
    </div>
  `;
}

function framesForMultinomialTheorem() {
  const n = readPowerInput(4);
  const partsList = compositions(n, 3);
  const frames = [
    {
      note: `k+l+m=${n} となる指数の組を準備する`,
      html: `<div class="count-result">k + l + m = ${n}</div>`,
      formula: `(x+y+z)^${n} の各項は x^k y^l z^m`,
    },
  ];
  partsList.forEach((parts, index) => {
    const [k, l, m] = parts;
    const coefficient = multinomialCoefficient(parts);
    frames.push({
      note: `(${k},${l},${m}) を生成して係数を計算する`,
      html: multinomialProgress(partsList, index),
      formula: `係数 = ${n}!/(${k}!${l}!${m}!) = ${coefficient}、項 = ${multinomialTerm(parts)}`,
    });
  });
  frames.push({
    note: "生成した項をすべて足して展開式にする",
    html: termList(partsList.map((parts) => multinomialTerm(parts))),
    formula: `(x+y+z)^${n} = ${partsList.map((parts) => multinomialTerm(parts)).join(" + ")}`,
  });
  return frames;
}

function framesForLogic(example) {
  const rows = [[false, false], [false, true], [true, false], [true, true]];
  const evals = {
    "p∧q": (p, q) => p && q,
    "p∨q": (p, q) => p || q,
    "p→q": (p, q) => !p || q,
    "ド・モルガン": (p, q) => !(p && q) === (!p || !q),
  };
  return rows.map((row, index) => ({
    note: `p=${tf(row[0])}, q=${tf(row[1])} を評価する`,
    html: truthTable(rows, evals[example], example, index),
    formula: example === "ド・モルガン" ? "¬(p∧q) ≡ ¬p∨¬q" : example,
  }));
}

function tf(value) {
  return value ? "T" : "F";
}

function truthTable(rows, fn, label, active) {
  return `<div class="logic-table-wrap"><table class="logic-table"><thead><tr><th>p</th><th>q</th><th>${label}</th></tr></thead><tbody>${rows.map(([p, q], index) => `<tr class="${index === active ? "is-active" : ""}"><td>${tf(p)}</td><td>${tf(q)}</td><td class="${fn(p, q) ? "truth-true" : "truth-false"}">${tf(fn(p, q))}</td></tr>`).join("")}</tbody></table></div>`;
}

function framesForCircuits(example) {
  const formulas = {
    "XOR回路": ["(A∧¬B)∨(¬A∧B)", "入力が異なるときだけ1", "XOR"],
    "吸収律": ["A∨(A∧B)", "Aでくくる: A∨(A∧B)=A", "A"],
    "ド・モルガン回路": ["¬(A∧B)", "ANDの後にNOT", "¬A∨¬B"],
  }[example];
  return formulas.map((formula, index) => ({
    note: index === 0 ? "回路を論理式に読む" : index === 1 ? "ブール代数で同値変形する" : "簡略化された回路にする",
    html: circuitSvg(example, index),
    formula,
  }));
}

function circuitSvg(example, stage) {
  return `
    <svg class="circuit-svg" viewBox="0 0 620 280" role="img" aria-label="${escapeHtml(example)}">
      <text x="38" y="84">A</text><text x="38" y="190">B</text>
      <line x1="70" y1="80" x2="190" y2="80" /><line x1="70" y1="190" x2="190" y2="190" />
      <rect x="190" y="42" width="120" height="86" rx="12" class="gate ${stage >= 0 ? "is-active" : ""}" /><text x="226" y="94">${example === "吸収律" ? "AND" : "NOT/AND"}</text>
      <rect x="360" y="94" width="130" height="92" rx="12" class="gate ${stage >= 1 ? "is-active" : ""}" /><text x="405" y="148">${stage >= 2 ? "SIMPLE" : "OR"}</text>
      <line x1="310" y1="85" x2="360" y2="120" /><line x1="310" y1="190" x2="360" y2="160" /><line x1="490" y1="140" x2="570" y2="140" />
      <text x="582" y="146">X</text>
    </svg>
  `;
}

function dfaForExample(example) {
  if (example === "abで終わる") {
    return { states: ["q0", "q1", "q2"], accept: ["q2"], start: "q0", transition: { q0: { a: "q1", b: "q0" }, q1: { a: "q1", b: "q2" }, q2: { a: "q1", b: "q0" } } };
  }
  if (example === "aを含む") {
    return { states: ["q0", "q1"], accept: ["q1"], start: "q0", transition: { q0: { a: "q1", b: "q0", 0: "q0", 1: "q0" }, q1: { a: "q1", b: "q1", 0: "q1", 1: "q1" } } };
  }
  return { states: ["even", "odd"], accept: ["even"], start: "even", transition: { even: { 0: "even", 1: "odd" }, odd: { 0: "odd", 1: "even" } } };
}

function framesForAutomata(example, input) {
  const machine = dfaForExample(example);
  const chars = input.split("");
  let current = machine.start;
  const frames = [{ note: `初期状態 ${current}`, html: automataSvg(machine, current, chars, -1) }];
  chars.forEach((char, index) => {
    current = machine.transition[current]?.[char] || current;
    frames.push({ note: `${char} を読んで ${current} へ遷移`, html: automataSvg(machine, current, chars, index) });
  });
  frames.push({ note: machine.accept.includes(current) ? "受理状態で停止する" : "受理状態ではないので受理しない", html: `<div class="verdict ${machine.accept.includes(current) ? "is-true" : "is-false"}">${machine.accept.includes(current) ? "受理" : "不受理"}</div>${automataSvg(machine, current, chars, chars.length - 1)}` });
  return frames;
}

function automataSvg(machine, current, chars, activeIndex) {
  const stateNodes = machine.states.map((name, index) => {
    const x = 140 + index * 170;
    const accept = machine.accept.includes(name) ? `<circle cx="${x}" cy="120" r="44" class="state-inner" />` : "";
    return `${accept}<circle cx="${x}" cy="120" r="54" class="state ${current === name ? "is-active" : ""}" /><text x="${x}" y="128">${name}</text>`;
  }).join("");
  const tape = chars.map((char, index) => `<span class="${index === activeIndex ? "is-active" : ""}">${char}</span>`).join("");
  return `<div><svg class="automata-svg" viewBox="0 0 660 250">${stateNodes}<path d="M70 120 L86 120" class="transition" /><text x="42" y="112">start</text><path d="M200 92 C260 40 330 40 390 92" class="transition" /><path d="M390 148 C330 205 260 205 200 148" class="transition" /><text x="294" y="50">input</text></svg><div class="tape-row">${tape}</div></div>`;
}

function framesForNfa(example, input) {
  const chars = input.split("");
  let states = ["q0"];
  const frames = [{ note: "NFAの現在状態集合をDFAの1状態にする", html: subsetView(states, chars, -1) }];
  chars.forEach((char, index) => {
    states = char === "a" ? [...new Set([...states, "q1"])] : states.includes("q1") ? ["q0", "q2"] : ["q0"];
    frames.push({ note: `${char} を読んだ後の可能状態集合を計算`, html: subsetView(states, chars, index) });
  });
  frames.push({ note: "得られた状態集合をDFAの状態名として使う", html: subsetView(states, chars, chars.length - 1, true) });
  return frames;
}

function subsetView(states, chars, activeIndex, final = false) {
  return `<div class="subset-view"><div class="set-state">{ ${states.join(", ")} }</div><div class="tape-row">${chars.map((c, i) => `<span class="${i === activeIndex ? "is-active" : ""}">${c}</span>`).join("")}</div><div class="topic-summary-box">${final ? "DFAの1状態として登録" : "可能状態の集合"}</div></div>`;
}

function framesForGrammar(example, input) {
  const target = input || "aabb";
  const derivations = example === "括弧列" ? ["S", "(S)", "(())"] : example === "回文" ? ["S", "aSa", "abSba", "abba"] : ["S", "aSb", "aaSbb", "aabb"];
  return derivations.map((text, index) => ({
    note: index === 0 ? "開始記号Sから始める" : "生成規則を1回適用する",
    html: `<div class="derivation"><span>${derivations.slice(0, index + 1).join(" ⇒ ")}</span></div>`,
    formula: index === derivations.length - 1 ? `生成された文字列: ${target}` : "S → aSb | ε",
  }));
}

function framesForPda(example, input) {
  const chars = (input || "aaabbb").split("");
  const stack = ["Z"];
  const frames = [{ note: "底記号Zだけを持つスタックから開始", html: stackView(chars, -1, stack) }];
  chars.forEach((char, index) => {
    if (char === "a" || char === "(") stack.push(char);
    if ((char === "b" || char === ")") && stack.length > 1) stack.pop();
    frames.push({ note: `${char} を読み、スタックを${char === "a" || char === "(" ? "push" : "pop"}する`, html: stackView(chars, index, stack) });
  });
  frames.push({ note: stack.length === 1 ? "入力を読み終え、スタックが空なので受理" : "対応が残るので不受理", html: `<div class="verdict ${stack.length === 1 ? "is-true" : "is-false"}">${stack.length === 1 ? "受理" : "不受理"}</div>${stackView(chars, chars.length - 1, stack)}` });
  return frames;
}

function stackView(chars, activeIndex, stack) {
  return `<div class="stack-layout"><div class="tape-row">${chars.map((c, i) => `<span class="${i === activeIndex ? "is-active" : ""}">${escapeHtml(c)}</span>`).join("")}</div><div class="stack-box">${[...stack].reverse().map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></div>`;
}

function framesForTuring(example, input) {
  if (example === "決定可能性の直感") {
    return [
      { note: "入力に対して停止して答える機械は決定器", html: decidabilityGrid(0), formula: "すべての入力で停止すれば決定可能" },
      { note: "停止しない可能性があると判定できない場合がある", html: decidabilityGrid(1), formula: "停止性問題は一般には決定不能" },
    ];
  }
  const tape = ["B", ...(input || "111").split(""), "B"];
  return tape.map((_, index) => {
    const next = [...tape];
    if (example === "0と1を反転" && next[index] === "0") next[index] = "1";
    else if (example === "0と1を反転" && next[index] === "1") next[index] = "0";
    else if (example === "単項数に1を足す" && index === tape.length - 1) next.splice(index, 0, "1");
    return { note: `ヘッド位置 ${index} を読む`, html: turingTape(next, index), formula: "読む → 書く → 左右に動く → 状態を変える" };
  });
}

function turingTape(tape, head) {
  return `<div class="turing-wrap"><div class="tape-row turing-tape">${tape.map((c, i) => `<span class="${i === head ? "is-active" : ""}">${c}</span>`).join("")}</div><div class="head-pointer" style="--head:${head}">q</div></div>`;
}

function decidabilityGrid(active) {
  return `<div class="decidable-grid">${["yes", "no", "loop", "halt"].map((item, index) => `<span class="${index === active + 1 ? "is-active" : ""}">${item}</span>`).join("")}</div>`;
}

function changeStep(delta) {
  stopTimer();
  const frames = getFrames();
  state.step = (state.step + delta + frames.length) % frames.length;
  render();
}

if (elements.topicSelect) {
  elements.topicSelect.addEventListener("change", () => {
    stopTimer();
    state.topic = elements.topicSelect.value;
    state.example = 0;
    state.step = 0;
    renderTopicOptions();
    render();
  });
}

elements.exampleSelect.addEventListener("change", () => {
  stopTimer();
  state.example = Number(elements.exampleSelect.value);
  state.step = 0;
  render();
});

if (elements.inputValue) {
  elements.inputValue.addEventListener("input", () => {
    stopTimer();
    state.step = 0;
    render();
  });
}

[elements.setAInput, elements.setBInput, elements.setCInput, elements.binomialAInput, elements.binomialBInput, elements.binomialCInput].filter(Boolean).forEach((input) => {
  input.addEventListener("input", () => {
    stopTimer();
    state.step = 0;
    render();
  });
});

elements.stepBack.addEventListener("click", () => changeStep(-1));
elements.stepForward.addEventListener("click", () => changeStep(1));
elements.playPause.addEventListener("click", () => {
  if (state.timerId) {
    stopTimer();
    return;
  }
  elements.playPause.textContent = "停止";
  state.timerId = window.setInterval(() => {
    const frames = getFrames();
    if (state.step >= frames.length - 1) {
      stopTimer();
      return;
    }
    state.step += 1;
    render();
  }, 950);
});

renderTopicOptions();
render();
