const MAX_SIZE = 4;
const EPSILON = 1e-9;
const MAX_RATIONAL_DENOMINATOR = 1000;

const state = {
  rowsA: 2,
  colsA: 2,
  rowsB: 2,
  colsB: 2,
  operation: "add",
  timerIds: [],
};

const elements = {
  workspace: document.querySelector(".workspace"),
  rowsA: document.querySelector("#rowsA"),
  colsA: document.querySelector("#colsA"),
  rowsB: document.querySelector("#rowsB"),
  colsB: document.querySelector("#colsB"),
  operation: document.querySelector("#operation"),
  randomize: document.querySelector("#randomize"),
  fitDimensions: document.querySelector("#fitDimensions"),
  animate: document.querySelector("#animate"),
  matrixA: document.querySelector("#matrixA"),
  matrixB: document.querySelector("#matrixB"),
  matrixResult: document.querySelector("#matrixResult"),
  labelA: document.querySelector("#labelA"),
  labelB: document.querySelector("#labelB"),
  labelR: document.querySelector("#labelR"),
  message: document.querySelector("#message"),
  operatorGlyph: document.querySelector("#operatorGlyph"),
  dimensionStatus: document.querySelector("#dimensionStatus"),
  operationStatus: document.querySelector("#operationStatus"),
  divisionDetail: document.querySelector("#divisionDetail"),
  animationTrack: document.querySelector("#animationTrack"),
  formula: document.querySelector("#formula"),
  formulaTitle: document.querySelector("#formulaTitle"),
  historyList: document.querySelector("#historyList"),
};

function clampSize(value) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return 1;
  return Math.min(MAX_SIZE, Math.max(1, number));
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "NaN";
  const rounded = Math.abs(value) < EPSILON ? 0 : value;
  if (Number.isInteger(rounded)) return String(rounded);

  const rational = approximateRational(rounded);
  if (rational) {
    const sign = rational.numerator < 0 ? "-" : "";
    return `${sign}${Math.abs(rational.numerator)}/${rational.denominator}`;
  }

  return rounded.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function approximateRational(value) {
  const sign = value < 0 ? -1 : 1;
  const absolute = Math.abs(value);
  let bestNumerator = 0;
  let bestDenominator = 1;
  let bestError = Number.POSITIVE_INFINITY;

  for (let denominator = 1; denominator <= MAX_RATIONAL_DENOMINATOR; denominator += 1) {
    const numerator = Math.round(absolute * denominator);
    const error = Math.abs(absolute - numerator / denominator);
    if (error < bestError) {
      bestNumerator = numerator;
      bestDenominator = denominator;
      bestError = error;
    }
    if (error < EPSILON) break;
  }

  if (bestDenominator === 1 || bestError > 1e-8) return null;
  return {
    numerator: sign * bestNumerator,
    denominator: bestDenominator,
  };
}

function tokenizeExpression(source) {
  const tokens = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      const match = source.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
      if (!match) throw new Error(`数値を読み取れません: ${source}`);
      tokens.push({ type: "number", value: Number.parseFloat(match[0]) });
      index += match[0].length;
      continue;
    }

    if (/[a-z]/i.test(char)) {
      const match = source.slice(index).match(/^[a-z]+/i);
      tokens.push({ type: "name", value: match[0].toLowerCase() });
      index += match[0].length;
      continue;
    }

    if ("+-*/()".includes(char)) {
      tokens.push({ type: char, value: char });
      index += 1;
      continue;
    }

    throw new Error(`使えない文字があります: ${char}`);
  }

  tokens.push({ type: "eof" });
  return tokens;
}

