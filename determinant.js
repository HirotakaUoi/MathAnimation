const EPSILON = 1e-9;
const MAX_SIZE = 4;
const MAX_RATIONAL_DENOMINATOR = 1000;
const DEFAULT_FORMULAS = {
  elimination: "行の入れ替えで符号を変え、下を 0 にして上三角行列の対角成分の積をとります。",
  cofactor: "1 行目で余因子展開し、各項の小行列の行列式を順にたどります。",
  "cofactor-compact": "1 行目で余因子展開し、小行列の内部計算は要点だけに省略して表示します。",
};

const elements = {
  sizeN: document.querySelector("#sizeN"),
  methodMode: document.querySelector("#methodMode"),
  randomize: document.querySelector("#randomize"),
  animate: document.querySelector("#animate"),
  matrixA: document.querySelector("#matrixA"),
  methodMatrix: document.querySelector("#methodMatrix"),
  resultMatrix: document.querySelector("#resultMatrix"),
  mathMatrixA: document.querySelector("#mathMatrixA"),
  determinantValue: document.querySelector("#determinantValue"),
  labelA: document.querySelector("#labelA"),
  labelR: document.querySelector("#labelR"),
  methodTitle: document.querySelector("#methodTitle"),
  methodSubtitle: document.querySelector("#methodSubtitle"),
  message: document.querySelector("#message"),
  dimensionStatus: document.querySelector("#dimensionStatus"),
  animationTrack: document.querySelector("#animationTrack"),
  formulaTitle: document.querySelector("#formulaTitle"),
  formula: document.querySelector("#formula"),
  historyList: document.querySelector("#historyList"),
};

const state = {
  n: 2,
  mode: "elimination",
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
  return { numerator: sign * bestNumerator, denominator: bestDenominator };
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
    cell.classList.remove("active", "pivot-cell", "row-cell", "referenced-a", "referenced-b");
  });
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

function createInputGrid() {
  const previous = readRawInputs();
  elements.matrixA.innerHTML = "";
  setGrid(elements.matrixA, state.n, state.n);

  for (let row = 0; row < state.n; row += 1) {
    for (let col = 0; col < state.n; col += 1) {
      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "decimal";
      input.spellcheck = false;
      input.className = "cell-input";
      input.value = previous[row]?.[col] ?? (row === col ? 2 : 1);
      input.dataset.row = row;
      input.dataset.col = col;
      input.ariaLabel = `A${row + 1}${col + 1}`;
      input.addEventListener("input", updateLiveDisplays);
      elements.matrixA.append(input);
    }
  }
}

function readInputMatrix() {
  const cells = Array.from(elements.matrixA.querySelectorAll("input"));
  const matrix = [];

  for (let row = 0; row < state.n; row += 1) {
    const line = [];
    for (let col = 0; col < state.n; col += 1) {
      const cell = cells[row * state.n + col];
      try {
        line.push(parseExpressionValue(cell.value));
        cell.classList.remove("invalid");
      } catch (error) {
        cell.classList.add("invalid");
        throw new Error(`A${row + 1}${col + 1}: ${error.message}`);
      }
    }
    matrix.push(line);
  }

  return matrix;
}

function cloneMatrix(matrix) {
  return matrix.map((row) => row.slice());
}

function minorMatrix(matrix, excludeRow, excludeCol) {
  return matrix
    .filter((_, rowIndex) => rowIndex !== excludeRow)
    .map((row) => row.filter((_, colIndex) => colIndex !== excludeCol));
}

function determinantValue(matrix) {
  const size = matrix.length;
  if (size === 1) return matrix[0][0];
  if (size === 2) {
    return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  }

  let total = 0;
  for (let col = 0; col < size; col += 1) {
    const coefficient = matrix[0][col];
    if (Math.abs(coefficient) < EPSILON) continue;
    const sign = col % 2 === 0 ? 1 : -1;
    total += sign * coefficient * determinantValue(minorMatrix(matrix, 0, col));
  }
  return total;
}

function formatExpansionTerm(coefficient, sign, minorValue) {
  const prefix = sign === 1 ? "+" : "-";
  return `${prefix} ${formatNumber(Math.abs(coefficient))} × ${formatNumber(minorValue)}`;
}

function toSubscript(value) {
  return String(value).replace(/\d/g, (digit) => "₀₁₂₃₄₅₆₇₈₉"[Number(digit)]);
}

function entryName(row, col) {
  return `a${toSubscript(row + 1)}${toSubscript(col + 1)}`;
}

