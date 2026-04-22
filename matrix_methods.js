const EPSILON = 1e-9;
const MAX_SIZE = 4;
const MAX_RATIONAL_DENOMINATOR = 1000;
const pageType = location.pathname.includes("linear_system") ? "linear-system" : "inverse";

const elements = {
  sizeN: document.querySelector("#sizeN"),
  randomize: document.querySelector("#randomize"),
  animate: document.querySelector("#animate"),
  verify: document.querySelector("#verify"),
  matrixA: document.querySelector("#matrixA"),
  methodMatrix: document.querySelector("#methodMatrix"),
  resultMatrix: document.querySelector("#resultMatrix"),
  verifyA: document.querySelector("#verifyA"),
  verifyInverse: document.querySelector("#verifyInverse"),
  verifyProduct: document.querySelector("#verifyProduct"),
  equationSystem: document.querySelector("#equationSystem"),
  originalEquationSystem: document.querySelector("#originalEquationSystem"),
  mathMatrixA: document.querySelector("#mathMatrixA"),
  mathMatrixInverse: document.querySelector("#mathMatrixInverse"),
  labelA: document.querySelector("#labelA"),
  labelR: document.querySelector("#labelR"),
  message: document.querySelector("#message"),
  dimensionStatus: document.querySelector("#dimensionStatus"),
  animationTrack: document.querySelector("#animationTrack"),
  formulaTitle: document.querySelector("#formulaTitle"),
  formula: document.querySelector("#formula"),
  historyList: document.querySelector("#historyList"),
};

const state = {
  n: 2,
  timerIds: [],
  lastInputMatrix: null,
  lastInverseMatrix: null,
  initialMatrix: null,
};

if (pageType === "linear-system") {
  document.querySelector(".workspace")?.classList.add("has-equation-band");
}

if (pageType === "inverse") {
  document.querySelector(".workspace")?.classList.add("has-inverse-display");
  loadInitialMatrixFromUrl();
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
      tokens.push({ type: char });
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

function clampSize(value) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return 2;
  return Math.min(MAX_SIZE, Math.max(2, number));
}

function loadInitialMatrixFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const encodedMatrix = params.get("matrix");
  if (!encodedMatrix) return;

  try {
    const matrix = JSON.parse(encodedMatrix);
    if (!Array.isArray(matrix) || matrix.length < 2 || matrix.length > MAX_SIZE) return;
    if (!matrix.every((row) => Array.isArray(row) && row.length === matrix.length)) return;

    const normalized = matrix.map((row) =>
      row.map((value) => {
        const number = Number(value);
        if (!Number.isFinite(number)) throw new Error("Invalid matrix value");
        return formatNumber(number);
      }),
    );
    state.initialMatrix = normalized;
    state.n = normalized.length;
    elements.sizeN.value = state.n;
  } catch {
    state.initialMatrix = null;
  }
}

function setGrid(element, rows, cols) {
  element.style.gridTemplateColumns = `repeat(${cols}, minmax(var(--matrix-cell-min, 0px), 1fr))`;
  element.dataset.rows = rows;
  element.dataset.cols = cols;
}

function randomInteger() {
  const value = Math.floor(Math.random() * 9) - 4;
  return value === 0 ? 1 : value;
}

function clearTimers() {
  state.timerIds.forEach((timerId) => window.clearTimeout(timerId));
  state.timerIds = [];
}

function clearAnimation() {
  clearTimers();
  elements.animationTrack.innerHTML = "";
  elements.historyList.innerHTML = "";
  elements.methodMatrix.querySelectorAll(".cell-output").forEach((cell) => {
    cell.classList.remove("active", "pivot-cell", "row-cell");
  });
  elements.equationSystem?.querySelectorAll(".equation-line").forEach((line) => {
    line.classList.remove("active-equation");
  });
}

function resetVerification() {
  if (pageType !== "inverse") return;
  state.lastInputMatrix = null;
  state.lastInverseMatrix = null;
  if (elements.verify) elements.verify.disabled = true;
  [elements.verifyA, elements.verifyInverse, elements.verifyProduct].forEach((container) => {
    if (container) container.innerHTML = "";
  });
}