function parseExpressionValue(source) {
  const trimmed = String(source || "").trim();
  if (!trimmed) return 0;

  const tokens = tokenizeExpression(trimmed);
  let position = 0;

  function peek() {
    return tokens[position];
  }

  function consume(type) {
    if (peek().type !== type) throw new Error(`"${type}" が必要です。`);
    position += 1;
  }

  function parsePrimary() {
    const token = peek();

    if (token.type === "number") {
      position += 1;
      return token.value;
    }

    if (token.type === "name") {
      position += 1;
      const name = token.value;
      if (name === "pi") return Math.PI;
      if (name === "e") return Math.E;

      consume("(");
      const argument = parseExpression();
      consume(")");

      if (name === "sqrt") {
        if (argument < 0) throw new Error("sqrt() には 0 以上の数を入れてください。");
        return Math.sqrt(argument);
      }

      const radians = (argument * Math.PI) / 180;
      if (name === "sin") return Math.sin(radians);
      if (name === "cos") return Math.cos(radians);
      if (name === "tan") return Math.tan(radians);
      throw new Error(`未対応の関数です: ${name}()`);
    }

    if (token.type === "(") {
      consume("(");
      const value = parseExpression();
      consume(")");
      return value;
    }

    throw new Error("式を読み取れません。");
  }

  function parseUnary() {
    if (peek().type === "+") {
      consume("+");
      return parseUnary();
    }
    if (peek().type === "-") {
      consume("-");
      return -parseUnary();
    }
    return parsePrimary();
  }

  function parseTerm() {
    let value = parseUnary();
    while (peek().type === "*" || peek().type === "/") {
      const operator = peek().type;
      consume(operator);
      const right = parseUnary();
      if (operator === "/" && Math.abs(right) < EPSILON) throw new Error("0 で割る式は使えません。");
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  }

  function parseExpression() {
    let value = parseTerm();
    while (peek().type === "+" || peek().type === "-") {
      const operator = peek().type;
      consume(operator);
      const right = parseTerm();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }

  const value = parseExpression();
  if (peek().type !== "eof") throw new Error("式の末尾を読み取れません。");
  if (!Number.isFinite(value)) throw new Error("計算結果が有限の数になりません。");
  return value;
}

function operationSymbol(operation = state.operation) {
  return {
    add: "+",
    subtract: "-",
    multiply: "x",
    divide: "÷",
  }[operation];
}

function operationLabel(operation = state.operation) {
  return {
    add: "A + B",
    subtract: "A - B",
    multiply: "A x B",
    divide: "A ÷ B",
  }[operation];
}

function operationFormula(operation = state.operation) {
  return {
    add: "C = A + B,  Cij = Aij + Bij",
    subtract: "C = A - B,  Cij = Aij - Bij",
    multiply: "C = A x B,  Cij = Σk(Aik x Bkj)",
    divide: "A ÷ B = A x B^-1,  Cij = Σk(Aik x (B^-1)kj)",
  }[operation];
}

function updateStateFromInputs() {
  state.rowsA = clampSize(elements.rowsA.value);
  state.colsA = clampSize(elements.colsA.value);
  state.rowsB = clampSize(elements.rowsB.value);
  state.colsB = clampSize(elements.colsB.value);
  state.operation = elements.operation.value;
  elements.rowsA.value = state.rowsA;
  elements.colsA.value = state.colsA;
  elements.rowsB.value = state.rowsB;
  elements.colsB.value = state.colsB;
}

function setGrid(element, rows, cols) {
  element.style.gridTemplateColumns = `repeat(${cols}, minmax(var(--matrix-cell-min, 0px), 1fr))`;
  element.dataset.rows = rows;
  element.dataset.cols = cols;
}

function createMatrixInputs(container, rows, cols, prefix) {
  const previous = readRawMatrix(container);
  container.innerHTML = "";
  setGrid(container, rows, cols);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "decimal";
      input.spellcheck = false;
      input.className = "cell-input";
      input.value = previous[row]?.[col] ?? randomInteger();
      input.ariaLabel = `${prefix}${row + 1}${col + 1}`;
      input.dataset.matrix = prefix;
      input.dataset.row = row;
      input.dataset.col = col;
      container.append(input);
    }
  }
}