function minorName(row, col) {
  return `M${toSubscript(row + 1)}${toSubscript(col + 1)}`;
}

function cofactorName(row, col) {
  return `C${toSubscript(row + 1)}${toSubscript(col + 1)}`;
}

function expansionFormula(size, row = 0) {
  const terms = [];
  for (let col = 0; col < size; col += 1) {
    const sign = col % 2 === 0 ? "+" : "-";
    const prefix = col === 0 ? "" : ` ${sign} `;
    terms.push(`${prefix}${entryName(row, col)}${cofactorName(row, col)}`);
  }
  return `det(A) = ${terms.join("")}`;
}

function randomizeInputs() {
  const inputs = Array.from(elements.matrixA.querySelectorAll("input"));
  for (let attempt = 0; attempt < 120; attempt += 1) {
    inputs.forEach((input) => {
      input.value = randomInteger();
    });
    try {
      const calculation = buildCalculation(readInputMatrix(), state.mode);
      if (Math.abs(calculation.determinant) < EPSILON) continue;
      updateLiveDisplays();
      elements.message.textContent = "";
      return;
    } catch {
      // retry
    }
  }
  elements.message.textContent = "扱いやすいランダム行列を作れませんでした。もう一度ランダムを押してください。";
}

function eliminationSteps(input) {
  const matrix = cloneMatrix(input);
  const steps = [];
  let sign = 1;

  steps.push({
    title: "開始",
    text: "行の入れ替えと下三角消去で上三角行列にします。",
    matrix: cloneMatrix(matrix),
  });

  for (let col = 0; col < state.n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < state.n; row += 1) {
      if (Math.abs(matrix[row][col]) > Math.abs(matrix[pivot][col])) pivot = row;
    }

    if (Math.abs(matrix[pivot][col]) < EPSILON) {
      steps.push({
        title: "完了",
        text: `第${col + 1}列のピボットが 0 なので det(A) = 0 です。`,
        matrix: cloneMatrix(matrix),
        determinant: 0,
      });
      return { steps, determinant: 0 };
    }

    if (pivot !== col) {
      [matrix[col], matrix[pivot]] = [matrix[pivot], matrix[col]];
      sign *= -1;
      steps.push({
        title: `R${col + 1} と R${pivot + 1} を交換`,
        text: "行を交換したので行列式の符号が反転します。",
        matrix: cloneMatrix(matrix),
        activeRows: [col, pivot],
        pivot: [col, col],
      });
    }

    for (let row = col + 1; row < state.n; row += 1) {
      const factor = matrix[row][col] / matrix[col][col];
      if (Math.abs(factor) < EPSILON) continue;
      for (let j = col; j < state.n; j += 1) {
        matrix[row][j] -= factor * matrix[col][j];
      }
      steps.push({
        title: `R${row + 1} ← R${row + 1} - (${formatNumber(factor)})R${col + 1}`,
        text: `第${col + 1}列の下を 0 にします。行列式は変わりません。`,
        matrix: cloneMatrix(matrix),
        activeRows: [row, col],
        pivot: [col, col],
      });
    }
  }

  const diagonal = matrix.map((row, index) => row[index]);
  const determinant = sign * diagonal.reduce((product, value) => product * value, 1);
  const diagonalText = diagonal.map((value) => formatNumber(value)).join(" × ");
  steps.push({
    title: "完了",
    text: `det(A) = ${sign === -1 ? "-(" : ""}${diagonalText}${sign === -1 ? ")" : ""} = ${formatNumber(determinant)}`,
    matrix: cloneMatrix(matrix),
    determinant,
  });

  return { steps, determinant };
}