function createInputGrid() {
  const previous = state.initialMatrix || readRawInputs();
  state.initialMatrix = null;
  const cols = pageType === "inverse" ? state.n : state.n + 1;
  elements.matrixA.innerHTML = "";
  setGrid(elements.matrixA, state.n, cols);
  elements.matrixA.classList.toggle("augmented-input", pageType === "linear-system");

  for (let row = 0; row < state.n; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "decimal";
      input.spellcheck = false;
      input.className = "cell-input";
      input.value = previous[row]?.[col] ?? defaultValue(row, col);
      input.dataset.row = row;
      input.dataset.col = col;
      input.ariaLabel = pageType === "inverse" ? `A${row + 1}${col + 1}` : col === state.n ? `b${row + 1}` : `A${row + 1}${col + 1}`;
      if (pageType === "linear-system" && col === state.n) input.classList.add("divider-left");
      input.addEventListener("input", updateLiveDisplays);
      elements.matrixA.append(input);
    }
  }
}

function defaultValue(row, col) {
  if (pageType === "inverse") return row === col ? 2 : 1;
  if (col === state.n) return row + 1;
  return row === col ? 2 : 1;
}

function readRawInputs() {
  const rows = Number.parseInt(elements.matrixA.dataset.rows || "0", 10);
  const cols = Number.parseInt(elements.matrixA.dataset.cols || "0", 10);
  const cells = Array.from(elements.matrixA.querySelectorAll("input"));
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

function readInputMatrix() {
  const cols = pageType === "inverse" ? state.n : state.n + 1;
  const cells = Array.from(elements.matrixA.querySelectorAll("input"));
  const matrix = [];

  for (let row = 0; row < state.n; row += 1) {
    const line = [];
    for (let col = 0; col < cols; col += 1) {
      const cell = cells[row * cols + col];
      try {
        line.push(parseExpressionValue(cell.value));
        cell.classList.remove("invalid");
      } catch (error) {
        cell.classList.add("invalid");
        const label = pageType === "linear-system" && col === state.n ? `b${row + 1}` : `A${row + 1}${col + 1}`;
        throw new Error(`${label}: ${error.message}`);
      }
    }
    matrix.push(line);
  }

  return matrix;
}

function randomizeInputs() {
  const inputs = Array.from(elements.matrixA.querySelectorAll("input"));
  let fallback = null;

  for (let attempt = 0; attempt < 240; attempt += 1) {
    const values = inputs.map(() => randomInteger());
    inputs.forEach((input, index) => {
      input.value = values[index];
    });

    try {
      const calculation = gaussJordanSteps(buildAugmented(readInputMatrix()));
      if (!fallback) fallback = values;
      if (pageType !== "inverse" || hasSimpleInverse(calculation.finalMatrix)) {
        elements.message.textContent = "";
        return;
      }
    } catch {
      // Try another random matrix. The animation will show a message if all attempts fail.
    }
  }

  if (fallback) {
    inputs.forEach((input, index) => {
      input.value = fallback[index];
    });
    elements.message.textContent = "逆行列の分数が少し複雑です。もう一度ランダムを押すと別の問題を作ります。";
    return;
  }

  elements.message.textContent = "正則なランダム入力を作れませんでした。もう一度ランダムを押してください。";
}

function hasSimpleInverse(finalMatrix) {
  for (let row = 0; row < state.n; row += 1) {
    for (let col = 0; col < state.n; col += 1) {
      const value = finalMatrix[row][state.n + col];
      if (Number.isInteger(Math.abs(value) < EPSILON ? 0 : value)) continue;
      const rational = approximateRational(value);
      if (!rational || Math.abs(rational.numerator) > 9 || rational.denominator > 9) return false;
    }
  }

  return true;
}

function identity(size) {
  return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, col) => (row === col ? 1 : 0)));
}

function buildAugmented(input) {
  if (pageType === "inverse") {
    const id = identity(state.n);
    return input.map((row, index) => [...row, ...id[index]]);
  }

  return input.map((row) => row.slice());
}

function cloneMatrix(matrix) {
  return matrix.map((row) => row.slice());
}