function readRawMatrix(container) {
  const rows = Number.parseInt(container.dataset.rows || "0", 10);
  const cols = Number.parseInt(container.dataset.cols || "0", 10);
  const cells = Array.from(container.querySelectorAll("input"));
  const matrix = [];

  for (let row = 0; row < rows; row += 1) {
    const line = [];
    for (let col = 0; col < cols; col += 1) {
      line.push(cells[row * cols + col]?.value || "0");
    }
    matrix.push(line);
  }

  return matrix;
}

function renderResultGrid(rows, cols, values = []) {
  elements.matrixResult.innerHTML = "";
  setGrid(elements.matrixResult, rows, cols);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = document.createElement("div");
      cell.className = "cell-output";
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.textContent = values[row]?.[col] === undefined ? "?" : formatNumber(values[row][col]);
      elements.matrixResult.append(cell);
    }
  }
}

function readMatrix(container) {
  const rows = Number.parseInt(container.dataset.rows || "0", 10);
  const cols = Number.parseInt(container.dataset.cols || "0", 10);
  const cells = Array.from(container.querySelectorAll("input"));
  const matrix = [];

  for (let row = 0; row < rows; row += 1) {
    const line = [];
    for (let col = 0; col < cols; col += 1) {
      const cell = cells[row * cols + col];
      const rawValue = cell?.value || "0";
      try {
        line.push(parseExpressionValue(rawValue));
        cell?.classList.remove("invalid");
      } catch (error) {
        cell?.classList.add("invalid");
        const matrixName = container === elements.matrixA ? "A" : "B";
        throw new Error(`${matrixName}${row + 1}${col + 1}: ${error.message}`);
      }
    }
    matrix.push(line);
  }

  return matrix;
}

function randomInteger() {
  const value = Math.floor(Math.random() * 11) - 5;
  return value === 0 ? 1 : value;
}

function randomizeMatrix(container) {
  container.querySelectorAll("input").forEach((input) => {
    input.value = randomInteger();
  });
}

function addMatrices(a, b) {
  return a.map((row, i) => row.map((value, j) => value + b[i][j]));
}

function subtractMatrices(a, b) {
  return a.map((row, i) => row.map((value, j) => value - b[i][j]));
}

function multiplyMatrices(a, b) {
  return a.map((row) => b[0].map((_, colIndex) => row.reduce((sum, value, k) => sum + value * b[k][colIndex], 0)));
}

function identity(size) {
  return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, col) => (row === col ? 1 : 0)));
}

function inverseMatrix(matrix) {
  const size = matrix.length;
  const left = matrix.map((row) => row.slice());
  const right = identity(size);

  for (let col = 0; col < size; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < size; row += 1) {
      if (Math.abs(left[row][col]) > Math.abs(left[pivot][col])) pivot = row;
    }

    if (Math.abs(left[pivot][col]) < EPSILON) {
      throw new Error("B の逆行列が存在しません。ランダム生成するか、B を正則行列にしてください。");
    }

    [left[col], left[pivot]] = [left[pivot], left[col]];
    [right[col], right[pivot]] = [right[pivot], right[col]];

    const divisor = left[col][col];
    for (let j = 0; j < size; j += 1) {
      left[col][j] /= divisor;
      right[col][j] /= divisor;
    }

    for (let row = 0; row < size; row += 1) {
      if (row === col) continue;
      const factor = left[row][col];
      for (let j = 0; j < size; j += 1) {
        left[row][j] -= factor * left[col][j];
        right[row][j] -= factor * right[col][j];
      }
    }
  }

  return right;
}

function validateDimensions() {
  if (["add", "subtract"].includes(state.operation) && (state.rowsA !== state.rowsB || state.colsA !== state.colsB)) {
    return "加算・減算では A と B のサイズを同じにしてください。";
  }

  if (state.operation === "multiply" && state.colsA !== state.rowsB) {
    return "乗算では A の列数と B の行数を同じにしてください。";
  }

  if (state.operation === "divide") {
    if (state.rowsB !== state.colsB) return "除算では B が正方行列である必要があります。";
    if (state.colsA !== state.rowsB) return "除算 A ÷ B では A の列数と B の行数を同じにしてください。";
  }

  return "";
}