function cofactorSteps(input, compact = false) {
  const steps = [];

  function visit(matrix, label, depth) {
    const size = matrix.length;

    if (size === 1) {
      const scalar = matrix[0][0];
      steps.push({
        title: `${label} の値`,
        text: `${label} は 1 x 1 なので ${formatNumber(scalar)} です。`,
        formula: `det(${label}) = ${formatNumber(scalar)}`,
        matrix: cloneMatrix(matrix),
        determinant: scalar,
      });
      return scalar;
    }

    if (size === 2) {
      const value = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
      steps.push({
        title: `${label} を直接計算`,
        text: `${formatNumber(matrix[0][0])} × ${formatNumber(matrix[1][1])} - ${formatNumber(matrix[0][1])} × ${formatNumber(matrix[1][0])} = ${formatNumber(value)}`,
        formula: `det(${label}) = ${formatNumber(matrix[0][0])} × ${formatNumber(matrix[1][1])} - ${formatNumber(matrix[0][1])} × ${formatNumber(matrix[1][0])} = ${formatNumber(value)}`,
        matrix: cloneMatrix(matrix),
        activeCells: [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ],
        determinant: value,
      });
      return value;
    }

    if (compact && depth > 0) {
      const value = determinantValue(matrix);
      steps.push({
        title: `${label} を省略計算`,
        text: `${size} x ${size} の小行列なので途中を省略し、det(${label}) = ${formatNumber(value)} とします。`,
        formula: `det(${label}) = ${formatNumber(value)}`,
        matrix: cloneMatrix(matrix),
        determinant: value,
      });
      return value;
    }

    steps.push({
      title: `${label} を 1 行目で展開`,
      text: `${size} x ${size} 行列なので 1 行目で余因子展開します。`,
      formula: expansionFormula(size, 0),
      matrix: cloneMatrix(matrix),
      activeRows: [0],
    });

    let total = 0;
    const termSummaries = [];

    for (let col = 0; col < size; col += 1) {
      const coefficient = matrix[0][col];
      const itemEntry = entryName(0, col);
      const itemMinor = minorName(0, col);
      const itemCofactor = cofactorName(0, col);
      const sign = col % 2 === 0 ? 1 : -1;
      const signFormula = `(-1)^(1+${col + 1})`;
      if (Math.abs(coefficient) < EPSILON) {
        steps.push({
          title: `${itemEntry} の項を省略`,
          text: `${itemEntry} = 0 なので、この項は 0 です。`,
          formula: `${itemEntry}${itemCofactor} = 0`,
          matrix: cloneMatrix(matrix),
          activeCells: [[0, col]],
          sourceLabel: itemEntry,
        });
        continue;
      }

      const minor = minorMatrix(matrix, 0, col);
      steps.push({
        title: `${itemCofactor} の小行列`,
        text: `${itemEntry} に対応する小行列 ${itemMinor} を作ります。${itemCofactor} = ${signFormula} det(${itemMinor}) です。`,
        formula: `${itemCofactor} = ${signFormula} det(${itemMinor})`,
        matrix: cloneMatrix(minor),
        activeCells: [[0, col]],
        sourceMatrix: cloneMatrix(matrix),
        sourceCell: [0, col],
        sourceLabel: itemEntry,
      });

      const minorValue = visit(minor, itemMinor, depth + 1);
      const cofactorValue = sign * minorValue;
      const termValue = sign * coefficient * minorValue;
      total += termValue;
      termSummaries.push(formatExpansionTerm(coefficient, sign, minorValue));

      steps.push({
        title: `${itemEntry}${itemCofactor} の寄与`,
        text: `${itemCofactor} = ${formatNumber(cofactorValue)} なので、${itemEntry}${itemCofactor} = ${formatNumber(coefficient)} × ${formatNumber(cofactorValue)} = ${formatNumber(termValue)} です。`,
        formula: `${itemCofactor} = ${signFormula} det(${itemMinor}) = ${formatNumber(cofactorValue)}, ${itemEntry}${itemCofactor} = ${formatNumber(termValue)}`,
        matrix: cloneMatrix(matrix),
        activeCells: [[0, col]],
        partial: total,
        sourceLabel: itemEntry,
      });
    }

    steps.push({
      title: `${label} の合計`,
      text: `${termSummaries.join(" ")} = ${formatNumber(total)}`,
      formula: `${label === "det(A)" ? expansionFormula(size, 0) : `det(${label})`} = ${formatNumber(total)}`,
      matrix: cloneMatrix(matrix),
      activeRows: [0],
      determinant: total,
    });

    return total;
  }

  const determinant = visit(input, "det(A)", 0);
  return { steps, determinant };
}

function buildCalculation(matrix, mode) {
  if (mode === "cofactor") return cofactorSteps(matrix, false);
  if (mode === "cofactor-compact") return cofactorSteps(matrix, true);
  return eliminationSteps(matrix);
}

function renderMathMatrix(matrix) {
  elements.mathMatrixA.innerHTML = "";
  elements.mathMatrixA.style.gridTemplateColumns = `repeat(${matrix[0].length}, minmax(44px, auto))`;
  matrix.forEach((row) => {
    row.forEach((value) => {
      const cell = document.createElement("span");
      cell.className = "math-matrix-cell";
      cell.textContent = formatNumber(value);
      elements.mathMatrixA.append(cell);
    });
  });
}