function gaussJordanSteps(augmented) {
  const matrix = cloneMatrix(augmented);
  const cols = matrix[0].length;
  const steps = [];

  steps.push({
    title: "開始",
    text: pageType === "inverse" ? "[ A | I ] を作ります。" : "[ A | b ] を作ります。",
    matrix: cloneMatrix(matrix),
  });

  for (let col = 0; col < state.n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < state.n; row += 1) {
      if (Math.abs(matrix[row][col]) > Math.abs(matrix[pivot][col])) pivot = row;
    }

    if (Math.abs(matrix[pivot][col]) < EPSILON) {
      throw new Error("この行列では一意な解または逆行列を求められません。入力を変更してください。");
    }

    if (pivot !== col) {
      [matrix[col], matrix[pivot]] = [matrix[pivot], matrix[col]];
      steps.push({
        title: `R${col + 1} と R${pivot + 1} を交換`,
        text: `第${col + 1}列のピボットを作るために行を交換します。`,
        matrix: cloneMatrix(matrix),
        activeRows: [col, pivot],
        pivot: [col, col],
      });
    }

    const divisor = matrix[col][col];
    for (let j = 0; j < cols; j += 1) matrix[col][j] /= divisor;
    steps.push({
      title: `R${col + 1} を ${formatNumber(divisor)} で割る`,
      text: `ピボットを 1 にします。`,
      matrix: cloneMatrix(matrix),
      activeRows: [col],
      pivot: [col, col],
    });

    for (let row = 0; row < state.n; row += 1) {
      if (row === col) continue;
      const factor = matrix[row][col];
      if (Math.abs(factor) < EPSILON) continue;
      for (let j = 0; j < cols; j += 1) matrix[row][j] -= factor * matrix[col][j];
      steps.push({
        title: `R${row + 1} ← R${row + 1} - (${formatNumber(factor)})R${col + 1}`,
        text: `第${col + 1}列の R${row + 1} 成分を 0 にします。`,
        matrix: cloneMatrix(matrix),
        activeRows: [row, col],
        pivot: [col, col],
      });
    }
  }

  steps.push({
    title: "完了",
    text: pageType === "inverse" ? "左側が I になったので、右側が A^-1 です。" : "左側が I になったので、右側が解です。",
    matrix: cloneMatrix(matrix),
  });

  return { steps, finalMatrix: matrix };
}

function renderMethodMatrix(matrix, step = {}) {
  elements.methodMatrix.innerHTML = "";
  const cols = matrix[0].length;
  setGrid(elements.methodMatrix, matrix.length, cols);
  elements.methodMatrix.classList.add("augmented-output");

  matrix.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const cell = document.createElement("div");
      cell.className = "cell-output method-cell";
      cell.textContent = formatNumber(value);
      if (colIndex === state.n) cell.classList.add("divider-left");
      if (step.activeRows?.includes(rowIndex)) cell.classList.add("row-cell");
      if (step.pivot?.[0] === rowIndex && step.pivot?.[1] === colIndex) cell.classList.add("pivot-cell");
      elements.methodMatrix.append(cell);
    });
  });
}

function appendVariable(parent, index) {
  parent.append(document.createTextNode("x"));
  const subscript = document.createElement("sub");
  subscript.textContent = index + 1;
  parent.append(subscript);
}

function createEquationTerm(coefficient, index, isFirstTerm) {
  const rounded = Math.abs(coefficient) < EPSILON ? 0 : coefficient;
  const absolute = Math.abs(rounded);
  const coefficientText = Math.abs(absolute - 1) < EPSILON ? "" : formatNumber(absolute);
  const term = document.createElement("span");
  term.className = "equation-term-text";

  if (rounded === 0) {
    term.classList.add("zero-term");
  }

  if (rounded < 0) term.append(document.createTextNode("-"));
  if (coefficientText) term.append(document.createTextNode(coefficientText));
  appendVariable(term, index);

  if (!isFirstTerm && rounded > 0) term.classList.add("positive-term");
  return term;
}

function createSignCell(coefficient, isFirstTerm) {
  const rounded = Math.abs(coefficient) < EPSILON ? 0 : coefficient;
  const sign = document.createElement("span");
  sign.className = "equation-sign";

  if (rounded === 0) {
    sign.classList.add("zero-term");
    sign.textContent = isFirstTerm ? "" : "+";
    return sign;
  }

  if (isFirstTerm) return sign;

  sign.textContent = rounded < 0 ? "" : "+";
  return sign;
}