function calculate() {
  const a = readMatrix(elements.matrixA);
  const b = readMatrix(elements.matrixB);
  const dimensionError = validateDimensions();
  if (dimensionError) throw new Error(dimensionError);

  if (state.operation === "add") return { a, b, result: addMatrices(a, b), bWorking: b };
  if (state.operation === "subtract") return { a, b, result: subtractMatrices(a, b), bWorking: b };
  if (state.operation === "multiply") return { a, b, result: multiplyMatrices(a, b), bWorking: b };

  const inverse = inverseMatrix(b);
  return { a, b, result: multiplyMatrices(a, inverse), bWorking: inverse, inverse };
}

function resultDimensions() {
  if (["add", "subtract"].includes(state.operation)) return [state.rowsA, state.colsA];
  return [state.rowsA, state.colsB];
}

function syncLayout() {
  updateStateFromInputs();
  createMatrixInputs(elements.matrixA, state.rowsA, state.colsA, "A");
  createMatrixInputs(elements.matrixB, state.rowsB, state.colsB, "B");
  const [resultRows, resultCols] = resultDimensions();
  renderResultGrid(resultRows, resultCols);
  elements.labelA.textContent = `${state.rowsA} x ${state.colsA}`;
  elements.labelB.textContent = `${state.rowsB} x ${state.colsB}`;
  elements.labelR.textContent = `${resultRows} x ${resultCols}`;
  elements.dimensionStatus.textContent = `${state.rowsA} x ${state.colsA}`;
  elements.operationStatus.textContent = operationLabel();
  elements.operatorGlyph.textContent = operationSymbol();
  elements.message.textContent = validateDimensions();
  clearAnimation();
}

function fitDimensionsToOperation() {
  updateStateFromInputs();

  if (["add", "subtract"].includes(state.operation)) {
    state.rowsB = state.rowsA;
    state.colsB = state.colsA;
  }

  if (state.operation === "multiply") {
    state.rowsB = state.colsA;
  }

  if (state.operation === "divide") {
    state.rowsB = state.colsA;
    state.colsB = state.colsA;
  }

  elements.rowsA.value = state.rowsA;
  elements.colsA.value = state.colsA;
  elements.rowsB.value = state.rowsB;
  elements.colsB.value = state.colsB;
  syncLayout();
}

function clearAnimation() {
  state.timerIds.forEach((timerId) => window.clearTimeout(timerId));
  state.timerIds = [];
  elements.animationTrack.innerHTML = "";
  elements.historyList.innerHTML = "";
  elements.formulaTitle.textContent = "計算公式";
  elements.formula.textContent = `${operationFormula()}。例: sin(30), cos(60), tan(45), sqrt(2), 1/2 + sqrt(3) が使えます。`;
  elements.matrixResult.querySelectorAll(".cell-output").forEach((cell) => cell.classList.remove("active"));
  clearReferenceHighlights();
  clearDivisionDetail();
}

function clearRunningAnimation() {
  state.timerIds.forEach((timerId) => window.clearTimeout(timerId));
  state.timerIds = [];
  elements.animationTrack.innerHTML = "";
  elements.historyList.innerHTML = "";
  elements.matrixResult.querySelectorAll(".cell-output").forEach((cell) => cell.classList.remove("active"));
  clearReferenceHighlights();
}

function flowCell(text, className) {
  const cell = document.createElement("div");
  cell.className = `flow-cell ${className}`;
  cell.textContent = text;
  return cell;
}

function clearDivisionDetail() {
  elements.divisionDetail.innerHTML = "";
  elements.divisionDetail.hidden = true;
  elements.workspace.classList.remove("has-division-detail");
}

function renderMiniMatrix(matrix, options = {}) {
  const matrixElement = document.createElement("div");
  matrixElement.className = `matrix-output mini-matrix${options.className ? ` ${options.className}` : ""}`;
  setGrid(matrixElement, matrix.length, matrix[0].length);

  matrix.forEach((line, row) => {
    line.forEach((value, col) => {
      const cell = document.createElement("div");
      cell.className = "cell-output";
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.textContent = options.pending ? "?" : formatNumber(value);
      matrixElement.append(cell);
    });
  });

  return matrixElement;
}

