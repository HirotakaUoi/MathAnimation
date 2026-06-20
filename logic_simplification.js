const simplifyElements = {
  inputCount: document.querySelector("#inputCount"),
  presetSelect: document.querySelector("#presetSelect"),
  randomCircuit: document.querySelector("#randomCircuit"),
  termCount: document.querySelector("#termCount"),
  sourceFormulaInput: document.querySelector("#sourceFormulaInput"),
  generateFromSourceFormula: document.querySelector("#generateFromSourceFormula"),
  sourceSymbolButtons: document.querySelectorAll("[data-insert-source-symbol]"),
  simplifyButton: document.querySelector("#simplifyButton"),
  message: document.querySelector("#message"),
  summaryText: document.querySelector("#summaryText"),
  termCountBadge: document.querySelector("#termCountBadge"),
  originalExpression: document.querySelector("#originalExpression"),
  simplifiedExpression: document.querySelector("#simplifiedExpression"),
  karnaughStage: document.querySelector("#karnaughStage"),
  originalCircuitStage: document.querySelector("#originalCircuitStage"),
  simplifiedCircuitStage: document.querySelector("#simplifiedCircuitStage"),
};

const SIMPLIFY_INPUTS = ["A", "B", "C", "D"];
const V = (name) => ({ type: "var", name });
const N = (value) => ({ type: "not", value });
const G = (type, inputs) => ({ type, inputs });
const SIMPLIFY_PRESETS = [
  { label: "2入力: (A+B')A", inputCount: 2, source: G("and", [G("or", [V("A"), N(V("B"))]), V("A")]) },
  { label: "3入力: (A+B')C", inputCount: 3, source: G("and", [G("or", [V("A"), N(V("B"))]), V("C")]) },
  { label: "3入力: (A+B')+AC", inputCount: 3, source: G("or", [G("or", [V("A"), N(V("B"))]), G("and", [V("A"), V("C")])]) },
  { label: "3入力: (A+B)(A'+C)", inputCount: 3, source: G("and", [G("or", [V("A"), V("B")]), G("or", [N(V("A")), V("C")])]) },
  { label: "4入力: (A+B')(C+D)", inputCount: 4, source: G("and", [G("or", [V("A"), N(V("B"))]), G("or", [V("C"), V("D")])]) },
  { label: "4入力: (A+C')(B+D')", inputCount: 4, source: G("and", [G("or", [V("A"), N(V("C"))]), G("or", [V("B"), N(V("D"))])]) },
];

const simplificationState = {
  inputCount: 3,
  source: SIMPLIFY_PRESETS[1].source,
  dontCares: new Set(),
};

function escapeSimplifyHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function activeSimplifyInputs() {
  return SIMPLIFY_INPUTS.slice(0, simplificationState.inputCount);
}

function setSimplifyMessage(text = "") {
  simplifyElements.message.textContent = text;
}

function insertSourceSymbol(symbol) {
  const input = simplifyElements.sourceFormulaInput;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.value = `${input.value.slice(0, start)}${symbol}${input.value.slice(end)}`;
  input.focus();
  input.setSelectionRange(start + symbol.length, start + symbol.length);
}

function tokenizeSourceFormula(formula) {
  const tokens = [];
  let index = 0;
  const normalized = formula.replace(/\s+/g, "");
  while (index < normalized.length) {
    const char = normalized[index];
    if ("ABCD()+'".includes(char)) {
      tokens.push(char);
      index += 1;
      continue;
    }
    throw new Error(`${char} は使えません。`);
  }
  return tokens;
}

function parseSourceFormula(formula, variables) {
  const tokens = tokenizeSourceFormula(formula);
  let position = 0;

  function peek() {
    return tokens[position];
  }

  function consume(expected) {
    if (expected && peek() !== expected) throw new Error(`${expected} が必要です。`);
    return tokens[position++];
  }

  function parsePrimary() {
    const token = peek();
    if (variables.includes(token)) {
      consume();
      return V(token);
    }
    if (token === "(") {
      consume("(");
      const node = parseOr();
      consume(")");
      return node;
    }
    throw new Error("変数または括弧を入力してください。");
  }

  function parsePostfix() {
    let node = parsePrimary();
    while (peek() === "'") {
      consume("'");
      node = N(node);
    }
    return node;
  }

  function startsProduct(token) {
    return variables.includes(token) || token === "(";
  }

  function parseAnd() {
    const inputs = [parsePostfix()];
    while (startsProduct(peek())) inputs.push(parsePostfix());
    return inputs.length === 1 ? inputs[0] : G("and", inputs);
  }

  function parseOr() {
    const inputs = [parseAnd()];
    while (peek() === "+") {
      consume("+");
      inputs.push(parseAnd());
    }
    return inputs.length === 1 ? inputs[0] : G("or", inputs);
  }

  if (!tokens.length) throw new Error("論理式を入力してください。");
  const root = parseOr();
  if (position < tokens.length) throw new Error(`${tokens[position]} の位置を確認してください。`);
  return normalizeAssociativeSource(absorbSourceNegations(root));
}

function absorbSourceNegations(node) {
  if (node.type === "var") return V(node.name);
  if (node.type !== "not") return G(node.type, node.inputs.map(absorbSourceNegations));

  const value = absorbSourceNegations(node.value);
  if (value.type === "var") return N(value);
  if (value.type === "not") return absorbSourceNegations(value.value);
  const complementedType = {
    and: "nand",
    or: "nor",
    nand: "and",
    nor: "or",
    xor: "xnor",
    xnor: "xor",
  }[value.type];
  return complementedType ? G(complementedType, value.inputs) : N(value);
}

function normalizeAssociativeSource(node) {
  if (node.type === "var") return V(node.name);
  if (node.type === "not") return N(normalizeAssociativeSource(node.value));

  const inputs = node.inputs.map(normalizeAssociativeSource);
  if (node.type !== "and" && node.type !== "or") return G(node.type, inputs);
  return G(node.type, inputs.flatMap((input) => input.type === node.type ? input.inputs : [input]));
}

function sourceGateDepth(node) {
  if (node.type === "var") return 0;
  if (node.type === "not") return sourceGateDepth(node.value);
  return 1 + Math.max(0, ...node.inputs.map(sourceGateDepth));
}

