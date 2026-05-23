const elements = {
  topicSelect: document.querySelector("#topicSelect"),
  exampleSelect: document.querySelector("#exampleSelect"),
  inputValue: document.querySelector("#inputValue"),
  setAInput: document.querySelector("#setAInput"),
  setBInput: document.querySelector("#setBInput"),
  setCInput: document.querySelector("#setCInput"),
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
    A: [1, 2, 3, 4],
    B: [3, 4, 5, 6],
    C: [2, 4, 6, 8],
  },
};

const TOPICS = {
  sets: {
    chapter: "基礎知識",
    title: "集合とベン図",
    subtitle: "和集合・積集合・補集合・差集合を領域で見る",
    formulaTitle: "集合演算",
    formula: "U = {1,2,3,4,5,6,7,8,9}\nA = {1,2,3,4}\nB = {3,4,5,6}\nC = {2,4,6,8}",
    examples: ["A∪B", "A∩B", "A-B", "A∩B∩C", "Aの補集合"],
    input: "",
  },
  relations: {
    chapter: "基礎知識",
    title: "関係",
    subtitle: "順序対の集合を矢印と0-1行列で見る",
    formulaTitle: "関係R",
    formula: "R ⊆ A×B。a∈A と b∈B の間に関係があるとき (a,b)∈R と書く。",
    examples: ["約数関係", "mod 2が等しい", "小なり関係"],
    input: "",
  },
  functions: {
    chapter: "基礎知識",
    title: "関数",
    subtitle: "各入力から出る矢印の本数で関数かどうかを判定する",
    formulaTitle: "関数f",
    formula: "Aの各要素に対して、Bの要素がちょうど1つ対応するとき f:A→B は関数。",
    examples: ["関数", "関数でない", "単射", "全射"],
    input: "",
  },
  "relations-functions": {
    chapter: "基礎知識",
    title: "関係と関数",
    subtitle: "順序対・関係行列・写像の条件",
    formulaTitle: "関係と関数",
    formula: "関係は A×B の部分集合。関数は A の各要素から B の要素へちょうど1本の矢印を持つ関係。",
    examples: ["関係: 約数関係", "関係: mod 2が等しい", "関係: 小なり関係", "関数: 関数", "関数: 関数でない", "関数: 単射", "関数: 全射"],
    input: "",
  },
  counting: {
    chapter: "基礎知識",
    title: "順列と組み合わせ",
    subtitle: "積の法則・順列・組み合わせ・二項係数",
    formulaTitle: "数え上げ",
    formula: "順列 nPr = n!/(n-r)!、組合せ nCr = n!/(r!(n-r)!)。",
    examples: ["積の法則", "順列 5P3", "組合せ 5C3", "二項定理"],
    input: "",
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
    elements.inputValue.disabled = !["automata", "nfa", "grammar", "pda", "turing"].includes(state.topic);
  }
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
      <svg viewBox="0 0 520 330" role="img" aria-label="${escapeHtml(label)}">
        <rect x="24" y="24" width="472" height="270" rx="10" class="venn-universe ${isActive("U") ? "is-active" : ""}" />
        <circle cx="220" cy="150" r="82" class="venn-region region-a ${isActive("A") ? "is-active" : ""}" />
        <circle cx="300" cy="150" r="82" class="venn-region region-b ${isActive("B") ? "is-active" : ""}" />
        <circle cx="260" cy="210" r="82" class="venn-region region-c ${isActive("C") ? "is-active" : ""}" />
        <text x="150" y="82">A</text><text x="360" y="82">B</text><text x="260" y="286">C</text><text x="40" y="52">U</text>
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

function arrowDiagram(left, right, pairs, activeIndex = -1) {
  const leftNodes = left.map((value, index) => `<div class="map-node" style="--row:${index + 1}">${value}</div>`).join("");
  const rightNodes = right.map((value, index) => `<div class="map-node" style="--row:${index + 1}">${value}</div>`).join("");
  const lines = pairs.map(([a, b], index) => {
    const y1 = 50 + left.indexOf(a) * 62;
    const y2 = 50 + right.indexOf(b) * 62;
    return `<line x1="115" y1="${y1}" x2="365" y2="${y2}" class="${index === activeIndex ? "is-active" : ""}" />`;
  }).join("");
  return `
    <div class="mapping-grid">
      <div class="map-set"><strong>A</strong>${leftNodes}</div>
      <svg class="map-arrows" viewBox="0 0 480 260">${lines}</svg>
      <div class="map-set"><strong>B</strong>${rightNodes}</div>
    </div>
  `;
}

function relationMatrix(left, right, pairs) {
  return `<div class="logic-table-wrap"><table class="logic-table"><thead><tr><th>R</th>${right.map((b) => `<th>${b}</th>`).join("")}</tr></thead><tbody>${left.map((a) => `<tr><th>${a}</th>${right.map((b) => `<td class="${pairs.some(([x, y]) => x === a && y === b) ? "truth-true" : ""}">${pairs.some(([x, y]) => x === a && y === b) ? "1" : "0"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function framesForRelations(example) {
  const A = [1, 2, 3, 4];
  const B = [1, 2, 3, 4, 6];
  const pairs = example === "約数関係"
    ? A.flatMap((a) => B.filter((b) => b % a === 0).map((b) => [a, b]))
    : example === "mod 2が等しい"
      ? A.flatMap((a) => B.filter((b) => a % 2 === b % 2).map((b) => [a, b]))
      : A.flatMap((a) => B.filter((b) => a < b).map((b) => [a, b]));
  return [
    { note: "A×Bの中から条件を満たす順序対を選ぶ", html: arrowDiagram(A, B, pairs.slice(0, 1), 0) },
    { note: "関係Rを矢印の集合として表示する", html: arrowDiagram(A, B, pairs, pairs.length - 1) },
    { note: "同じ関係を0-1行列で表す", html: relationMatrix(A, B, pairs), formula: `R = { ${pairs.map(([a, b]) => `(${a},${b})`).join(", ")} }` },
  ];
}

function framesForFunctions(example) {
  const A = ["a", "b", "c"];
  const B = [1, 2, 3];
  const pairsByExample = {
    "関数": [["a", 1], ["b", 2], ["c", 2]],
    "関数でない": [["a", 1], ["a", 2], ["b", 2], ["c", 3]],
    "単射": [["a", 1], ["b", 2], ["c", 3]],
    "全射": [["a", 1], ["b", 2], ["c", 3]],
  };
  const pairs = pairsByExample[example];
  const verdict = example === "関数でない" ? "aから矢印が2本出るので関数ではない" : `${example}の条件を満たす`;
  return [
    { note: "入力集合Aの各要素を見る", html: arrowDiagram(A, B, pairs.slice(0, 1), 0) },
    { note: "すべての対応を矢印で表示する", html: arrowDiagram(A, B, pairs, pairs.length - 1) },
    { note: verdict, html: `<div class="verdict ${example === "関数でない" ? "is-false" : "is-true"}">${verdict}</div>${arrowDiagram(A, B, pairs)}` },
  ];
}

function framesForRelationsFunctions(example) {
  if (example.startsWith("関係: ")) {
    return framesForRelations(example.replace("関係: ", ""));
  }
  return framesForFunctions(example.replace("関数: ", ""));
}

function framesForCounting(example) {
  if (example === "積の法則") {
    return [
      { note: "服が3通りある", html: choiceGrid(["赤", "青", "緑"], []) },
      { note: "靴が2通りあるので枝が分かれる", html: choiceGrid(["赤", "青", "緑"], ["白", "黒"]) },
      { note: "合計は 3×2=6 通り", html: `<div class="count-result">3 × 2 = 6</div>${choiceGrid(["赤", "青", "緑"], ["白", "黒"])}` },
    ];
  }
  if (example === "順列 5P3") {
    return countFormulaFrames("5P3", "5個から順に3個選んで並べる", ["1番目: 5通り", "2番目: 4通り", "3番目: 3通り"], 5 * 4 * 3);
  }
  if (example === "組合せ 5C3") {
    return countFormulaFrames("5C3", "並び順を区別しないので 3! で割る", ["まず 5P3 = 60", "同じ組を 3! = 6 回数えている", "60 / 6 = 10"], 10);
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

[elements.setAInput, elements.setBInput, elements.setCInput].filter(Boolean).forEach((input) => {
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
    state.step = state.step + 1;
    if (state.step >= frames.length) {
      state.step = frames.length - 1;
      stopTimer();
    }
    render();
  }, 950);
});

renderTopicOptions();
render();