function renderMatrixTerm(label, matrix, options = {}) {
  const term = document.createElement("div");
  term.className = `equation-term${options.clickable || options.href ? " clickable-term" : ""}`;

  const title = document.createElement("div");
  title.className = "equation-label";
  title.append(renderLabel(label));
  term.append(title, renderMiniMatrix(matrix, options));

  if (options.href) {
    const link = document.createElement("a");
    link.className = "equation-link";
    link.href = options.href;
    link.ariaLabel = `${label} の求め方を開く`;
    link.title = `${label} の求め方を開く`;
    link.append(term);
    return link;
  }

  if (!options.clickable) return term;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "equation-button";
  button.ariaLabel = `${label} を確認`;
  button.title = `${label} を確認`;
  button.append(term);
  return button;
}

function renderLabel(label) {
  const fragment = document.createDocumentFragment();
  const inverseSuffix = "^-1";
  const inverseIndex = label.indexOf(inverseSuffix);

  if (inverseIndex === -1) {
    fragment.append(document.createTextNode(label));
    return fragment;
  }

  fragment.append(document.createTextNode(label.slice(0, inverseIndex)));
  const superscript = document.createElement("sup");
  superscript.textContent = "-1";
  fragment.append(superscript, document.createTextNode(label.slice(inverseIndex + inverseSuffix.length)));
  return fragment;
}

function renderEquationRow(parts, className = "") {
  const row = document.createElement("div");
  row.className = `equation-row${className ? ` ${className}` : ""}`;

  parts.forEach((part) => {
    if (typeof part === "string") {
      const operator = document.createElement("div");
      operator.className = "equation-operator";
      operator.textContent = part;
      row.append(operator);
      return;
    }
    row.append(part);
  });

  return row;
}

function renderDivisionDetail(calculation) {
  if (state.operation !== "divide" || !calculation.inverse) {
    clearDivisionDetail();
    return;
  }

  elements.divisionDetail.hidden = false;
  elements.workspace.classList.add("has-division-detail");
  elements.divisionDetail.innerHTML = "";

  const proofSlot = document.createElement("div");
  proofSlot.className = "inverse-proof-slot";

  const inverseTerm = renderMatrixTerm("B^-1", calculation.inverse, {
    clickable: true,
    className: "inverse-matrix",
  });
  inverseTerm.addEventListener("click", () => showInverseProof(calculation, proofSlot));

  const multiplyRow = renderEquationRow(
    [renderMatrixTerm("A", calculation.a), "x", inverseTerm, "=", renderMatrixTerm("Result", calculation.result)],
    "multiply-equivalent",
  );

  const note = document.createElement("div");
  note.className = "division-note";
  note.textContent = "A ÷ B = A x B^-1 として、逆行列を表示してから乗算へ進みます。B^-1 をクリックすると B x B^-1 = I を確認できます。";

  elements.divisionDetail.append(note, proofSlot, multiplyRow);
}

function inversePageUrl(matrix) {
  const params = new URLSearchParams();
  params.set("n", String(matrix.length));
  params.set("matrix", JSON.stringify(matrix));
  return `./inverse_matrix.html?${params.toString()}`;
}