function bitsForIndex(index, width) {
  return index.toString(2).padStart(width, "0");
}

function rowValues(index, variables) {
  const values = {};
  variables.forEach((name, variableIndex) => {
    values[name] = Boolean(index & (1 << (variables.length - variableIndex - 1)));
  });
  return values;
}

function makeImplicant(bits, minterms) {
  return { bits, minterms: [...minterms].sort((a, b) => a - b), used: false };
}

function combineBits(a, b) {
  let difference = 0;
  let combined = "";
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] === b[index]) {
      combined += a[index];
    } else if (a[index] !== "-" && b[index] !== "-") {
      difference += 1;
      combined += "-";
    } else {
      return null;
    }
  }
  return difference === 1 ? combined : null;
}

function uniqueImplicants(implicants) {
  const seen = new Map();
  implicants.forEach((implicant) => {
    const key = implicant.bits;
    if (!seen.has(key)) seen.set(key, makeImplicant(implicant.bits, implicant.minterms));
  });
  return [...seen.values()];
}

function primeImplicants(candidateMinterms, variableCount) {
  let current = candidateMinterms.map((minterm) => makeImplicant(bitsForIndex(minterm, variableCount), [minterm]));
  const primes = [];

  while (current.length) {
    const next = [];
    current.forEach((implicant) => {
      implicant.used = false;
    });

    for (let left = 0; left < current.length; left += 1) {
      for (let right = left + 1; right < current.length; right += 1) {
        const bits = combineBits(current[left].bits, current[right].bits);
        if (!bits) continue;
        current[left].used = true;
        current[right].used = true;
        next.push(makeImplicant(bits, [...new Set([...current[left].minterms, ...current[right].minterms])]));
      }
    }

    current.filter((implicant) => !implicant.used).forEach((implicant) => primes.push(implicant));
    current = uniqueImplicants(next);
  }

  return uniqueImplicants(primes);
}

function literalCount(implicant) {
  return implicant.bits.split("").filter((bit) => bit !== "-").length;
}

function chooseCover(requiredMinterms, primes) {
  const universe = new Set(requiredMinterms);
  const candidates = primes
    .map((prime) => ({ prime, covered: prime.minterms.filter((minterm) => universe.has(minterm)) }))
    .filter((entry) => entry.covered.length)
    .sort((a, b) => b.covered.length - a.covered.length || literalCount(a.prime) - literalCount(b.prime));
  let best = null;

  function score(selection) {
    return {
      terms: selection.length,
      literals: selection.reduce((sum, prime) => sum + literalCount(prime), 0),
    };
  }

  function isBetter(selection, currentBest) {
    if (!currentBest) return true;
    const nextScore = score(selection);
    const bestScore = score(currentBest);
    return nextScore.terms < bestScore.terms || (nextScore.terms === bestScore.terms && nextScore.literals < bestScore.literals);
  }

  function search(startIndex, selected, covered) {
    if (covered.size === universe.size) {
      if (isBetter(selected, best)) best = [...selected];
      return;
    }
    if (best && selected.length >= best.length) return;

    for (let index = startIndex; index < candidates.length; index += 1) {
      const entry = candidates[index];
      if (!entry.covered.some((minterm) => !covered.has(minterm))) continue;
      const nextCovered = new Set(covered);
      entry.covered.forEach((minterm) => nextCovered.add(minterm));
      selected.push(entry.prime);
      search(index + 1, selected, nextCovered);
      selected.pop();
    }
  }

  search(0, [], new Set());
  return (best || []).sort((a, b) => a.bits.localeCompare(b.bits));
}

function termExpression(implicant, variables) {
  if (implicant.bits.split("").every((bit) => bit === "-")) return "1";
  return implicant.bits.split("").map((bit, index) => {
    if (bit === "-") return "";
    return bit === "1" ? variables[index] : `${variables[index]}'`;
  }).join("");
}

function expressionForTerms(terms, variables) {
  if (!terms.length) return "0";
  return terms.map((term) => termExpression(term, variables)).join(" + ");
}

function simplifyMinterms(requiredMinterms, dontCares, variables) {
  if (requiredMinterms.length === 0) return { terms: [], expression: "0", primes: [] };
  const candidateMinterms = [...new Set([...requiredMinterms, ...dontCares])].sort((a, b) => a - b);
  if (candidateMinterms.length === 2 ** variables.length) {
    const all = makeImplicant("-".repeat(variables.length), candidateMinterms);
    return { terms: [all], expression: "1", primes: [all] };
  }
  const primes = primeImplicants(candidateMinterms, variables.length);
  const terms = chooseCover(requiredMinterms, primes);
  return { terms, expression: expressionForTerms(terms, variables), primes };
}

function termMatches(term, bits) {
  return term.bits.split("").every((bit, index) => bit === "-" || bit === bits[index]);
}

function evaluateTerms(terms, index, width) {
  const bits = bitsForIndex(index, width);
  return terms.some((term) => termMatches(term, bits));
}

function evaluateSource(node, values) {
  if (node.type === "var") return Boolean(values[node.name]);
  if (node.type === "not") return !evaluateSource(node.value, values);
  if (node.type === "and") return node.inputs.every((input) => evaluateSource(input, values));
  if (node.type === "or") return node.inputs.some((input) => evaluateSource(input, values));
  if (node.type === "nand") return !node.inputs.every((input) => evaluateSource(input, values));
  if (node.type === "nor") return !node.inputs.some((input) => evaluateSource(input, values));
  if (node.type === "xor") return node.inputs.filter((input) => evaluateSource(input, values)).length % 2 === 1;
  if (node.type === "xnor") return node.inputs.filter((input) => evaluateSource(input, values)).length % 2 === 0;
  return false;
}

function expressionForSource(node) {
  if (node.type === "var") return node.name;
  if (node.type === "not") {
    const body = node.value.type === "var" ? expressionForSource(node.value) : `(${expressionForSource(node.value)})`;
    return `${body}'`;
  }
  const joiner = node.type === "and" || node.type === "nand" ? "" : node.type === "xor" ? " xor " : node.type === "xnor" ? " xnor " : " + ";
  const body = node.inputs.map((input) => input.type === "var" || input.type === "not" ? expressionForSource(input) : `(${expressionForSource(input)})`).join(joiner);
  return node.type === "nand" || node.type === "nor" || node.type === "xnor" ? `(${body})'` : body;
}