function renderMethodMatrix(matrix, step = {}) {
  elements.methodMatrix.innerHTML = "";
  setGrid(elements.methodMatrix, matrix.length, matrix[0].length);
  matrix.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const cell = document.createElement("div");
      cell.className = "cell-output method-cell";
      cell.textContent = formatNumber(value);
      if (step.activeRows?.includes(rowIndex)) cell.classList.add("row-cell");
      if (step.pivot?.[0] === rowIndex && step.pivot?.[1] === colIndex) cell.classList.add("pivot-cell");
      if (step.activeCells?.some(([activeRow, activeCol]) => activeRow === rowIndex && activeCol === colIndex)) {
        cell.classList.add("referenced-a");
      }
      elements.methodMatrix.append(cell);
    });
  });
}

function renderPendingDeterminant() {
  elements.resultMatrix.innerHTML = "";
  setGrid(elements.resultMatrix, 1, 1);
  const cell = document.createElement("div");
  cell.className = "cell-output determinant-scalar pending-solution";
  cell.textContent = "det(A) = ?";
  elements.resultMatrix.append(cell);
  elements.determinantValue.textContent = "?";
}

function renderDeterminantResult(value) {
  elements.resultMatrix.innerHTML = "";
  setGrid(elements.resultMatrix, 1, 1);
  const cell = document.createElement("div");
  cell.className = "cell-output determinant-scalar";
  cell.textContent = `det(A) = ${formatNumber(value)}`;
  elements.resultMatrix.append(cell);
  elements.determinantValue.textContent = formatNumber(value);
}

function renderTrack(step) {
  elements.animationTrack.innerHTML = "";
  const left = document.createElement("div");
  left.className = "flow-cell source-a";
  left.textContent = step.sourceLabel || (step.sourceCell ? entryName(step.sourceCell[0], step.sourceCell[1]) : step.activeRows?.length ? step.activeRows.map((row) => `R${row + 1}`).join(", ") : "A");

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

function updateMethodHeaders() {
  if (state.mode === "cofactor") {
    elements.methodTitle.textContent = "余因子展開";
    elements.methodSubtitle.textContent = "小行列を順に追う";
  } else if (state.mode === "cofactor-compact") {
    elements.methodTitle.textContent = "余因子展開（簡潔）";
    elements.methodSubtitle.textContent = "途中省略あり";
  } else {
    elements.methodTitle.textContent = "上三角化";
    elements.methodSubtitle.textContent = "行基本変形";
  }
}

function animate() {
  clearAnimation();
  elements.message.textContent = "";
  let calculation;
  let inputMatrix;

  try {
    inputMatrix = readInputMatrix();
    calculation = buildCalculation(inputMatrix, state.mode);
  } catch (error) {
    elements.message.textContent = error.message;
    return;
  }

  renderMathMatrix(inputMatrix);
  renderMethodMatrix(calculation.steps[0].matrix, calculation.steps[0]);
  renderPendingDeterminant();

  calculation.steps.forEach((step, index) => {
    const timerId = window.setTimeout(() => {
      renderMethodMatrix(step.matrix, step);
      renderTrack(step);
      if (index === calculation.steps.length - 1) renderDeterminantResult(calculation.determinant);
      elements.formulaTitle.textContent = step.title;
      elements.formula.textContent = step.formula || step.text;
      appendHistory(step);
    }, index * 1200);
    state.timerIds.push(timerId);
  });
}

function updateLiveDisplays() {
  clearAnimation();
  try {
    const matrix = readInputMatrix();
    renderMathMatrix(matrix);
    renderMethodMatrix(matrix);
    renderPendingDeterminant();
    elements.message.textContent = "";
    elements.formulaTitle.textContent = state.mode === "elimination" ? "行列式" : "余因子展開";
    elements.formula.textContent = state.mode === "elimination" ? DEFAULT_FORMULAS[state.mode] : expansionFormula(matrix.length, 0);
  } catch (error) {
    elements.message.textContent = error.message;
  }
}

function syncLayout() {
  clearAnimation();
  state.n = clampSize(elements.sizeN.value);
  state.mode = elements.methodMode.value;
  elements.sizeN.value = state.n;
  createInputGrid();
  updateMethodHeaders();
  updateLiveDisplays();
  elements.labelA.textContent = `${state.n} x ${state.n}`;
  elements.labelR.textContent = "det(A)";
  elements.dimensionStatus.textContent = `${state.n} x ${state.n}`;
}

elements.sizeN.addEventListener("change", syncLayout);
elements.methodMode.addEventListener("change", syncLayout);
elements.randomize.addEventListener("click", randomizeInputs);
elements.animate.addEventListener("click", animate);

syncLayout();