function showInverseProof(calculation, proofSlot) {
  clearRunningAnimation();
  proofSlot.innerHTML = "";

  const product = multiplyMatrices(calculation.b, calculation.inverse);
  const identityMatrix = identity(calculation.b.length);
  const resultTerm = renderMatrixTerm("I", identityMatrix, { pending: true, className: "proof-result" });
  const proofRow = renderEquationRow(
    [
      renderMatrixTerm("B", calculation.b, { className: "proof-b" }),
      "x",
      renderMatrixTerm("B^-1", calculation.inverse, {
        href: inversePageUrl(calculation.b),
        className: "proof-inverse",
      }),
      "=",
      resultTerm,
    ],
    "inverse-proof",
  );
  proofSlot.append(proofRow);

  const resultCells = Array.from(proofRow.querySelectorAll(".proof-result .cell-output"));
  const steps = [];
  for (let row = 0; row < product.length; row += 1) {
    for (let col = 0; col < product[0].length; col += 1) {
      const terms = calculation.b[row].map((value, k) => ({
        b: value,
        inverse: calculation.inverse[k][col],
      }));
      const expression = terms.map((term) => `${formatNumber(term.b)} x ${formatNumber(term.inverse)}`).join(" + ");
      const flow = [];
      terms.forEach((term, index) => {
        if (index > 0) flow.push(flowCell("+", "operator"));
        flow.push(flowCell(`${formatNumber(term.b)} x ${formatNumber(term.inverse)}`, "source-b"));
      });
      flow.push(flowCell("=", "operator"), flowCell(formatNumber(product[row][col]), "result"));
      steps.push({
        row,
        col,
        title: `I${row + 1}${col + 1}`,
        text: `${expression} = ${formatNumber(product[row][col])}`,
        flow,
      });
    }
  }

  elements.formulaTitle.textContent = "検算公式";
  elements.formula.textContent = "B x B^-1 = I。B と B^-1 を掛けると単位行列 I になります。";

  steps.forEach((step, index) => {
    const timerId = window.setTimeout(() => {
      elements.animationTrack.innerHTML = "";
      step.flow.forEach((cell, cellIndex) => {
        cell.style.animationDelay = `${cellIndex * 70}ms`;
        cell.classList.add("pulse");
        elements.animationTrack.append(cell);
      });
      resultCells.forEach((cell) => cell.classList.remove("active"));
      highlightProofFactors(proofRow, step.row, step.col, calculation.b[0].length);
      const resultCell = resultCells[step.row * product[0].length + step.col];
      resultCell.textContent = formatNumber(product[step.row][step.col]);
      resultCell.classList.add("active");
      elements.formulaTitle.textContent = step.title;
      elements.formula.textContent = step.text;
      appendHistory(step);
    }, index * 1150);
    state.timerIds.push(timerId);
  });
}

function highlightProofFactors(proofRow, row, col, termCount) {
  clearReferenceHighlights();
  for (let k = 0; k < termCount; k += 1) {
    highlightOutputCell(proofRow, ".proof-b", row, k, "referenced-a");
    highlightOutputCell(proofRow, ".proof-inverse", k, col, "referenced-b");
  }
}

function setActiveResult(row, col) {
  elements.matrixResult.querySelectorAll(".cell-output").forEach((cell) => {
    cell.classList.toggle("active", Number(cell.dataset.row) === row && Number(cell.dataset.col) === col);
  });
}

function clearReferenceHighlights() {
  document.querySelectorAll(".referenced-a, .referenced-b").forEach((cell) => {
    cell.classList.remove("referenced-a", "referenced-b");
  });
}

function setReferenceHighlights(row, col) {
  clearReferenceHighlights();

  if (state.operation === "add" || state.operation === "subtract") {
    highlightInputCell(elements.matrixA, row, col, "referenced-a");
    highlightInputCell(elements.matrixB, row, col, "referenced-b");
    return;
  }

  if (state.operation === "divide") {
    for (let k = 0; k < state.colsA; k += 1) {
      highlightInputCell(elements.matrixA, row, k, "referenced-a");
      highlightOutputCell(elements.divisionDetail, ".inverse-matrix", k, col, "referenced-b");
    }
    return;
  }

  for (let k = 0; k < state.colsA; k += 1) {
    highlightInputCell(elements.matrixA, row, k, "referenced-a");
    highlightInputCell(elements.matrixB, k, col, "referenced-b");
  }
}

function highlightInputCell(container, row, col, className) {
  const cell = container.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  cell?.classList.add(className);
}

function highlightOutputCell(container, matrixSelector, row, col, className) {
  const cell = container.querySelector(`${matrixSelector} [data-row="${row}"][data-col="${col}"]`);
  cell?.classList.add(className);
}