function cloneSource(node) {
  if (node.type === "var") return V(node.name);
  if (node.type === "not") return N(cloneSource(node.value));
  return G(node.type, node.inputs.map(cloneSource));
}

function rowsFromCircuit(source, variables) {
  return Array.from({ length: 2 ** variables.length }, (_, index) => ({
    index,
    values: rowValues(index, variables),
    output: evaluateSource(source, rowValues(index, variables)),
    dontCare: simplificationState.dontCares.has(index),
  }));
}

function grayCodes(width) {
  if (width === 1) return ["0", "1"];
  if (width === 2) return ["00", "01", "11", "10"];
  return [""];
}

function cellClassForTerms(index, terms) {
  const matchIndex = terms.findIndex((term) => term.minterms.includes(index));
  return matchIndex >= 0 ? `is-covered cover-${matchIndex % 6}` : "";
}

function renderKarnaugh(rows, variables, terms) {
  const rowVariables = variables.length <= 2 ? variables.slice(0, 1) : variables.slice(0, 2);
  const columnVariables = variables.slice(rowVariables.length);
  const rowCodes = grayCodes(rowVariables.length);
  const columnCodes = grayCodes(columnVariables.length);
  const rowLabel = rowVariables.join("") || "0";
  const columnLabel = columnVariables.join("") || "0";
  const rowMap = new Map(rows.map((row) => [bitsForIndex(row.index, variables.length), row]));

  return `
    <table class="karnaugh-map karnaugh-map-editable">
      <thead>
        <tr><th>${rowLabel}\\${columnLabel}</th>${columnCodes.map((code) => `<th>${code}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rowCodes.map((rowCode) => `
          <tr>
            <th>${rowCode}</th>
            ${columnCodes.map((columnCode) => {
              const bits = `${rowCode}${columnCode}`;
              const row = rowMap.get(bits);
              const value = row.dontCare ? "d" : row.output ? "1" : "0";
              const className = row.dontCare ? "truth-dont-care" : row.output ? "truth-true" : "truth-false";
              return `
                <td class="${className} ${cellClassForTerms(row.index, terms)}">
                  <button type="button" data-minterm="${row.index}" aria-label="m${row.index} ${value}">
                    <span>${value}</span>
                    <small>m${row.index}</small>
                  </button>
                </td>
              `;
            }).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function wirePath(fromX, fromY, toX, toY) {
  const midX = (fromX + toX) / 2;
  return `M${fromX} ${fromY} C${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
}

function routedWirePath(fromX, fromY, toX, toY, offset = 0) {
  const midX = (fromX + toX) / 2 + offset;
  return `M${fromX} ${fromY} C${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
}

function circuitWire(d, options = null) {
  if (!options) return `<path class="circuit-wire is-true" d="${d}" />`;
  const attributes = [
    'data-interactive-wire="true"',
    `data-from-x="${options.fromX}"`,
    `data-from-y="${options.fromY}"`,
    `data-to-x="${options.toX}"`,
    `data-to-y="${options.toY}"`,
    `data-route="${options.route || "smooth"}"`,
    `data-offset="${options.offset || 0}"`,
  ];
  if (options.fromNode) attributes.push(`data-from-node="${options.fromNode}"`);
  if (options.toNode) attributes.push(`data-to-node="${options.toNode}"`);
  if (options.avoidNode) attributes.push(`data-avoid-node="${options.avoidNode}"`);
  if (options.avoidOutputX !== undefined) attributes.push(`data-avoid-output-x="${options.avoidOutputX}"`);
  return `<path class="circuit-wire is-true" ${attributes.join(" ")} d="${d}" />`;
}

function avoidNotWirePath(fromX, fromY, toX, toY, notPosition, notOutputXValue) {
  const clearanceY = notPosition.y < fromY ? notPosition.y + 64 : notPosition.y - 64;
  const passX = notOutputXValue + 76;
  const midX = (passX + toX) / 2;
  return `M${fromX} ${fromY} C${fromX + 58} ${fromY}, ${passX - 54} ${clearanceY}, ${passX} ${clearanceY} C${midX} ${clearanceY}, ${midX} ${toY}, ${toX} ${toY}`;
}

function draggableNodeAttributes(id, minX, maxX, y, halfHeight, label) {
  if (!id) return "";
  return `class="not-gate is-true draggable-circuit-node" data-draggable-node="${id}" data-node-min-x="${minX}" data-node-max-x="${maxX}" data-node-y="${y}" data-node-half-height="${halfHeight}" tabindex="0" role="button" aria-label="${escapeSimplifyHtml(label)}を上下に移動"`;
}

function gateDraggableAttributes(id, minX, maxX, y, halfHeight, label) {
  return `class="gate-node draggable-circuit-node" data-draggable-node="${id}" data-node-min-x="${minX}" data-node-max-x="${maxX}" data-node-y="${y}" data-node-half-height="${halfHeight}" tabindex="0" role="button" aria-label="${escapeSimplifyHtml(label)}を上下に移動"`;
}

function notGateSymbol(x, y, nodeId = "", label = "NOT") {
  const groupAttributes = nodeId
    ? draggableNodeAttributes(nodeId, x - 16, x + 25, y, 15, label)
    : 'class="not-gate is-true" aria-label="NOT"';
  return `
    <g ${groupAttributes}>
      ${nodeId ? "<title>上下にドラッグ</title>" : ""}
      <path class="not-gate-triangle is-true" d="M${x - 16} ${y - 15} L${x - 16} ${y + 15} L${x + 12} ${y} Z"></path>
      <circle class="not-gate-bubble is-true" cx="${x + 19}" cy="${y}" r="6"></circle>
      <text x="${x - 1}" y="${y + 5}">NOT</text>
    </g>
  `;
}

function gateOutputX(type, x) {
  if (type === "AND") return x + 30;
  if (type === "NAND") return x + 42;
  if (type === "NOR" || type === "XNOR") return x + 67;
  return x + 55;
}

function gateInputX(type, x, gateY, inputY) {
  if (type === "AND" || type === "NAND") return x - 46;
  const normalizedY = Math.min(1, Math.abs(inputY - gateY) / 34);
  return x - 45 + 23 * (1 - normalizedY * normalizedY);
}

function renderSourceCircuit(source, variables, labelText = "元の論理回路") {
  const nodes = [];
  const edges = [];
  let gateIndex = 0;
  let nodeSequence = 0;
  const literalNotOutputs = new Map();
  const inputY = new Map(variables.map((name, index) => [name, 88 + index * 72]));
  const inputNodes = variables.map((name) => `
    <g class="circuit-node input-node">
      <circle cx="58" cy="${inputY.get(name)}" r="22"></circle>
      <text x="58" y="${inputY.get(name) + 6}">${name}</text>
    </g>
  `).join("");

  function depth(node) {
    if (node.type === "var") return 0;
    if (node.type === "not") return depth(node.value) + 1;
    return Math.max(...node.inputs.map(depth)) + 1;
  }

  function leafCount(node) {
    if (node.type === "var") return 1;
    if (node.type === "not") return leafCount(node.value);
    return node.inputs.reduce((total, input) => total + leafCount(input), 0);
  }

  const maxDepth = Math.max(1, depth(source));
  const sourceLeafCount = leafCount(source);
  const leafGap = 88;
  const height = Math.max(300, variables.length * 72 + 110, sourceLeafCount * leafGap + 96);
  const xForDepth = (level) => 130 + level * Math.min(150, 560 / maxDepth);
  const layoutY = new WeakMap();
  let leafIndex = 0;

  function assignLayoutY(node) {
    if (node.type === "var") {
      const y = (height - (sourceLeafCount - 1) * leafGap) / 2 + leafIndex * leafGap;
      leafIndex += 1;
      layoutY.set(node, y);
      return y;
    }
    if (node.type === "not") {
      const y = assignLayoutY(node.value);
      layoutY.set(node, y);
      return y;
    }
    const childYs = node.inputs.map(assignLayoutY);
    const y = (childYs[0] + childYs[childYs.length - 1]) / 2;
    layoutY.set(node, y);
    return y;
  }

  assignLayoutY(source);

  function place(node, level) {
    if (node.type === "var") return { x: 80, y: inputY.get(node.name), label: node.name, nodeId: "" };
    if (node.type === "not") {
      if (node.value.type === "var" && literalNotOutputs.has(node.value.name)) {
        return literalNotOutputs.get(node.value.name);
      }
      const nodeId = `source-node-${nodeSequence++}`;
      const child = place(node.value, level - 1);
      const x = xForDepth(node.value.type === "var" ? 1 : level);
      const y = node.value.type === "var" ? inputY.get(node.value.name) : layoutY.get(node);
      nodes.push(notGateSymbol(x, y, nodeId));
      edges.push(circuitWire(wirePath(child.x, child.y, x - 16, y), {
        fromX: child.x,
        fromY: child.y,
        toX: x - 16,
        toY: y,
        fromNode: child.nodeId,
        toNode: nodeId,
      }));
      const output = { x: x + 25, y, label: "NOT", nodeId };
      if (node.value.type === "var") literalNotOutputs.set(node.value.name, output);
      return output;
    }
    const nodeId = `source-node-${nodeSequence++}`;
    const childSlots = node.inputs
      .map((input) => place(input, level - 1))
      .sort((a, b) => a.y - b.y);
    const x = xForDepth(level);
    const y = layoutY.get(node);
    const type = node.type.toUpperCase();
    const inputPins = childSlots.map((_, index) => ({
      y: y - ((childSlots.length - 1) * 16) / 2 + index * 16,
    })).map((pin) => ({ ...pin, x: gateInputX(type, x, y, pin.y) }));
    childSlots.forEach((child, index) => {
      const pin = inputPins[index];
      const offset = (index - (childSlots.length - 1) / 2) * 18;
      edges.push(circuitWire(routedWirePath(child.x, child.y, pin.x, pin.y, offset), {
        fromX: child.x,
        fromY: child.y,
        toX: pin.x,
        toY: pin.y,
        offset,
        fromNode: child.nodeId,
        toNode: nodeId,
      }));
    });
    gateIndex += 1;
    const gateLabel = `${type} G${gateIndex}`;
    const shape = type === "OR" || type === "NOR" || type === "XOR" || type === "XNOR"
      ? `<path class="gate-shape is-true" d="M${x - 45} ${y - 34} C${x - 15} ${y - 13}, ${x - 15} ${y + 13}, ${x - 45} ${y + 34} C${x - 12} ${y + 34}, ${x + 38} ${y + 21}, ${x + 55} ${y} C${x + 38} ${y - 21}, ${x - 12} ${y - 34}, ${x - 45} ${y - 34} Z"></path>`
      : `<path class="gate-shape is-true" d="M${x - 46} ${y - 30} L${x} ${y - 30} A30 30 0 0 1 ${x} ${y + 30} L${x - 46} ${y + 30} Z"></path>`;
    const bubble = type === "NAND" ? `<circle class="gate-bubble is-true" cx="${x + 36}" cy="${y}" r="6"></circle>` : type === "NOR" || type === "XNOR" ? `<circle class="gate-bubble is-true" cx="${x + 61}" cy="${y}" r="6"></circle>` : "";
    nodes.push(`
      <g ${gateDraggableAttributes(nodeId, x - 46, x + 67, y, 34, gateLabel)}>
        <title>上下にドラッグ</title>
        ${shape}
        ${bubble}
        <text class="gate-main-label" x="${x - 2}" y="${y - 3}">${type}</text>
        <text class="gate-value-label" x="${x - 2}" y="${y + 14}">G${gateIndex}</text>
        ${inputPins.map((pin) => `<circle class="gate-pin" cx="${pin.x}" cy="${pin.y}" r="2.2"></circle>`).join("")}
        <circle class="gate-pin" cx="${gateOutputX(type, x)}" cy="${y}" r="2.2"></circle>
      </g>
    `);
    return { x: gateOutputX(type, x), y, label: type, nodeId };
  }

  const output = place(source, maxDepth);
  const outputX = 820;
  const outputY = output.y;
  const outputWire = circuitWire(wirePath(output.x, output.y, outputX - 28, outputY), {
    fromX: output.x,
    fromY: output.y,
    toX: outputX - 28,
    toY: outputY,
    fromNode: output.nodeId,
  });
  return `
    <svg class="logic-simplified-circuit-svg" viewBox="0 0 880 ${height}" role="img" aria-label="${escapeSimplifyHtml(labelText)}">
      <text class="layer-label" x="58" y="32">入力</text>
      <text class="layer-label" x="430" y="32">元の回路</text>
      ${inputNodes}
      ${edges.join("")}
      ${nodes.join("")}
      ${outputWire}
      <g class="circuit-node output-node is-true">
        <circle cx="${outputX}" cy="${outputY}" r="28"></circle>
        <text x="${outputX}" y="${outputY + 6}">Y</text>
      </g>
    </svg>
  `;
}

function renderCircuit(terms, variables, expression, labelText = "論理回路") {
  if (expression === "0") return `<div class="logic-circuit-empty">出力は常に 0 です。</div>`;
  if (expression === "1") return `<div class="logic-circuit-empty">出力は常に 1 です。</div>`;

  const literalRows = terms.map((term) => ({
    term,
    literals: term.bits.split("").map((bit, index) => {
      if (bit === "-") return null;
      return {
        variable: variables[index],
        label: bit === "1" ? variables[index] : `${variables[index]}'`,
      };
    }).filter(Boolean),
  }));
  const usedVariables = variables.filter((variable) => literalRows.some((row) => row.literals.some((literal) => literal.variable === variable)));
  const height = Math.max(300, terms.length * 116 + 80, usedVariables.length * 76 + 92);
  const termStartY = 90;
  const termGap = terms.length > 3 ? 92 : 112;
  const inputGap = usedVariables.length > 3 ? 66 : 82;
  const inputStartY = (height - (usedVariables.length - 1) * inputGap) / 2;
  const inputPositions = new Map(usedVariables.map((name, index) => [name, { name, x: 58, y: inputStartY + index * inputGap }]));
  const termPositions = literalRows.map((row, index) => ({
    ...row,
    x: 480,
    y: termStartY + index * termGap,
    nodeId: `simple-term-${row.term.bits.replace(/-/g, "x")}`,
  }));
  const notGateX = 220;
  const notInputX = notGateX - 16;
  const notOutputX = notGateX + 25;
  const orX = 690;
  const outputX = 820;
  const outputY = height / 2;
  const invertedVariables = variables.filter((variable) => literalRows.some((row) => row.literals.some((literal) => literal.variable === variable && literal.label !== literal.variable)));
  const notPositions = new Map(invertedVariables.map((variable) => {
    const input = inputPositions.get(variable);
    return [variable, { x: notGateX, y: input.y, nodeId: `simple-not-${variable}` }];
  }));

  const inputNodes = usedVariables.map((name) => {
    const position = inputPositions.get(name);
    return `
    <g class="circuit-node input-node">
      <circle cx="${position.x}" cy="${position.y}" r="22"></circle>
      <text x="${position.x}" y="${position.y + 6}">${position.name}</text>
    </g>
  `;
  }).join("");

  const literalWireNodes = [];
  const notGateNodes = invertedVariables.map((variable) => {
    const input = inputPositions.get(variable);
    const notPosition = notPositions.get(variable);
    literalWireNodes.push(circuitWire(wirePath(input.x + 22, input.y, notInputX, notPosition.y), {
      fromX: input.x + 22,
      fromY: input.y,
      toX: notInputX,
      toY: notPosition.y,
      toNode: notPosition.nodeId,
    }));
    return notGateSymbol(notPosition.x, notPosition.y, notPosition.nodeId, `NOT ${variable}`);
  });
  termPositions.forEach((position) => {
    position.literals.forEach((literal, literalIndex) => {
    const input = inputPositions.get(literal.variable);
    const andInputY = position.y - ((position.literals.length - 1) * 16) / 2 + literalIndex * 16;
    const isInverted = literal.label !== literal.variable;
    if (!isInverted && position.literals.length === 1) return;
    if (!isInverted) {
      const notPosition = notPositions.get(literal.variable);
      if (notPosition) {
        literalWireNodes.push(circuitWire(avoidNotWirePath(input.x + 22, input.y, position.x - 46, andInputY, notPosition, notOutputX), {
          fromX: input.x + 22,
          fromY: input.y,
          toX: position.x - 46,
          toY: andInputY,
          toNode: position.nodeId,
          route: "avoid-not",
          avoidNode: notPosition.nodeId,
          avoidOutputX: notOutputX,
        }));
        return;
      }
      const routeOffset = (literalIndex - (position.literals.length - 1) / 2) * 22 + (input.y < andInputY ? -22 : 22);
      literalWireNodes.push(circuitWire(routedWirePath(input.x + 22, input.y, position.x - 46, andInputY, routeOffset), {
        fromX: input.x + 22,
        fromY: input.y,
        toX: position.x - 46,
        toY: andInputY,
        toNode: position.nodeId,
        offset: routeOffset,
      }));
      return;
    }
    const notPosition = notPositions.get(literal.variable);
    if (position.literals.length > 1) {
      const routeOffset = (literalIndex - (position.literals.length - 1) / 2) * 22 + (notPosition.y < andInputY ? -18 : 18);
      literalWireNodes.push(circuitWire(routedWirePath(notOutputX, notPosition.y, position.x - 46, andInputY, routeOffset), {
        fromX: notOutputX,
        fromY: notPosition.y,
        toX: position.x - 46,
        toY: andInputY,
        fromNode: notPosition.nodeId,
        toNode: position.nodeId,
        offset: routeOffset,
      }));
    }
    });
  });
  const literalWires = literalWireNodes.join("");
  const notGates = notGateNodes.join("");

  const termNodes = termPositions.map((position, index) => {
    if (position.literals.length === 1) return "";
    const andOutputX = position.x + 30;
    return `
      <g ${gateDraggableAttributes(position.nodeId, position.x - 46, position.x + 30, position.y, 30, `AND G${index + 1}`)}>
        <title>上下にドラッグ</title>
        <path class="gate-shape is-true" d="M${position.x - 46} ${position.y - 30} L${position.x} ${position.y - 30} A30 30 0 0 1 ${position.x} ${position.y + 30} L${position.x - 46} ${position.y + 30} Z"></path>
        <text class="gate-main-label" x="${position.x - 6}" y="${position.y - 3}">AND</text>
        <text class="gate-value-label" x="${position.x - 6}" y="${position.y + 14}">G${index + 1}</text>
        <circle class="gate-pin" cx="${andOutputX}" cy="${position.y}" r="2.2"></circle>
      </g>
    `;
  }).join("");

  const termOutputPoint = (position) => ({
    x: position.literals.length > 1 || position.literals[0].label !== position.literals[0].variable
      ? (position.literals.length > 1 ? position.x + 30 : notOutputX)
      : inputPositions.get(position.literals[0].variable).x + 22,
    y: position.literals.length > 1 || position.literals[0].label !== position.literals[0].variable
      ? (position.literals.length > 1 ? position.y : notPositions.get(position.literals[0].variable).y)
      : inputPositions.get(position.literals[0].variable).y,
    nodeId: position.literals.length > 1
      ? position.nodeId
      : position.literals[0].label !== position.literals[0].variable
        ? notPositions.get(position.literals[0].variable).nodeId
        : "",
  });
  function orInputX(targetY) {
    const normalizedY = Math.min(1, Math.abs(targetY - outputY) / 34);
    return orX - 45 + 23 * (1 - normalizedY * normalizedY);
  }

  const orInputTargets = new Array(terms.length);
  const termIndexesByOutputY = termPositions
    .map((position, index) => ({ index, y: termOutputPoint(position).y }))
    .sort((a, b) => a.y - b.y);
  termIndexesByOutputY.forEach(({ index }, rank) => {
    const y = outputY - ((terms.length - 1) * 18) / 2 + rank * 18;
    orInputTargets[index] = { x: orInputX(y), y };
  });
  const orGate = terms.length === 1 ? "" : `
    <g ${gateDraggableAttributes("simple-or", orX - 45, orX + 55, outputY, 34, "OR")}>
      <title>上下にドラッグ</title>
      <path class="gate-shape is-true" d="M${orX - 45} ${outputY - 34} C${orX - 15} ${outputY - 13}, ${orX - 15} ${outputY + 13}, ${orX - 45} ${outputY + 34} C${orX - 12} ${outputY + 34}, ${orX + 38} ${outputY + 21}, ${orX + 55} ${outputY} C${orX + 38} ${outputY - 21}, ${orX - 12} ${outputY - 34}, ${orX - 45} ${outputY - 34} Z"></path>
      <text class="gate-main-label" x="${orX + 2}" y="${outputY + 4}">OR</text>
      ${orInputTargets.map((target) => `<circle class="gate-pin" cx="${target.x}" cy="${target.y}" r="2.2"></circle>`).join("")}
    </g>
  `;
  const finalWires = termPositions.map((position, index) => {
    if (terms.length === 1) return "";
    const start = termOutputPoint(position);
    const target = orInputTargets[index];
    return circuitWire(wirePath(start.x, start.y, target.x, target.y), {
      fromX: start.x,
      fromY: start.y,
      toX: target.x,
      toY: target.y,
      fromNode: start.nodeId,
      toNode: "simple-or",
    });
  }).join("");
  const outputWire = terms.length === 1
    ? (() => {
      const start = termOutputPoint(termPositions[0]);
      return circuitWire(wirePath(start.x, start.y, outputX - 28, outputY), {
        fromX: start.x,
        fromY: start.y,
        toX: outputX - 28,
        toY: outputY,
        fromNode: start.nodeId,
      });
    })()
    : circuitWire(wirePath(orX + 55, outputY, outputX - 28, outputY), {
      fromX: orX + 55,
      fromY: outputY,
      toX: outputX - 28,
      toY: outputY,
      fromNode: "simple-or",
    });

  return `
    <svg class="logic-simplified-circuit-svg" viewBox="0 0 880 ${height}" role="img" aria-label="${escapeSimplifyHtml(labelText)}">
      <text class="layer-label" x="52" y="28">入力</text>
      <text class="layer-label" x="220" y="28">反転</text>
      <text class="layer-label" x="480" y="28">積項</text>
      ${terms.length > 1 ? `<text class="layer-label" x="${orX}" y="28">和</text>` : ""}
      ${inputNodes}
      ${literalWires}
      ${notGates}
      ${termNodes}
      ${terms.length > 1 ? finalWires : ""}
      ${orGate}
      ${outputWire}
      <g class="circuit-node output-node is-true">
        <circle cx="${outputX}" cy="${outputY}" r="28"></circle>
        <text x="${outputX}" y="${outputY + 6}">Y</text>
      </g>
    </svg>
  `;
}

