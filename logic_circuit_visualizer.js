const circuitElements = {
  inputCount: document.querySelector("#inputCount"),
  presetSelect: document.querySelector("#presetSelect"),
  randomCircuit: document.querySelector("#randomCircuit"),
  layer2Count: document.querySelector("#layer2Count"),
  formulaInput: document.querySelector("#formulaInput"),
  generateFromFormula: document.querySelector("#generateFromFormula"),
  circuitSymbolButtons: document.querySelectorAll("[data-insert-circuit-symbol]"),
  inputToggleRow: document.querySelector("#inputToggleRow"),
  message: document.querySelector("#message"),
  circuitTitle: document.querySelector("#circuitTitle"),
  outputBadge: document.querySelector("#outputBadge"),
  circuitStage: document.querySelector("#circuitStage"),
  layer2ConfigList: document.querySelector("#layer2ConfigList"),
  finalGateType: document.querySelector("#finalGateType"),
  calculationSummary: document.querySelector("#calculationSummary"),
};

const INPUT_NAMES = ["A", "B", "C", "D"];
const LAYER2_TYPES = ["AND", "OR", "NAND", "NOR", "XOR", "XNOR"];
const FINAL_TYPES = ["AND", "OR", "NAND", "NOR"];

const circuitState = {
  inputCount: 3,
  inputValues: { A: true, B: false, C: true, D: false },
  layer2Count: 3,
  layer2Gates: [
    { type: "AND", sources: ["A", "~B", ""] },
    { type: "OR", sources: ["~A", "C", ""] },
    { type: "XOR", sources: ["B", "C", ""] },
    { type: "NAND", sources: ["A", "C", "D"] },
  ],
  finalGateType: "OR",
  finalSources: ["A", "B", "C"],
};

const PRESETS = [
  {
    label: "標準例",
    inputCount: 3,
    inputValues: { A: true, B: false, C: true, D: false },
    layer2Count: 3,
    layer2Gates: [
      { type: "AND", sources: ["A", "~B", ""] },
      { type: "OR", sources: ["~A", "C", ""] },
      { type: "XOR", sources: ["B", "C", ""] },
      { type: "NAND", sources: ["A", "C", "D"] },
    ],
    finalGateType: "OR",
    finalSources: ["A", "B", "C"],
  },
  {
    label: "2入力 XOR",
    inputCount: 2,
    inputValues: { A: true, B: false, C: false, D: false },
    layer2Count: 2,
    layer2Gates: [
      { type: "AND", sources: ["A", "~B", ""] },
      { type: "AND", sources: ["~A", "B", ""] },
      { type: "OR", sources: ["A", "B", ""] },
      { type: "NAND", sources: ["A", "B", ""] },
    ],
    finalGateType: "OR",
    finalSources: ["A", "B"],
  },
  {
    label: "4入力多数決風",
    inputCount: 4,
    inputValues: { A: true, B: true, C: false, D: true },
    layer2Count: 4,
    layer2Gates: [
      { type: "AND", sources: ["A", "B", ""] },
      { type: "AND", sources: ["A", "C", ""] },
      { type: "AND", sources: ["B", "D", ""] },
      { type: "AND", sources: ["C", "D", ""] },
    ],
    finalGateType: "OR",
    finalSources: ["A", "B", "C", "D"],
  },
  {
    label: "NANDを含む例",
    inputCount: 3,
    inputValues: { A: true, B: true, C: false, D: false },
    layer2Count: 3,
    layer2Gates: [
      { type: "NAND", sources: ["A", "B", ""] },
      { type: "AND", sources: ["~A", "C", ""] },
      { type: "OR", sources: ["B", "~C", ""] },
      { type: "NOR", sources: ["A", "C", ""] },
    ],
    finalGateType: "AND",
    finalSources: ["A", "B", "C"],
  },
  {
    label: "NORとXNOR",
    inputCount: 4,
    inputValues: { A: false, B: true, C: true, D: false },
    layer2Count: 4,
    layer2Gates: [
      { type: "NOR", sources: ["A", "B", ""] },
      { type: "XNOR", sources: ["B", "C", ""] },
      { type: "NAND", sources: ["~C", "D", ""] },
      { type: "OR", sources: ["A", "~D", ""] },
    ],
    finalGateType: "OR",
    finalSources: ["A", "B", "C", "D"],
  },
  {
    label: "全種類ミックス",
    inputCount: 4,
    inputValues: { A: true, B: false, C: true, D: true },
    layer2Count: 4,
    layer2Gates: [
      { type: "XOR", sources: ["A", "B", ""] },
      { type: "NAND", sources: ["A", "~C", "D"] },
      { type: "NOR", sources: ["~B", "C", ""] },
      { type: "XNOR", sources: ["B", "D", ""] },
    ],
    finalGateType: "NAND",
    finalSources: ["A", "B", "C", "D"],
  },
];

function escapeCircuitHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function activeInputs() {
  return INPUT_NAMES.slice(0, circuitState.inputCount);
}

function availableSources() {
  return activeInputs().flatMap((name) => [name, `~${name}`]);
}

function boolText(value) {
  return value ? "1" : "0";
}

function gateValue(type, values) {
  if (values.length === 0) return false;
  const all = values.every(Boolean);
  const any = values.some(Boolean);
  const trueCount = values.filter(Boolean).length;
  if (type === "AND") return all;
  if (type === "OR") return any;
  if (type === "NAND") return !all;
  if (type === "NOR") return !any;
  if (type === "XOR") return trueCount % 2 === 1;
  if (type === "XNOR") return trueCount % 2 === 0;
  return false;
}

function sourceValue(source) {
  if (!source) return false;
  if (source.startsWith("~")) return !circuitState.inputValues[source.slice(1)];
  return circuitState.inputValues[source];
}

function sourceLabel(source) {
  return source.startsWith("~") ? `${source.slice(1)}'` : source;
}

function gateFormula(type, sources) {
  const labels = sources.filter(Boolean).map(sourceLabel);
  if (labels.length === 0) return `${type}()`;
  const joiner = type === "AND" || type === "NAND" ? "" : "+";
  const body = labels.join(joiner);
  if (type === "NAND" || type === "NOR" || type === "XNOR") return `(${body})'`;
  return body;
}

function setCircuitMessage(text = "") {
  circuitElements.message.textContent = text;
}

function sourceExpression(source) {
  return source.startsWith("~") ? `${source.slice(1)}'` : source;
}

function sourceComplementExpression(source) {
  return source.startsWith("~") ? source.slice(1) : `${source}'`;
}

function productExpression(sources) {
  return sources.map(sourceExpression).join("") || "0";
}

function sumExpression(sources) {
  return sources.map(sourceExpression).join("+") || "0";
}

function xorExpression(sources, invert = false) {
  const activeSources = sources.filter(Boolean);
  if (activeSources.length === 0) return invert ? "1" : "0";
  const rows = 2 ** activeSources.length;
  const terms = [];
  for (let row = 0; row < rows; row += 1) {
    const values = activeSources.map((_, index) => Boolean(row & (1 << (activeSources.length - index - 1))));
    const parity = values.filter(Boolean).length % 2 === 1;
    if (parity === !invert) {
      terms.push(activeSources.map((source, index) => values[index] ? sourceExpression(source) : sourceComplementExpression(source)).join(""));
    }
  }
  return terms.length ? terms.join("+") : "0";
}

function gateExpression(type, sources) {
  const activeSources = sources.filter(Boolean);
  if (type === "AND") return productExpression(activeSources);
  if (type === "OR") return sumExpression(activeSources);
  if (type === "NAND") return `(${productExpression(activeSources)})'`;
  if (type === "NOR") return `(${sumExpression(activeSources)})'`;
  if (type === "XOR") return xorExpression(activeSources, false);
  if (type === "XNOR") return xorExpression(activeSources, true);
  return "";
}

function circuitExpression(evaluation) {
  const inputs = evaluation.layer2.length > 0
    ? evaluation.layer2.map((gate) => `(${gateExpression(gate.type, gate.sources)})`)
    : evaluation.directSources.map((source) => sourceExpression(source));
  if (circuitState.finalGateType === "AND") return inputs.join("");
  if (circuitState.finalGateType === "OR") return inputs.join("+");
  if (circuitState.finalGateType === "NAND") return `(${inputs.join("")})'`;
  if (circuitState.finalGateType === "NOR") return `(${inputs.join("+")})'`;
  return inputs.join("+");
}

function normalizeLayer2Sources() {
  const sources = availableSources();
  circuitState.layer2Gates.forEach((gate) => {
    gate.sources = gate.sources.map((source) => sources.includes(source) ? source : "");
    while (gate.sources.length < 3) gate.sources.push("");
    gate.sources = gate.sources.slice(0, 3);
  });
  circuitState.finalSources = (circuitState.finalSources || []).filter((source) => sources.includes(source)).slice(0, 4);
  if (circuitState.layer2Count === 0 && circuitState.finalSources.length === 0) {
    circuitState.finalSources = activeInputs().slice(0, 4);
  }
}