function renderEquationSystem(matrix, step = {}) {
  if (pageType !== "linear-system") return;

  const container = step.container || elements.equationSystem;
  if (!container) return;

  container.innerHTML = "";
  const aligned = step.aligned !== false;

  matrix.forEach((row, rowIndex) => {
    const line = document.createElement("div");
    line.className = `equation-line${aligned ? " aligned-equation" : " natural-equation"}`;
    if (step.activeRows?.includes(rowIndex)) line.classList.add("active-equation");

    if (aligned) {
      line.style.gridTemplateColumns = `repeat(${state.n}, auto minmax(56px, auto)) auto minmax(56px, auto)`;
      for (let col = 0; col < state.n; col += 1) {
        line.append(createSignCell(row[col], col === 0), createEquationTerm(row[col], col, col === 0));
      }
    } else {
      let hasVisibleTerm = false;
      for (let col = 0; col < state.n; col += 1) {
        if (Math.abs(row[col]) < EPSILON) continue;
        line.append(createSignCell(row[col], !hasVisibleTerm), createEquationTerm(row[col], col, !hasVisibleTerm));
        hasVisibleTerm = true;
      }
      if (!hasVisibleTerm) {
        const zero = document.createElement("span");
        zero.className = "equation-term-text";
        zero.textContent = "0";
        line.append(zero);
      }
    }

    const equals = document.createElement("span");
    equals.className = "equation-equals";
    equals.textContent = "=";

    const right = document.createElement("span");
    right.className = "equation-right";
    right.textContent = formatNumber(row[state.n]);

    line.append(equals, right);
    container.append(line);
  });
}

function renderMathMatrix(container, matrix, options = {}) {
  if (!container) return;

  container.innerHTML = "";
  container.style.gridTemplateColumns = `repeat(${matrix[0].length}, minmax(44px, auto))`;
  container.classList.toggle("pending-math-matrix", Boolean(options.pending));

  matrix.forEach((row) => {
    row.forEach((value) => {
      const cell = document.createElement("span");
      cell.className = "math-matrix-cell";
      cell.textContent = options.pending ? "?" : formatNumber(value);
      container.append(cell);
    });
  });
}

function renderPlainMatrix(container, matrix, options = {}) {
  if (!container) return;
  container.innerHTML = "";
  setGrid(container, matrix.length, matrix[0].length);

  matrix.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const cell = document.createElement("div");
      cell.className = "cell-output";
      cell.dataset.row = rowIndex;
      cell.dataset.col = colIndex;
      cell.textContent = options.pending ? "?" : formatNumber(value);
      container.append(cell);
    });
  });
}

function clearVerificationHighlights() {
  document.querySelectorAll(".verification-band .referenced-a, .verification-band .referenced-b, .verification-band .active").forEach((cell) => {
    cell.classList.remove("referenced-a", "referenced-b", "active");
  });
}

function setVerificationHighlights(row, col) {
  clearVerificationHighlights();
  elements.verifyA?.querySelectorAll(`[data-row="${row}"]`).forEach((cell) => cell.classList.add("referenced-a"));
  elements.verifyInverse?.querySelectorAll(`[data-col="${col}"]`).forEach((cell) => cell.classList.add("referenced-b"));
  elements.verifyProduct?.querySelector(`[data-row="${row}"][data-col="${col}"]`)?.classList.add("active");
}

function prepareVerification(inputMatrix, inverseMatrix) {
  if (pageType !== "inverse") return;
  state.lastInputMatrix = cloneMatrix(inputMatrix);
  state.lastInverseMatrix = cloneMatrix(inverseMatrix);
  renderPlainMatrix(elements.verifyA, state.lastInputMatrix);
  renderPlainMatrix(elements.verifyInverse, state.lastInverseMatrix);
  renderPlainMatrix(elements.verifyProduct, identity(state.n), { pending: true });
  if (elements.verify) elements.verify.disabled = false;
}

function buildVerificationSteps(inputMatrix, inverseMatrix) {
  const steps = [];
  for (let row = 0; row < state.n; row += 1) {
    for (let col = 0; col < state.n; col += 1) {
      const terms = [];
      let value = 0;
      for (let k = 0; k < state.n; k += 1) {
        value += inputMatrix[row][k] * inverseMatrix[k][col];
        terms.push(`${formatNumber(inputMatrix[row][k])} x ${formatNumber(inverseMatrix[k][col])}`);
      }
      steps.push({
        row,
        col,
        value,
        title: `I${row + 1}${col + 1} の検算`,
        text: `${terms.join(" + ")} = ${formatNumber(value)}`,
      });
    }
  }
  return steps;
}

