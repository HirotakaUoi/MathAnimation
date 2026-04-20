const EPSILON = 1e-9;
const MAX_SIZE = 4;
const MAX_RATIONAL_DENOMINATOR = 1000;
const pageType = location.pathname.includes("linear_system") ? "linear-system" : "inverse";

const elements = {
  sizeN: document.querySelector("#sizeN"),
  randomize: document.querySelector("#randomize"),
  animate: document.querySelector("#animate"),
  matrixA: document.querySelector("#matrixA"),
  methodMatrix: document.querySelector("#methodMatrix"),
  resultMatrix: document.querySelector("#resultMatrix"),
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
};

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

function setGrid(element, rows, cols) {
  element.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
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
}

function createInputGrid() {
  const previous = readRawInputs();
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

  for (let attempt = 0; attempt < 80; attempt += 1) {
    inputs.forEach((input) => {
      input.value = randomInteger();
    });

    try {
      gaussJordanSteps(buildAugmented(readInputMatrix()));
      elements.message.textContent = "";
      return;
    } catch {
      // Try another random matrix. The animation will show a message if all attempts fail.
    }
  }

  elements.message.textContent = "正則なランダム入力を作れませんでした。もう一度ランダムを押してください。";
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

function renderResult(finalMatrix) {
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
    cell.textContent = `x${row + 1} = ${formatNumber(finalMatrix[row][state.n])}`;
    elements.resultMatrix.append(cell);
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
  renderResult(calculation.finalMatrix);

  calculation.steps.forEach((step, index) => {
    const timerId = window.setTimeout(() => {
      renderMethodMatrix(step.matrix, step);
      renderTrack(step);
      elements.formulaTitle.textContent = step.title;
      elements.formula.textContent = step.text;
      appendHistory(step);
    }, index * 1200);
    state.timerIds.push(timerId);
  });
}

function syncLayout() {
  clearAnimation();
  state.n = clampSize(elements.sizeN.value);
  elements.sizeN.value = state.n;
  createInputGrid();
  try {
    const emptyAugmented = buildAugmented(readInputMatrix());
    renderMethodMatrix(emptyAugmented);
    elements.message.textContent = "";
  } catch (error) {
    elements.methodMatrix.innerHTML = "";
    elements.message.textContent = error.message;
  }
  elements.resultMatrix.innerHTML = "";
  setGrid(elements.resultMatrix, pageType === "inverse" ? state.n : state.n, pageType === "inverse" ? state.n : 1);
  elements.labelA.textContent = pageType === "inverse" ? `${state.n} x ${state.n}` : `${state.n} 元`;
  elements.labelR.textContent = pageType === "inverse" ? `${state.n} x ${state.n}` : "x";
  elements.dimensionStatus.textContent = pageType === "inverse" ? `${state.n} x ${state.n}` : `${state.n} 元`;
  elements.formulaTitle.textContent = "掃き出し法";
  elements.formula.textContent = pageType === "inverse" ? "左側を単位行列に変形すると、右側が逆行列になります。" : "左側を単位行列に変形すると、右側に解が現れます。";
}

elements.sizeN.addEventListener("change", syncLayout);
elements.randomize.addEventListener("click", () => {
  randomizeInputs();
  animate();
});
elements.animate.addEventListener("click", animate);

syncLayout();