function circuitNodeOffset(svg, nodeId) {
  if (!nodeId) return 0;
  const node = svg.querySelector(`[data-draggable-node="${nodeId}"]`);
  return node ? Number(node.dataset.nodeOffsetY || 0) : 0;
}

function updateInteractiveWires(svg) {
  svg.querySelectorAll("[data-interactive-wire]").forEach((wire) => {
    const fromX = Number(wire.dataset.fromX);
    const fromY = Number(wire.dataset.fromY) + circuitNodeOffset(svg, wire.dataset.fromNode);
    const toX = Number(wire.dataset.toX);
    const toY = Number(wire.dataset.toY) + circuitNodeOffset(svg, wire.dataset.toNode);
    if (wire.dataset.route === "avoid-not") {
      const avoidNode = svg.querySelector(`[data-draggable-node="${wire.dataset.avoidNode}"]`);
      const avoidPosition = {
        x: Number(wire.dataset.avoidOutputX) - 25,
        y: Number(avoidNode.dataset.nodeY) + Number(avoidNode.dataset.nodeOffsetY || 0),
      };
      wire.setAttribute("d", avoidNotWirePath(fromX, fromY, toX, toY, avoidPosition, Number(wire.dataset.avoidOutputX)));
      return;
    }
    wire.setAttribute("d", routedWirePath(fromX, fromY, toX, toY, Number(wire.dataset.offset || 0)));
  });
}