function evaluateCircuit() {
  normalizeLayer2Sources();
  const layer1 = {};
  activeInputs().forEach((name) => {
    layer1[name] = circuitState.inputValues[name];
    layer1[`~${name}`] = !circuitState.inputValues[name];
  });
  const layer2 = circuitState.layer2Gates.slice(0, circuitState.layer2Count).map((gate, index) => {
    const sources = gate.sources.filter(Boolean);
    const inputValues = sources.map(sourceValue);
    return {
      index,
      type: gate.type,
      sources,
      inputValues,
      value: gateValue(gate.type, inputValues),
      formula: gateFormula(gate.type, sources),
    };
  });
  const directSources = circuitState.layer2Count === 0 ? circuitState.finalSources.filter(Boolean) : [];
  const directValues = directSources.map(sourceValue);
  const outputValues = layer2.length > 0 ? layer2.map((gate) => gate.value) : directValues;
  const finalValue = gateValue(circuitState.finalGateType, outputValues);
  const finalInputs = layer2.length > 0 ? layer2.map((gate) => `G${gate.index + 1}`) : directSources.map(sourceLabel);
  const finalFormula = `${circuitState.finalGateType}(${finalInputs.join(", ")})`;
  return { layer1, layer2, directSources, directValues, finalValue, finalFormula };
}

function populatePresets() {
  circuitElements.presetSelect.innerHTML = PRESETS
    .map((preset, index) => `<option value="${index}">${escapeCircuitHtml(preset.label)}</option>`)
    .join("");
}

function applyPreset(index) {
  const preset = PRESETS[index] || PRESETS[0];
  circuitState.inputCount = preset.inputCount;
  circuitState.inputValues = { ...circuitState.inputValues, ...preset.inputValues };
  circuitState.layer2Count = preset.layer2Count;
  circuitState.layer2Gates = preset.layer2Gates.map((gate) => ({
    type: gate.type,
    sources: [...gate.sources],
  }));
  circuitState.finalGateType = preset.finalGateType;
  circuitState.finalSources = [...(preset.finalSources || [])];
  syncControls();
  renderCircuitPage();
}