function animateVerification() {
  if (pageType !== "inverse" || !state.lastInputMatrix || !state.lastInverseMatrix) {
    elements.message.textContent = "先に逆行列を求めてください。";
    return;
  }

  clearTimers();
  elements.animationTrack.innerHTML = "";
  elements.historyList.innerHTML = "";
  elements.formulaTitle.textContent = "検算";
  elements.formula.textContent = "A の行と A^-1 の列を掛けて、単位行列 I になることを確認します。";
  renderPlainMatrix(elements.verifyA, state.lastInputMatrix);
  renderPlainMatrix(elements.verifyInverse, state.lastInverseMatrix);
  renderPlainMatrix(elements.verifyProduct, identity(state.n), { pending: true });

  const steps = buildVerificationSteps(state.lastInputMatrix, state.lastInverseMatrix);
  steps.forEach((step, index) => {
    const timerId = window.setTimeout(() => {
      setVerificationHighlights(step.row, step.col);
      const resultCell = elements.verifyProduct.querySelector(`[data-row="${step.row}"][data-col="${step.col}"]`);
      if (resultCell) resultCell.textContent = formatNumber(step.value);
      renderTrack({ title: step.title, activeRows: [step.row] });
      elements.formulaTitle.textContent = step.title;
      elements.formula.textContent = step.text;
      appendHistory(step);
    }, index * 950);
    state.timerIds.push(timerId);
  });
}

function renderInverseDisplay(inputMatrix, inverseMatrix = null) {
  if (pageType !== "inverse") return;

  renderMathMatrix(elements.mathMatrixA, inputMatrix);
  renderMathMatrix(elements.mathMatrixInverse, inverseMatrix || identity(state.n), { pending: !inverseMatrix });
}

function renderSolutionCell(cell, row, valueText) {
  cell.textContent = "";
  appendVariable(cell, row);
  cell.append(document.createTextNode(` = ${valueText}`));
}

function renderResult(finalMatrix) {
  if (!elements.resultMatrix) return;
  elements.resultMatrix.innerHTML = "";

  if (pageType === "inverse") {
    setGrid(elements.resultMatrix, state.n, state.n);
    for (let row = 0; row < state.n; row += 1) {
      for (let col = 0; col < state.n; col += 1) {
        const cell = document.createElement("div");
        cell.className = "cell-output";
        cell.textContent = formatNumber(finalMatrix[row][state.n + col]);
        elements.resultMatrix.append(cell);
      }
    }
    return;
  }

  setGrid(elements.resultMatrix, state.n, 1);
  for (let row = 0; row < state.n; row += 1) {
    const cell = document.createElement("div");
    cell.className = "cell-output solution-cell";
    renderSolutionCell(cell, row, formatNumber(finalMatrix[row][state.n]));
    elements.resultMatrix.append(cell);
  }
}

function renderPendingSolution() {
  if (pageType !== "linear-system") return;
  if (!elements.resultMatrix) return;

  elements.resultMatrix.innerHTML = "";
  setGrid(elements.resultMatrix, state.n, 1);
  for (let row = 0; row < state.n; row += 1) {
    const cell = document.createElement("div");
    cell.className = "cell-output solution-cell pending-solution";
    renderSolutionCell(cell, row, "?");
    elements.resultMatrix.append(cell);
  }
}

function renderPendingInverse() {
  if (pageType !== "inverse") return;
  if (!elements.resultMatrix) return;

  elements.resultMatrix.innerHTML = "";
  setGrid(elements.resultMatrix, state.n, state.n);
  for (let row = 0; row < state.n; row += 1) {
    for (let col = 0; col < state.n; col += 1) {
      const cell = document.createElement("div");
      cell.className = "cell-output pending-solution";
      cell.textContent = "?";
      elements.resultMatrix.append(cell);
    }
  }
}