function movableNodeRange(svg, node, referenceY) {
  const halfHeight = Number(node.dataset.nodeHalfHeight);
  const viewBoxParts = svg.getAttribute("viewBox").split(/\s+/).map(Number);
  let minimum = 52 + halfHeight;
  let maximum = viewBoxParts[3] - 34 - halfHeight;
  const minX = Number(node.dataset.nodeMinX);
  const maxX = Number(node.dataset.nodeMaxX);
  const gap = 10;

  svg.querySelectorAll("[data-draggable-node]").forEach((other) => {
    if (other === node) return;
    const otherMinX = Number(other.dataset.nodeMinX);
    const otherMaxX = Number(other.dataset.nodeMaxX);
    if (Math.min(maxX, otherMaxX) <= Math.max(minX, otherMinX)) return;
    const otherY = Number(other.dataset.nodeY) + Number(other.dataset.nodeOffsetY || 0);
    const otherHalfHeight = Number(other.dataset.nodeHalfHeight);
    if (otherY < referenceY) {
      minimum = Math.max(minimum, otherY + otherHalfHeight + halfHeight + gap);
    } else {
      maximum = Math.min(maximum, otherY - otherHalfHeight - halfHeight - gap);
    }
  });
  return { minimum, maximum };
}

function moveCircuitNode(svg, node, requestedY, referenceY) {
  const baseY = Number(node.dataset.nodeY);
  const range = movableNodeRange(svg, node, referenceY);
  const y = Math.max(range.minimum, Math.min(range.maximum, requestedY));
  const offsetY = y - baseY;
  node.dataset.nodeOffsetY = String(offsetY);
  node.setAttribute("transform", `translate(0 ${offsetY})`);
  updateInteractiveWires(svg);
}