function randomChoice(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function randomSources(inputNames) {
  const count = 2 + Math.floor(Math.random() * 2);
  const shuffled = [...inputNames].sort(() => Math.random() - 0.5);
  const sources = shuffled.slice(0, Math.min(count, shuffled.length)).map((name) => Math.random() >= 0.5 ? name : `~${name}`);
  return [...sources, "", ""].slice(0, 3);
}

function generateRandomCircuit() {
  const inputCount = 2 + Math.floor(Math.random() * 3);
  circuitState.inputCount = inputCount;
  activeInputs().forEach((name) => {
    circuitState.inputValues[name] = Math.random() >= 0.5;
  });
  const inputNames = activeInputs();
  const layer2Count = 2 + Math.floor(Math.random() * 3);
  const richTypes = ["NAND", "NOR", "XOR", "XNOR"];
  const types = [randomChoice(richTypes)];
  while (types.length < layer2Count) types.push(randomChoice(LAYER2_TYPES));
  types.sort(() => Math.random() - 0.5);
  circuitState.layer2Count = layer2Count;
  circuitState.layer2Gates = types.map((type) => ({
    type,
    sources: randomSources(inputNames),
  }));
  while (circuitState.layer2Gates.length < 4) {
    circuitState.layer2Gates.push({ type: "AND", sources: ["", "", ""] });
  }
  circuitState.finalGateType = randomChoice(FINAL_TYPES);
  circuitState.finalSources = [];
  circuitElements.presetSelect.value = "";
  circuitElements.formulaInput.value = "";
  syncControls();
  renderCircuitPage();
  setCircuitMessage("ランダム回路を生成しました。");
}

function sourceOptions(selected) {
  const options = ['<option value="">未使用</option>'];
  availableSources().forEach((source) => {
    options.push(`<option value="${source}" ${source === selected ? "selected" : ""}>${sourceLabel(source)}</option>`);
  });
  return options.join("");
}

function renderInputToggles() {
  circuitElements.inputToggleRow.innerHTML = activeInputs().map((name) => `
    <button class="logic-input-toggle ${circuitState.inputValues[name] ? "is-on" : ""}" type="button" data-input-name="${name}">
      ${name}=${boolText(circuitState.inputValues[name])}
    </button>
  `).join("");
}

function renderGateControls() {
  if (circuitState.layer2Count === 0) {
    circuitElements.layer2ConfigList.innerHTML = `
      <div class="layer2-empty-note">第2層は使わず、第1層から第3層へ直接接続します。</div>
    `;
    return;
  }
  const gateCards = circuitState.layer2Gates.slice(0, circuitState.layer2Count).map((gate, index) => `
    <fieldset class="layer2-config-card">
      <legend>G${index + 1}</legend>
      <div class="layer2-config-row">
        <label for="gateType${index}">種類</label>
        <select id="gateType${index}" data-gate-index="${index}" data-gate-field="type">
          ${LAYER2_TYPES.map((type) => `<option value="${type}" ${type === gate.type ? "selected" : ""}>${type}</option>`).join("")}
        </select>
      </div>
      ${[0, 1, 2].map((sourceIndex) => `
        <div class="layer2-config-row">
          <label for="gate${index}Source${sourceIndex}">入力${sourceIndex + 1}</label>
          <select id="gate${index}Source${sourceIndex}" data-gate-index="${index}" data-source-index="${sourceIndex}">
            ${sourceOptions(gate.sources[sourceIndex] || "")}
          </select>
        </div>
      `).join("")}
    </fieldset>
  `).join("");
  circuitElements.layer2ConfigList.innerHTML = gateCards;
}

function renderSummary(evaluation) {
  const inputLine = activeInputs()
    .map((name) => `${name}=${boolText(circuitState.inputValues[name])}`)
    .join(", ");
  const gateLines = evaluation.layer2.map((gate) => `
    <tr>
      <th>G${gate.index + 1}</th>
      <td>${gate.type}</td>
      <td>${escapeCircuitHtml(gate.formula)}</td>
      <td class="${gate.value ? "truth-true" : "truth-false"}">${boolText(gate.value)}</td>
    </tr>
  `).join("");
  const directLines = evaluation.directSources.map((source, index) => {
    const value = evaluation.directValues[index];
    return `
      <tr>
        <th>${sourceLabel(source)}</th>
        <td>直接</td>
        <td>${escapeCircuitHtml(sourceLabel(source))}</td>
        <td class="${value ? "truth-true" : "truth-false"}">${boolText(value)}</td>
      </tr>
    `;
  }).join("");
  circuitElements.calculationSummary.innerHTML = `
    <div class="summary-input-line">${escapeCircuitHtml(inputLine)}</div>
    <div class="summary-formula-line">サンプルのブール式: ${escapeCircuitHtml(circuitExpression(evaluation))}</div>
    <table class="logic-table circuit-summary-table">
      <thead><tr><th>ゲート</th><th>種類</th><th>式</th><th>値</th></tr></thead>
      <tbody>${gateLines || directLines}</tbody>
      <tfoot><tr><th>Y</th><td>${circuitState.finalGateType}</td><td>${escapeCircuitHtml(evaluation.finalFormula)}</td><td class="${evaluation.finalValue ? "truth-true" : "truth-false"}">${boolText(evaluation.finalValue)}</td></tr></tfoot>
    </table>
  `;
}

function tokenizeFormula(source) {
  const tokens = [];
  let index = 0;
  const normalized = source.toUpperCase();
  while (index < normalized.length) {
    const char = normalized[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if ("ABCDXYZW".includes(char)) {
      tokens.push({ type: "variable", value: ({ X: "A", Y: "B", Z: "C", W: "D" }[char] || char) });
      index += 1;
      continue;
    }
    if (char === "+") {
      tokens.push({ type: "or", value: char });
      index += 1;
      continue;
    }
    if (char === "'" || char === "’" || char === "′") {
      tokens.push({ type: "not", value: char });
      index += 1;
      continue;
    }
    if (char === "(" || char === ")") {
      tokens.push({ type: char, value: char });
      index += 1;
      continue;
    }
    throw new Error(`使えない文字があります: ${source[index]}`);
  }
  return tokens;
}

function parseFormulaAst(source) {
  const tokens = tokenizeFormula(source);
  let index = 0;

  function peek() {
    return tokens[index];
  }

  function consume(type) {
    if (peek()?.type !== type) return null;
    index += 1;
    return tokens[index - 1];
  }

  function startsProductTerm(token) {
    return token?.type === "variable" || token?.type === "(";
  }

  function parsePrimary() {
    const token = peek();
    if (!token) throw new Error("式が途中で終わっています。");
    if (token.type === "variable") {
      index += 1;
      return { type: "var", name: token.value };
    }
    if (consume("(")) {
      const expression = parseSum();
      if (!consume(")")) throw new Error("閉じ括弧 ) が不足しています。");
      return expression;
    }
    throw new Error(`${token.value} の位置を確認してください。`);
  }

  function parsePostfix() {
    let node = parsePrimary();
    while (consume("not")) node = { type: "not", child: node };
    return node;
  }

  function parseProduct() {
    let node = parsePostfix();
    while (startsProductTerm(peek())) {
      node = { type: "and", children: [node, parsePostfix()] };
    }
    return node;
  }

  function parseSum() {
    let node = parseProduct();
    while (consume("or")) {
      node = { type: "or", children: [node, parseProduct()] };
    }
    return node;
  }

  if (tokens.length === 0) throw new Error("論理式を入力してください。");
  const ast = parseSum();
  if (index < tokens.length) throw new Error(`${tokens[index].value} の前後を確認してください。`);
  return normalizeAst(ast);
}

function normalizeAst(node) {
  if (node.type === "not") {
    const child = normalizeAst(node.child);
    if (child.type === "not") return normalizeAst(child.child);
    return { type: "not", child };
  }
  if (node.type === "and" || node.type === "or") {
    const children = node.children.map(normalizeAst).flatMap((child) => child.type === node.type ? child.children : [child]);
    return { type: node.type, children };
  }
  return node;
}

function flattenType(node, type) {
  return node.type === type ? node.children.flatMap((child) => flattenType(child, type)) : [node];
}

function literalSource(node) {
  if (node.type === "var") return node.name;
  if (node.type === "not" && node.child.type === "var") return `~${node.child.name}`;
  return null;
}

function sourcesFromTerm(node, gateType, maxInputs = 3) {
  const operator = gateType === "AND" ? "and" : "or";
  const parts = flattenType(node, operator);
  const sources = parts.map(literalSource);
  if (sources.some((source) => !source)) return null;
  if (sources.length > maxInputs) throw new Error(`${maxInputs}入力を超えています。項を分けてください。`);
  return sources;
}

function circuitSpecFromAst(ast) {
  const directVariants = [
    { root: ast, gateType: "OR", finalGateType: "OR" },
    { root: ast, gateType: "AND", finalGateType: "AND" },
  ];
  if (ast.type === "not") {
    directVariants.unshift(
      { root: ast.child, gateType: "OR", finalGateType: "NOR" },
      { root: ast.child, gateType: "AND", finalGateType: "NAND" },
    );
  }
  for (const variant of directVariants) {
    const sources = sourcesFromTerm(variant.root, variant.gateType, 4);
    if (sources && sources.length <= 4) {
      return { gates: [], finalGateType: variant.finalGateType, finalSources: sources };
    }
  }

  const variants = [
    { root: ast, split: "or", gateType: "AND", finalGateType: "OR" },
    { root: ast, split: "and", gateType: "OR", finalGateType: "AND" },
  ];
  if (ast.type === "not") {
    variants.unshift(
      { root: ast.child, split: "or", gateType: "AND", finalGateType: "NOR" },
      { root: ast.child, split: "and", gateType: "OR", finalGateType: "NAND" },
    );
  }

  for (const variant of variants) {
    const terms = flattenType(variant.root, variant.split);
    if (terms.length > 4) continue;
    const gates = [];
    let ok = true;
    for (const term of terms) {
      const sources = sourcesFromTerm(term, variant.gateType);
      if (!sources) {
        ok = false;
        break;
      }
      gates.push({ type: variant.gateType, sources: [...sources, "", ""].slice(0, 3) });
    }
    if (ok && gates.length > 0) return { gates, finalGateType: variant.finalGateType };
  }
  throw new Error("この3層構成に変換できません。和積形 A'B+CD、または積和形 (A+B)(C'+D) にしてください。");
}

function variablesInAst(node, set = new Set()) {
  if (node.type === "var") set.add(node.name);
  if (node.type === "not") variablesInAst(node.child, set);
  if (node.children) node.children.forEach((child) => variablesInAst(child, set));
  return set;
}

function generateCircuitFromFormula() {
  try {
    const ast = parseFormulaAst(circuitElements.formulaInput.value);
    const variableSet = variablesInAst(ast);
    const maxInputIndex = Math.max(...[...variableSet].map((name) => INPUT_NAMES.indexOf(name)), 1);
    const spec = circuitSpecFromAst(ast);
    circuitState.inputCount = Math.min(4, Math.max(2, maxInputIndex + 1));
    circuitState.layer2Count = spec.gates.length;
    circuitState.layer2Gates = [...spec.gates, ...Array.from({ length: 4 - spec.gates.length }, () => ({ type: "AND", sources: ["", "", ""] }))];
    circuitState.finalGateType = spec.finalGateType;
    circuitState.finalSources = spec.finalSources ? [...spec.finalSources] : [];
    circuitElements.presetSelect.value = "";
    syncControls();
    renderCircuitPage();
    setCircuitMessage("論理式から回路を生成しました。");
  } catch (error) {
    setCircuitMessage(error.message);
  }
}

function insertSymbolIntoCircuitFormula(symbol) {
  const input = circuitElements.formulaInput;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.value = `${input.value.slice(0, start)}${symbol}${input.value.slice(end)}`;
  const nextPosition = start + symbol.length;
  input.focus();
  input.setSelectionRange(nextPosition, nextPosition);
}

function nodeClass(value) {
  return value ? "is-true" : "is-false";
}

function gateHasOutputBubble(type) {
  return type === "NAND" || type === "NOR" || type === "XNOR";
}

const GATE_HEIGHT = 64;
const OR_GATE_WIDTH = 98;
const GATE_WIDTH = OR_GATE_WIDTH;

function gateWidth(type) {
  return type === "OR" || type === "NOR" || type === "XOR" || type === "XNOR" ? OR_GATE_WIDTH : GATE_WIDTH;
}

function gateInputX(position, type = "AND") {
  if (type === "OR" || type === "NOR" || type === "XOR" || type === "XNOR") return position.x - 34;
  return position.x - gateWidth(type) / 2;
}

function gateWireInputX(position, type = "AND") {
  return gateInputX(position, type) - 2;
}

function gateOutputX(position, type) {
  if (type === "AND" || type === "NAND") {
    const shapeRight = position.x + gateWidth(type) / 2;
    return shapeRight + (gateHasOutputBubble(type) ? 14 : 0);
  }
  return position.x + gateWidth(type) / 2 + (gateHasOutputBubble(type) ? 10 : 0);
}

function gateWireOutputX(position, type) {
  return gateOutputX(position, type) - (gateHasOutputBubble(type) ? 0 : 1);
}

function standardGateSymbol(type, position, value, mainLabel, typeLabel, valueLabel, options = {}) {
  const x = position.x;
  const y = position.y;
  const labelX = x + (options.labelOffsetX || 0);
  const shapeClass = `gate-shape ${nodeClass(value)}`;
  const width = gateWidth(type);
  const halfWidth = width / 2;
  const halfHeight = GATE_HEIGHT / 2;
  const bubbleX = x + halfWidth + 7;
  const label = `
    <text class="gate-main-label" x="${labelX}" y="${y - 15}">${escapeCircuitHtml(mainLabel)}</text>
    <text class="gate-type-label" x="${labelX}" y="${y + 3}">${escapeCircuitHtml(typeLabel)}</text>
    <text class="gate-value-label" x="${labelX}" y="${y + 23}">${escapeCircuitHtml(valueLabel)}</text>
  `;
  const bubble = gateHasOutputBubble(type)
    ? `<circle class="gate-bubble ${nodeClass(value)}" cx="${bubbleX}" cy="${y}" r="7"></circle>`
    : "";

  if (type === "AND" || type === "NAND") {
    const arcStartX = x + halfWidth - halfHeight;
    return `
      <g class="gate-node ${nodeClass(value)}" data-gate-type="${type}">
        <path class="${shapeClass}" d="M${x - halfWidth} ${y - halfHeight} L${arcStartX} ${y - halfHeight} A${halfHeight} ${halfHeight} 0 0 1 ${arcStartX} ${y + halfHeight} L${x - halfWidth} ${y + halfHeight} Z"></path>
        ${bubble}
        ${label}
      </g>
    `;
  }

  const xorCurve = (type === "XOR" || type === "XNOR")
    ? `<path class="gate-extra-curve ${nodeClass(value)}" d="M${x - halfWidth - 10} ${y - 32} C${x - 40} ${y - 11}, ${x - 40} ${y + 11}, ${x - halfWidth - 10} ${y + 32}"></path>`
    : "";

  return `
    <g class="gate-node ${nodeClass(value)}" data-gate-type="${type}">
      ${xorCurve}
      <path class="${shapeClass}" d="M${x - halfWidth} ${y - 32} C${x - 30} ${y - 11}, ${x - 30} ${y + 11}, ${x - halfWidth} ${y + 32} C${x - 10} ${y + 33}, ${x + 29} ${y + 20}, ${x + halfWidth} ${y} C${x + 29} ${y - 20}, ${x - 10} ${y - 33}, ${x - halfWidth} ${y - 32} Z"></path>
      ${bubble}
      ${label}
    </g>
  `;
}

function notGateSymbol(x, y, value) {
  return `
    <g class="not-gate ${nodeClass(value)}" aria-label="NOT">
      <path class="not-gate-triangle ${nodeClass(value)}" d="M${x - 16} ${y - 15} L${x - 16} ${y + 15} L${x + 12} ${y} Z"></path>
      <circle class="not-gate-bubble ${nodeClass(value)}" cx="${x + 19}" cy="${y}" r="6"></circle>
      <text x="${x - 1}" y="${y + 5}">NOT</text>
    </g>
  `;
}

function renderCircuitSvg(evaluation) {
  const inputs = activeInputs();
  const sources = availableSources();
  const sourcePositions = {};
  const inputPositions = {};
  const gatePositions = {};
  const startY = 80;
  const rowGap = inputs.length === 4 ? 86 : 106;
  const sourceGap = 34;
  const gateGap = circuitState.layer2Count === 4 ? 90 : 110;
  const gateStartY = circuitState.layer2Count === 4 ? 88 : 100;

  inputs.forEach((name, index) => {
    const y = startY + index * rowGap;
    inputPositions[name] = { x: 58, y };
    sourcePositions[name] = { x: 210, y: y - sourceGap / 2 };
    sourcePositions[`~${name}`] = { x: 210, y: y + sourceGap / 2 };
  });
  evaluation.layer2.forEach((gate, index) => {
    gatePositions[index] = { x: 480, y: gateStartY + index * gateGap };
  });
  const finalPosition = { x: 735, y: 235 };
  const outputPosition = { x: 875, y: 235 };
  const usedSources = new Set(evaluation.layer2.length > 0
    ? evaluation.layer2.flatMap((gate) => gate.sources)
    : evaluation.directSources);
  const visibleSources = sources.filter((source) => usedSources.has(source));

  const sourceNodes = visibleSources.map((source) => {
    const position = sourcePositions[source];
    const value = sourceValue(source);
    return `
      <g class="circuit-node source-node ${nodeClass(value)}">
        <rect x="${position.x - 34}" y="${position.y - 16}" width="68" height="32" rx="6"></rect>
        <text x="${position.x}" y="${position.y + 5}">${sourceLabel(source)}=${boolText(value)}</text>
      </g>
    `;
  }).join("");

  const inputNodes = inputs.map((name) => {
    const position = inputPositions[name];
    const usesNormal = usedSources.has(name);
    const usesInverted = usedSources.has(`~${name}`);
    return `
      <g class="circuit-node input-node ${nodeClass(circuitState.inputValues[name])}">
        <circle cx="${position.x}" cy="${position.y}" r="24"></circle>
        <text x="${position.x}" y="${position.y + 6}">${name}</text>
      </g>
      ${usesNormal ? `<path class="circuit-wire ${nodeClass(circuitState.inputValues[name])}" d="M82 ${position.y} L176 ${sourcePositions[name].y}" />` : ""}
      ${usesInverted ? `<path class="circuit-wire ${nodeClass(!circuitState.inputValues[name])}" d="M82 ${position.y} L130 ${sourcePositions[`~${name}`].y}" />` : ""}
      ${usesInverted ? notGateSymbol(150, sourcePositions[`~${name}`].y, !circuitState.inputValues[name]) : ""}
      ${usesInverted ? `<path class="circuit-wire ${nodeClass(!circuitState.inputValues[name])}" d="M175 ${sourcePositions[`~${name}`].y} L176 ${sourcePositions[`~${name}`].y}" />` : ""}
    `;
  }).join("");

  const layer2Wires = evaluation.layer2.flatMap((gate) => {
    const gatePosition = gatePositions[gate.index];
    return gate.sources.map((source, sourceIndex) => {
      const sourcePosition = sourcePositions[source];
      const targetY = gatePosition.y - 18 + sourceIndex * 18;
      return `<path class="circuit-wire ${nodeClass(sourceValue(source))}" d="M244 ${sourcePosition.y} C310 ${sourcePosition.y}, 340 ${targetY}, ${gateWireInputX(gatePosition, gate.type)} ${targetY}" />`;
    });
  }).join("");

  const layer2Nodes = evaluation.layer2.map((gate) => {
    const position = gatePositions[gate.index];
    return standardGateSymbol(gate.type, position, gate.value, `G${gate.index + 1}`, gate.type, `=${boolText(gate.value)}`, { labelOffsetX: -8 });
  }).join("");

  const finalWires = evaluation.layer2.map((gate) => {
    const gatePosition = gatePositions[gate.index];
    const targetY = finalPosition.y - ((evaluation.layer2.length - 1) * 16) / 2 + gate.index * 16;
    return `<path class="circuit-wire ${nodeClass(gate.value)}" d="M${gateWireOutputX(gatePosition, gate.type)} ${gatePosition.y} C610 ${gatePosition.y}, 650 ${targetY}, ${gateWireInputX(finalPosition, circuitState.finalGateType)} ${targetY}" />`;
  }).join("");
  const directWires = evaluation.directSources.map((source, index) => {
    const sourcePosition = sourcePositions[source];
    const targetY = finalPosition.y - ((evaluation.directSources.length - 1) * 18) / 2 + index * 18;
    return `<path class="circuit-wire ${nodeClass(sourceValue(source))}" d="M244 ${sourcePosition.y} C420 ${sourcePosition.y}, 560 ${targetY}, ${gateWireInputX(finalPosition, circuitState.finalGateType)} ${targetY}" />`;
  }).join("");
  const finalOutputX = gateOutputX(finalPosition, circuitState.finalGateType);

  return `
    <svg class="logic-circuit-svg" viewBox="0 0 940 500" role="img" aria-label="3層論理回路">
      <text class="layer-label" x="58" y="32">入力</text>
      <text class="layer-label" x="210" y="32">第1層</text>
      ${evaluation.layer2.length > 0 ? '<text class="layer-label" x="460" y="32">第2層</text>' : ""}
      <text class="layer-label" x="735" y="32">第3層</text>
      ${inputNodes}
      ${sourceNodes}
      ${evaluation.layer2.length > 0 ? layer2Wires : ""}
      ${evaluation.layer2.length > 0 ? layer2Nodes : ""}
      ${evaluation.layer2.length > 0 ? finalWires : directWires}
      ${standardGateSymbol(circuitState.finalGateType, finalPosition, evaluation.finalValue, "Y", circuitState.finalGateType, `=${boolText(evaluation.finalValue)}`)}
      <path class="circuit-wire ${nodeClass(evaluation.finalValue)}" d="M${finalOutputX} ${finalPosition.y} L${outputPosition.x - 28} ${outputPosition.y}" />
      <g class="circuit-node output-node ${nodeClass(evaluation.finalValue)}">
        <circle cx="${outputPosition.x}" cy="${outputPosition.y}" r="28"></circle>
        <text x="${outputPosition.x}" y="${outputPosition.y + 6}">Y</text>
      </g>
    </svg>
  `;
}

function syncControls() {
  circuitElements.inputCount.value = String(circuitState.inputCount);
  circuitElements.layer2Count.value = String(circuitState.layer2Count);
  circuitElements.finalGateType.value = circuitState.finalGateType;
}

function renderCircuitPage() {
  normalizeLayer2Sources();
  renderInputToggles();
  renderGateControls();
  const evaluation = evaluateCircuit();
  circuitElements.outputBadge.textContent = `Y=${boolText(evaluation.finalValue)}`;
  circuitElements.outputBadge.classList.toggle("is-true", evaluation.finalValue);
  circuitElements.outputBadge.classList.toggle("is-false", !evaluation.finalValue);
  circuitElements.circuitStage.innerHTML = renderCircuitSvg(evaluation);
  renderSummary(evaluation);
  circuitElements.message.textContent = "";
}

function updateGateFromControl(control) {
  const gateIndex = Number(control.dataset.gateIndex);
  const gate = circuitState.layer2Gates[gateIndex];
  if (!gate) return;
  if (control.dataset.gateField === "type") gate.type = control.value;
  if (control.dataset.sourceIndex) gate.sources[Number(control.dataset.sourceIndex)] = control.value;
  renderCircuitPage();
}

function initializeCircuitPage() {
  if (!circuitElements.circuitStage) return;
  populatePresets();
  syncControls();
  circuitElements.presetSelect.addEventListener("change", () => applyPreset(Number(circuitElements.presetSelect.value)));
  circuitElements.randomCircuit.addEventListener("click", generateRandomCircuit);
  circuitElements.inputCount.addEventListener("change", () => {
    circuitState.inputCount = Number(circuitElements.inputCount.value);
    renderCircuitPage();
  });
  circuitElements.layer2Count.addEventListener("change", () => {
    circuitState.layer2Count = Number(circuitElements.layer2Count.value);
    renderCircuitPage();
  });
  circuitElements.finalGateType.addEventListener("change", () => {
    circuitState.finalGateType = FINAL_TYPES.includes(circuitElements.finalGateType.value) ? circuitElements.finalGateType.value : "OR";
    renderCircuitPage();
  });
  circuitElements.generateFromFormula.addEventListener("click", generateCircuitFromFormula);
  circuitElements.circuitSymbolButtons.forEach((button) => {
    button.addEventListener("click", () => insertSymbolIntoCircuitFormula(button.dataset.insertCircuitSymbol));
  });
  circuitElements.formulaInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    generateCircuitFromFormula();
  });
  circuitElements.inputToggleRow.addEventListener("click", (event) => {
    const button = event.target.closest("[data-input-name]");
    if (!button) return;
    const name = button.dataset.inputName;
    circuitState.inputValues[name] = !circuitState.inputValues[name];
    renderCircuitPage();
  });
  circuitElements.layer2ConfigList.addEventListener("change", (event) => {
    if (event.target.matches("select")) updateGateFromControl(event.target);
  });
  renderCircuitPage();
}

initializeCircuitPage();