function renderTrack(step) {
  elements.animationTrack.innerHTML = "";
  const labels = step.activeRows?.length ? step.activeRows.map((row) => `R${row + 1}`).join(", ") : "全体";
  const left = document.createElement("div");
  left.className = "flow-cell source-a";
  left.textContent = labels;
  const op = document.createElement("div");
  op.className = "flow-cell operator";
  op.textContent = "→";
  const right = document.createElement("div");
  right.className = "flow-cell result";
  right.textContent = step.title;
  elements.animationTrack.append(left, op, right);
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

function animate() {
  clearAnimation();
  elements.message.textContent = "";

  let calculation;
  try {
    calculation = gaussJordanSteps(buildAugmented(readInputMatrix()));
  } catch (error) {
    elements.message.textContent = error.message;
    return;
  }

  renderMethodMatrix(calculation.steps[0].matrix, calculation.steps[0]);
  renderEquationSystem(calculation.steps[0].matrix, calculation.steps[0]);
  if (pageType === "inverse") {
    renderPendingInverse();
    renderInverseDisplay(readInputMatrix());
    resetVerification();
  } else {
    renderPendingSolution();
  }

  calculation.steps.forEach((step, index) => {
    const timerId = window.setTimeout(() => {
      renderMethodMatrix(step.matrix, step);
      renderEquationSystem(step.matrix, step);
      renderTrack(step);
      if (index === calculation.steps.length - 1) {
        renderResult(calculation.finalMatrix);
        if (pageType === "inverse") {
          const inverse = calculation.finalMatrix.map((row) => row.slice(state.n));
          const inputMatrix = readInputMatrix();
          renderInverseDisplay(inputMatrix, inverse);
          prepareVerification(inputMatrix, inverse);
        }
      }
      elements.formulaTitle.textContent = step.title;
      elements.formula.textContent = step.text;
      appendHistory(step);
    }, index * 1200);
    state.timerIds.push(timerId);
  });
}

function syncLayout() {
  clearAnimation();
  resetVerification();
  state.n = clampSize(elements.sizeN.value);
  elements.sizeN.value = state.n;
  createInputGrid();
  try {
    const emptyAugmented = buildAugmented(readInputMatrix());
    renderMethodMatrix(emptyAugmented);
    if (pageType === "inverse") renderInverseDisplay(readInputMatrix());
    renderEquationSystem(emptyAugmented, { aligned: false, container: elements.originalEquationSystem });
    renderEquationSystem(emptyAugmented, { aligned: true });
    elements.message.textContent = "";
  } catch (error) {
    elements.methodMatrix.innerHTML = "";
    if (elements.equationSystem) elements.equationSystem.innerHTML = "";
    if (elements.originalEquationSystem) elements.originalEquationSystem.innerHTML = "";
    elements.message.textContent = error.message;
  }
  if (elements.resultMatrix) {
    elements.resultMatrix.innerHTML = "";
    setGrid(elements.resultMatrix, pageType === "inverse" ? state.n : state.n, pageType === "inverse" ? state.n : 1);
  }
  elements.labelA.textContent = pageType === "inverse" ? `${state.n} x ${state.n}` : `${state.n} 元`;
  if (elements.labelR) elements.labelR.textContent = pageType === "inverse" ? `${state.n} x ${state.n}` : "x";
  elements.dimensionStatus.textContent = pageType === "inverse" ? `${state.n} x ${state.n}` : `${state.n} 元`;
  elements.formulaTitle.textContent = "掃き出し法";
  elements.formula.textContent = pageType === "inverse" ? "左側を単位行列に変形すると、右側が逆行列になります。" : "左側を単位行列に変形すると、右側に解が現れます。";
}

function updateLiveDisplays() {
  clearTimers();
  elements.animationTrack.innerHTML = "";
  elements.historyList.innerHTML = "";
  resetVerification();

  try {
    const inputMatrix = readInputMatrix();
    const augmented = buildAugmented(inputMatrix);
    renderMethodMatrix(augmented);

    if (pageType === "linear-system") {
      renderEquationSystem(augmented, { aligned: false, container: elements.originalEquationSystem });
      renderEquationSystem(augmented, { aligned: true });
      if (elements.resultMatrix) {
        elements.resultMatrix.innerHTML = "";
        setGrid(elements.resultMatrix, state.n, 1);
      }
    } else {
      renderInverseDisplay(inputMatrix);
      renderPendingInverse();
    }

    elements.message.textContent = "";
    elements.formulaTitle.textContent = "掃き出し法";
    elements.formula.textContent = pageType === "inverse" ? "左側を単位行列に変形すると、右側が逆行列になります。" : "左側を単位行列に変形すると、右側に解が現れます。";
  } catch (error) {
    elements.message.textContent = error.message;
  }
}

elements.sizeN.addEventListener("change", syncLayout);
elements.randomize.addEventListener("click", () => {
  randomizeInputs();
  animate();
});
elements.animate.addEventListener("click", animate);
elements.verify?.addEventListener("click", animateVerification);

syncLayout();