function initializeCircuitDragging(stage) {
  let dragState = null;

  stage.addEventListener("pointerdown", (event) => {
    const node = event.target.closest("[data-draggable-node]");
    if (!node || event.button !== 0) return;
    const svg = node.closest("svg");
    const viewBoxHeight = Number(svg.getAttribute("viewBox").split(/\s+/)[3]);
    dragState = {
      node,
      svg,
      pointerId: event.pointerId,
      startClientY: event.clientY,
      startY: Number(node.dataset.nodeY) + Number(node.dataset.nodeOffsetY || 0),
      scaleY: viewBoxHeight / svg.getBoundingClientRect().height,
    };
    node.setPointerCapture?.(event.pointerId);
    node.classList.add("is-dragging");
    event.preventDefault();
  });

  stage.addEventListener("pointermove", (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const requestedY = dragState.startY + (event.clientY - dragState.startClientY) * dragState.scaleY;
    moveCircuitNode(dragState.svg, dragState.node, requestedY, dragState.startY);
  });

  const finishDrag = (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    dragState.node.classList.remove("is-dragging");
    dragState = null;
  };
  stage.addEventListener("pointerup", finishDrag);
  stage.addEventListener("pointercancel", finishDrag);

  stage.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    const node = event.target.closest("[data-draggable-node]");
    if (!node) return;
    const svg = node.closest("svg");
    const currentY = Number(node.dataset.nodeY) + Number(node.dataset.nodeOffsetY || 0);
    moveCircuitNode(svg, node, currentY + (event.key === "ArrowUp" ? -8 : 8), currentY);
    event.preventDefault();
  });
}