function appendHistory(step) {
  const item = document.createElement("li");
  const title = document.createElement("strong");
  const detail = document.createElement("span");
  title.textContent = step.title;
  detail.textContent = step.text;
  item.append(title, detail);
  elements.historyList.append(item);
  elements.historyList.scrollTop = elements.historyList.scrollHeight;
}

function describeCell(a, bWorking, result, row, col) {
  if (state.operation === "add" || state.operation === "subtract") {
    const sign = state.operation === "add" ? "+" : "-";
    return {
      title: `C${row + 1}${col + 1}`,
      text: `${formatNumber(a[row][col])} ${sign} ${formatNumber(bWorking[row][col])} = ${formatNumber(result[row][col])}`,
      flow: [
        flowCell(`A${row + 1}${col + 1}: ${formatNumber(a[row][col])}`, "source-a"),
        flowCell(sign, "operator"),
        flowCell(`B${row + 1}${col + 1}: ${formatNumber(bWorking[row][col])}`, "source-b"),
        flowCell("=", "operator"),
        flowCell(formatNumber(result[row][col]), "result"),
      ],
    };
  }

  const terms = a[row].map((value, k) => ({
    a: value,
    b: bWorking[k][col],
    label: `A${row + 1}${k + 1} x ${state.operation === "divide" ? "B^-1" : "B"}${k + 1}${col + 1}`,
  }));
  const expression = terms.map((term) => `${formatNumber(term.a)} x ${formatNumber(term.b)}`).join(" + ");
  const flow = [];
  terms.forEach((term, index) => {
    if (index > 0) flow.push(flowCell("+", "operator"));
    flow.push(flowCell(`${formatNumber(term.a)} x ${formatNumber(term.b)}`, "source-a"));
  });
  flow.push(flowCell("=", "operator"), flowCell(formatNumber(result[row][col]), "result"));

  return {
    title: `C${row + 1}${col + 1}`,
    text: `${expression} = ${formatNumber(result[row][col])}`,
    flow,
  };
}

function animateCalculation() {
  clearAnimation();
  updateStateFromInputs();

  let calculation;
  try {
    calculation = calculate();
    elements.message.textContent = calculation.inverse ? "除算では B^-1 を使って A x B^-1 を計算しています。" : "";
  } catch (error) {
    elements.message.textContent = error.message;
    return;
  }

  const { a, result, bWorking } = calculation;
  renderResultGrid(result.length, result[0].length, result);
  renderDivisionDetail(calculation);

  const steps = [];
  for (let row = 0; row < result.length; row += 1) {
    for (let col = 0; col < result[0].length; col += 1) {
      steps.push({ row, col, ...describeCell(a, bWorking, result, row, col) });
    }
  }

  const firstStepDelay = calculation.inverse ? 900 : 0;
  steps.forEach((step, index) => {
    const timerId = window.setTimeout(() => {
      elements.animationTrack.innerHTML = "";
      step.flow.forEach((cell, cellIndex) => {
        cell.style.animationDelay = `${cellIndex * 70}ms`;
        cell.classList.add("pulse");
        elements.animationTrack.append(cell);
      });
      elements.formulaTitle.textContent = step.title;
      elements.formula.textContent = step.text;
      appendHistory(step);
      setActiveResult(step.row, step.col);
      setReferenceHighlights(step.row, step.col);
    }, firstStepDelay + index * 1150);
    state.timerIds.push(timerId);
  });
}

["rowsA", "colsA", "rowsB", "colsB"].forEach((key) => {
  elements[key].addEventListener("change", syncLayout);
});

elements.operation.addEventListener("change", syncLayout);
elements.randomize.addEventListener("click", () => {
  randomizeMatrix(elements.matrixA);
  randomizeMatrix(elements.matrixB);
  syncLayout();
});
elements.fitDimensions.addEventListener("click", fitDimensionsToOperation);
elements.animate.addEventListener("click", animateCalculation);

syncLayout();