function setSourceCircuit(inputCount, source) {
  simplificationState.inputCount = inputCount;
  simplificationState.source = cloneSource(source);
  simplificationState.dontCares = new Set();
  simplifyElements.inputCount.value = String(inputCount);
  simplifyElements.sourceFormulaInput.value = expressionForSource(simplificationState.source);
  renderPage({ preserveLayout: false });
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function directLiteralInfo(node) {
  if (node.type === "var") return { name: node.name, inverted: false };
  if (node.type === "not" && node.value.type === "var") return { name: node.value.name, inverted: true };
  return null;
}

function sourceSignature(node) {
  if (node.type === "var") return node.name;
  if (node.type === "not") return `!${sourceSignature(node.value)}`;
  return `${node.type}(${node.inputs.map(sourceSignature).sort().join(",")})`;
}

function hasConflictingGateInput(inputs, candidate) {
  const literal = directLiteralInfo(candidate);
  if (literal && inputs.some((input) => {
    const existing = directLiteralInfo(input);
    return existing && existing.name === literal.name;
  })) return true;

  const signature = sourceSignature(candidate);
  return inputs.some((input) => sourceSignature(input) === signature);
}

function hasConflictingGateInputs(node) {
  if (node.type === "var") return false;
  if (node.type === "not") return hasConflictingGateInputs(node.value);

  const accepted = [];
  for (const input of node.inputs) {
    if (hasConflictingGateInput(accepted, input) || hasConflictingGateInputs(input)) return true;
    accepted.push(input);
  }
  return false;
}

function randomSource(inputCount, depth = 0, maxDepth = 2, complexity = 3) {
  const variables = SIMPLIFY_INPUTS.slice(0, inputCount);
  const leafChance = Math.max(0.18, 0.62 - complexity * 0.08);
  if (depth >= maxDepth || (depth > 0 && Math.random() < leafChance)) {
    const base = V(randomChoice(variables));
    return Math.random() < 0.28 ? N(base) : base;
  }
  const type = randomChoice(["and", "or", "nand", "nor", "xor", "xnor"]);
  const size = Math.min(inputCount, Math.random() < Math.max(0.4, 0.9 - complexity * 0.08) ? 2 : 3);
  const inputs = [];
  for (let index = 0; index < size; index += 1) {
    let candidate = randomSource(inputCount, depth + 1, maxDepth, complexity);
    for (let attempt = 0; attempt < 24 && hasConflictingGateInput(inputs, candidate); attempt += 1) {
      candidate = randomSource(inputCount, depth + 1, maxDepth, complexity);
    }
    if (hasConflictingGateInput(inputs, candidate)) {
      const usedNames = new Set(inputs.map(directLiteralInfo).filter(Boolean).map((literal) => literal.name));
      const fallbackName = variables.find((name) => !usedNames.has(name) && !hasConflictingGateInput(inputs, V(name)));
      candidate = V(fallbackName);
    }
    inputs.push(candidate);
  }
  return G(type, inputs);
}

function generateRandomCircuit() {
  const inputCount = Number(simplifyElements.inputCount.value);
  const complexity = Number(simplifyElements.termCount.value);
  simplificationState.inputCount = inputCount;
  simplificationState.source = randomSource(inputCount, 0, 2, complexity);
  simplificationState.dontCares = new Set();
  simplifyElements.presetSelect.value = "random";
  simplifyElements.sourceFormulaInput.value = expressionForSource(simplificationState.source);
  renderPage({ preserveLayout: false });
}

function generateFromSourceFormula() {
  const variables = activeSimplifyInputs();
  try {
    const source = parseSourceFormula(simplifyElements.sourceFormulaInput.value, variables);
    if (sourceGateDepth(source) > 2) {
      throw new Error("否定を除き、論理ゲートは2段までにしてください。");
    }
    if (hasConflictingGateInputs(source)) {
      throw new Error("同じ素子に同じ入力や、その否定を重複して接続できません。");
    }
    simplificationState.source = source;
    simplificationState.dontCares = new Set();
    simplifyElements.presetSelect.value = "custom";
    renderPage({ preserveLayout: false });
  } catch (error) {
    setSimplifyMessage(error.message);
  }
}

function captureCircuitLayout(stage) {
  return new Map([...stage.querySelectorAll("[data-draggable-node]")].map((node) => [
    node.dataset.draggableNode,
    Number(node.dataset.nodeOffsetY || 0),
  ]));
}

function restoreCircuitLayout(stage, offsets) {
  const svg = stage.querySelector("svg");
  if (!svg) return;
  svg.querySelectorAll("[data-draggable-node]").forEach((node) => {
    const offset = offsets.get(node.dataset.draggableNode);
    if (offset === undefined || offset === 0) return;
    const baseY = Number(node.dataset.nodeY);
    moveCircuitNode(svg, node, baseY + offset, baseY);
  });
}

function renderPage({ preserveLayout = true } = {}) {
  const originalLayout = preserveLayout ? captureCircuitLayout(simplifyElements.originalCircuitStage) : new Map();
  const simplifiedLayout = preserveLayout ? captureCircuitLayout(simplifyElements.simplifiedCircuitStage) : new Map();
  const variables = activeSimplifyInputs();
  const rows = rowsFromCircuit(simplificationState.source, variables);
  const requiredMinterms = rows.filter((row) => row.output && !row.dontCare).map((row) => row.index);
  const dontCares = rows.filter((row) => row.dontCare).map((row) => row.index);
  const simplified = simplifyMinterms(requiredMinterms, dontCares, variables);
  const originalExpression = expressionForSource(simplificationState.source);

  simplifyElements.originalExpression.textContent = originalExpression;
  simplifyElements.simplifiedExpression.textContent = simplified.expression;
  simplifyElements.termCountBadge.textContent = `${simplified.terms.length}項`;
  simplifyElements.summaryText.textContent = `1 は ${requiredMinterms.length ? requiredMinterms.map((item) => `m${item}`).join(", ") : "なし"}。d は ${dontCares.length ? dontCares.map((item) => `m${item}`).join(", ") : "未指定"}。`;
  simplifyElements.karnaughStage.innerHTML = renderKarnaugh(rows, variables, simplified.terms);
  simplifyElements.originalCircuitStage.innerHTML = renderSourceCircuit(simplificationState.source, variables, "元の論理回路");
  simplifyElements.simplifiedCircuitStage.innerHTML = renderCircuit(simplified.terms, variables, simplified.expression, "簡略化後の論理回路");
  restoreCircuitLayout(simplifyElements.originalCircuitStage, originalLayout);
  restoreCircuitLayout(simplifyElements.simplifiedCircuitStage, simplifiedLayout);
  setSimplifyMessage("");
}

function populatePresets() {
  simplifyElements.presetSelect.innerHTML = [
    ...SIMPLIFY_PRESETS.map((preset, index) => `<option value="${index}">${escapeSimplifyHtml(preset.label)}</option>`),
    '<option value="custom">入力式</option>',
    '<option value="random">ランダム生成</option>',
  ].join("");
}

function applyPreset(index) {
  const preset = SIMPLIFY_PRESETS[index] ?? SIMPLIFY_PRESETS[1];
  simplifyElements.presetSelect.value = String(index);
  setSourceCircuit(preset.inputCount, preset.source);
}

function toggleDontCare(minterm) {
  if (simplificationState.dontCares.has(minterm)) {
    simplificationState.dontCares.delete(minterm);
  } else {
    simplificationState.dontCares.add(minterm);
  }
  renderPage();
}

function initializeSimplificationPage() {
  if (!simplifyElements.simplifyButton) return;
  populatePresets();
  simplifyElements.presetSelect.addEventListener("change", () => {
    if (simplifyElements.presetSelect.value === "random") {
      generateRandomCircuit();
      return;
    }
    applyPreset(Number(simplifyElements.presetSelect.value));
  });
  simplifyElements.inputCount.addEventListener("change", generateRandomCircuit);
  simplifyElements.termCount.addEventListener("change", generateRandomCircuit);
  simplifyElements.randomCircuit.addEventListener("click", generateRandomCircuit);
  simplifyElements.generateFromSourceFormula.addEventListener("click", generateFromSourceFormula);
  simplifyElements.sourceFormulaInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    generateFromSourceFormula();
  });
  simplifyElements.sourceSymbolButtons.forEach((button) => {
    button.addEventListener("click", () => insertSourceSymbol(button.dataset.insertSourceSymbol));
  });
  simplifyElements.simplifyButton.addEventListener("click", () => renderPage());
  simplifyElements.karnaughStage.addEventListener("click", (event) => {
    const button = event.target.closest("[data-minterm]");
    if (!button) return;
    toggleDontCare(Number(button.dataset.minterm));
  });
  initializeCircuitDragging(simplifyElements.originalCircuitStage);
  initializeCircuitDragging(simplifyElements.simplifiedCircuitStage);
  applyPreset(1);
}

initializeSimplificationPage();
