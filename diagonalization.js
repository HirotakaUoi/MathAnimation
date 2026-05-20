const EPSILON = 1e-9;
const MAX_RATIONAL_DENOMINATOR = 1000;

const elements = {
  randomize: document.querySelector("#randomize"),
  animate: document.querySelector("#animate"),
  matrixA: document.querySelector("#matrixA"),
  mathMatrixA: document.querySelector("#mathMatrixA"),
  mathMatrixP: document.querySelector("#mathMatrixP"),
  mathMatrixD: document.querySelector("#mathMatrixD"),
  characteristicEquation: document.querySelector("#characteristicEquation"),
  eigenSummary: document.querySelector("#eigenSummary"),
  diagonalizationSummary: document.querySelector("#diagonalizationSummary"),
  methodMatrix: document.querySelector("#methodMatrix"),
  resultMatrix: document.querySelector("#resultMatrix"),
  resultText: document.querySelector("#resultText"),
  methodTitle: document.querySelector("#methodTitle"),
  methodSubtitle: document.querySelector("#methodSubtitle"),
  labelR: document.querySelector("#labelR"),
  dimensionStatus: document.querySelector("#dimensionStatus"),
  message: document.querySelector("#message"),
  animationTrack: document.querySelector("#animationTrack"),
  formulaTitle: document.querySelector("#formulaTitle"),
  formula: document.querySelector("#formula"),
  historyList: document.querySelector("#historyList"),
};

const state = {
  timerIds: [],
};

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

  if (bestError > 1e-8) return null;
  return { numerator: sign * bestNumerator, denominator: bestDenominator };
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const temp = x % y;
    x = y;
    y = temp;
  }
  return x || 1;
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

function formatNumber(value) {
  if (typeof value === "string") return value;
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

function formatSigned(value, suffix = "") {
  if (Math.abs(value) < EPSILON) return "";
  return `${value > 0 ? "+" : "-"} ${formatNumber(Math.abs(value))}${suffix}`;
}

function polynomialString(trace, determinant) {
  const linear = Math.abs(trace) < EPSILON ? "" : `${trace >= 0 ? "- " : "+ "}${formatNumber(Math.abs(trace))}λ `;
  const constant = Math.abs(determinant) < EPSILON ? "" : `${determinant >= 0 ? "+ " : "- "}${formatNumber(Math.abs(determinant))}`;
  const expression = `λ² ${linear}${constant}`.replace(/\s+/g, " ").trim();
  return expression.endsWith("+") || expression.endsWith("-") ? `${expression} 0` : expression;
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

function cleanNumber(value) {
  return Math.abs(value) < EPSILON ? 0 : value;
}

function cloneMatrix(matrix) {
  return matrix.map((row) => row.slice());
}

function setGrid(element, rows, cols) {
  element.style.gridTemplateColumns = `repeat(${cols}, minmax(var(--matrix-cell-min, 0px), 1fr))`;
  element.dataset.rows = rows;
  element.dataset.cols = cols;
}

function clearTimers() {
  state.timerIds.forEach((timerId) => window.clearTimeout(timerId));
  state.timerIds = [];
}

function clearAnimation() {
  clearTimers();
  elements.animationTrack.innerHTML = "";
  elements.historyList.innerHTML = "";
}

function createInputGrid() {
  const defaults = [
    [2, 1],
    [1, 2],
  ];
  elements.matrixA.innerHTML = "";
  setGrid(elements.matrixA, 2, 2);
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 2; col += 1) {
      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "decimal";
      input.spellcheck = false;
      input.className = "cell-input";
      input.value = defaults[row][col];
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
  for (let row = 0; row < 2; row += 1) {
    const line = [];
    for (let col = 0; col < 2; col += 1) {
      const cell = cells[row * 2 + col];
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

function determinant2(matrix) {
  return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
}

function multiplyMatrices(left, right) {
  return left.map((row) =>
    right[0].map((_, colIndex) =>
      cleanNumber(row.reduce((sum, value, rowIndex) => sum + value * right[rowIndex][colIndex], 0)),
    ),
  );
}

function inverse2(matrix) {
  const det = determinant2(matrix);
  if (Math.abs(det) < EPSILON) return null;
  return [
    [cleanNumber(matrix[1][1] / det), cleanNumber(-matrix[0][1] / det)],
    [cleanNumber(-matrix[1][0] / det), cleanNumber(matrix[0][0] / det)],
  ];
}

function matrixMinusLambdaI(matrix, lambda) {
  return [
    [cleanNumber(matrix[0][0] - lambda), cleanNumber(matrix[0][1])],
    [cleanNumber(matrix[1][0]), cleanNumber(matrix[1][1] - lambda)],
  ];
}

function normalizeVector(vector) {
  const rationals = vector.map((value) => approximateRational(value));
  if (rationals.every(Boolean)) {
    const denominator = rationals.reduce((acc, item) => lcm(acc, item.denominator), 1);
    let integers = rationals.map((item) => (item.numerator * denominator) / item.denominator);
    const divisor = integers.reduce((acc, value) => gcd(acc, value), 0) || 1;
    integers = integers.map((value) => value / divisor);
    const first = integers.find((value) => Math.abs(value) > EPSILON) || 1;
    if (first < 0) integers = integers.map((value) => -value);
    return integers;
  }
  const first = vector.find((value) => Math.abs(value) > EPSILON);
  return first && first < 0 ? vector.map((value) => -value) : vector.slice();
}

function solveEigenvector(matrix, lambda) {
  const start = matrixMinusLambdaI(matrix, lambda);
  let working = cloneMatrix(start);

  const rowNorm = (row) => Math.abs(row[0]) + Math.abs(row[1]);
  if (rowNorm(working[0]) < EPSILON && rowNorm(working[1]) > EPSILON) {
    working = [working[1], working[0]];
  }

  if (rowNorm(working[0]) < EPSILON && rowNorm(working[1]) < EPSILON) {
    return {
      vector: [1, 0],
      free: true,
      text: `A = ${formatNumber(lambda)}I なので、0 でない任意のベクトルが固有ベクトルです。`,
    };
  }

  if (rowNorm(working[1]) > EPSILON) {
    let factor = 0;
    if (Math.abs(working[0][0]) > EPSILON) factor = working[1][0] / working[0][0];
    else if (Math.abs(working[0][1]) > EPSILON) factor = working[1][1] / working[0][1];
    if (Math.abs(factor) > EPSILON) {
      working[1][0] = cleanNumber(working[1][0] - factor * working[0][0]);
      working[1][1] = cleanNumber(working[1][1] - factor * working[0][1]);
    }
  }

  const equationRow = rowNorm(working[0]) > EPSILON ? working[0] : working[1];
  const [p, q] = equationRow;
  if (Math.abs(p) < EPSILON) {
    return {
      vector: [1, 0],
      free: false,
      text: `${formatNumber(q)}y = 0 なので y = 0、x = 1 とすれば v = (1, 0) です。`,
    };
  }
  if (Math.abs(q) < EPSILON) {
    return {
      vector: [0, 1],
      free: false,
      text: `${formatNumber(p)}x = 0 なので x = 0、y = 1 とすれば v = (0, 1) です。`,
    };
  }
  const vector = normalizeVector([q, -p]);
  return {
    vector,
    free: false,
    text: `${formatNumber(p)}x ${formatSigned(q, "y")} = 0 なので、v = (${formatNumber(vector[0])}, ${formatNumber(vector[1])}) とおけます。`,
  };
}

function analyzeMatrix(matrix) {
  const trace = matrix[0][0] + matrix[1][1];
  const determinant = determinant2(matrix);
  const discriminant = trace ** 2 - 4 * determinant;
  const polynomial = polynomialString(trace, determinant);
  const equation = `det(A - λI) = (${formatNumber(matrix[0][0])} - λ)(${formatNumber(matrix[1][1])} - λ) - ${formatNumber(matrix[0][1])} × ${formatNumber(matrix[1][0])} = ${polynomial} = 0`;

  if (discriminant < -EPSILON) {
    const realPart = trace / 2;
    const imaginaryPart = Math.sqrt(-discriminant) / 2;
    return {
      trace,
      determinant,
      discriminant,
      equation,
      realEigenvalues: [],
      summary: `D = ${formatNumber(discriminant)} < 0 なので、実数の固有値はありません。 λ = ${formatNumber(realPart)} ± ${formatNumber(imaginaryPart)}i`,
      complexSummary: `λ = ${formatNumber(realPart)} ± ${formatNumber(imaginaryPart)}i`,
    };
  }

  const root = Math.sqrt(Math.max(discriminant, 0));
  const lambda1 = cleanNumber((trace + root) / 2);
  const lambda2 = cleanNumber((trace - root) / 2);
  const realEigenvalues = Math.abs(lambda1 - lambda2) < EPSILON ? [lambda1] : [lambda1, lambda2];
  const summary = realEigenvalues.length === 1
    ? `D = ${formatNumber(discriminant)} なので重解です。 λ = ${formatNumber(realEigenvalues[0])}`
    : `D = ${formatNumber(discriminant)} なので、λ₁ = ${formatNumber(realEigenvalues[0])}, λ₂ = ${formatNumber(realEigenvalues[1])}`;

  return { trace, determinant, discriminant, equation, realEigenvalues, summary };
}

function diagonalize(matrix) {
  const analysis = analyzeMatrix(matrix);
  if (!analysis.realEigenvalues.length) {
    return {
      diagonalizable: false,
      analysis,
      reason: "実数の固有値がないので、このページの範囲では対角化しません。",
    };
  }

  if (analysis.realEigenvalues.length === 2) {
    const [lambda1, lambda2] = analysis.realEigenvalues;
    const eigen1 = solveEigenvector(matrix, lambda1);
    const eigen2 = solveEigenvector(matrix, lambda2);
    const P = [
      [eigen1.vector[0], eigen2.vector[0]],
      [eigen1.vector[1], eigen2.vector[1]],
    ];
    const Pinv = inverse2(P);
    const D = [
      [lambda1, 0],
      [0, lambda2],
    ];
    const verification = multiplyMatrices(Pinv, multiplyMatrices(matrix, P));
    return {
      diagonalizable: true,
      analysis,
      eigenData: [
        { lambda: lambda1, vector: eigen1.vector, text: eigen1.text },
        { lambda: lambda2, vector: eigen2.vector, text: eigen2.text },
      ],
      P,
      Pinv,
      D,
      verification,
      summary: "異なる 2 つの実固有値があるので、対応する固有ベクトル 2 本を列に並べれば対角化できます。",
    };
  }

  const lambda = analysis.realEigenvalues[0];
  const residual = matrixMinusLambdaI(matrix, lambda);
  const zeroResidual = residual.flat().every((value) => Math.abs(value) < EPSILON);
  if (zeroResidual) {
    const P = [
      [1, 0],
      [0, 1],
    ];
    const D = [
      [lambda, 0],
      [0, lambda],
    ];
    return {
      diagonalizable: true,
      analysis,
      eigenData: [
        { lambda, vector: [1, 0], text: "v₁ = (1, 0) を選べます。" },
        { lambda, vector: [0, 1], text: "v₂ = (0, 1) も固有ベクトルです。" },
      ],
      P,
      Pinv: P,
      D,
      verification: D,
      summary: "A = λI なので、標準基底のままで既に対角行列です。",
    };
  }

  const eigen = solveEigenvector(matrix, lambda);
  return {
    diagonalizable: false,
    analysis,
    eigenData: [{ lambda, vector: eigen.vector, text: eigen.text }],
    reason: "重解ですが独立な固有ベクトルを 2 本取れないので、2 x 2 実行列としては対角化できません。",
  };
}

function renderMatrixTo(container, matrix) {
  container.innerHTML = "";
  container.style.gridTemplateColumns = `repeat(${matrix[0].length}, minmax(44px, auto))`;
  matrix.forEach((row) => {
    row.forEach((value) => {
      const cell = document.createElement("span");
      cell.className = "math-matrix-cell";
      cell.textContent = formatNumber(value);
      container.append(cell);
    });
  });
}

function renderEquationSummary(matrix, diagonalization) {
  renderMatrixTo(elements.mathMatrixA, matrix);
  elements.characteristicEquation.textContent = diagonalization.analysis.equation;
  const eigenText = diagonalization.analysis.realEigenvalues.length
    ? diagonalization.eigenData.map((entry, index) => `λ${diagonalization.eigenData.length > 1 ? index + 1 : ""} = ${formatNumber(entry.lambda)}, v${diagonalization.eigenData.length > 1 ? index + 1 : ""} = (${entry.vector.map((value) => formatNumber(value)).join(", ")})`).join(" / ")
    : diagonalization.analysis.summary;
  elements.eigenSummary.textContent = eigenText;

  if (diagonalization.diagonalizable) {
    renderMatrixTo(elements.mathMatrixP, diagonalization.P);
    renderMatrixTo(elements.mathMatrixD, diagonalization.D);
    elements.diagonalizationSummary.textContent = `P^-1 A P = D = ${diagonalization.D[0][0] === diagonalization.D[1][1] ? `${formatNumber(diagonalization.D[0][0])}I` : "diag(固有値)" } になります。 ${diagonalization.summary}`;
  } else {
    renderMatrixTo(elements.mathMatrixP, [["?", "?"], ["?", "?"]]);
    renderMatrixTo(elements.mathMatrixD, [["?", "?"], ["?", "?"]]);
    elements.diagonalizationSummary.textContent = diagonalization.reason;
  }
}

function renderMethodMatrix(matrix, step = {}) {
  elements.methodMatrix.innerHTML = "";
  setGrid(elements.methodMatrix, matrix.length, matrix[0].length);
  matrix.forEach((row, rowIndex) => {
    row.forEach((value) => {
      const cell = document.createElement("div");
      cell.className = "cell-output method-cell";
      cell.textContent = formatNumber(value);
      if (step.activeRows?.includes(rowIndex)) cell.classList.add("row-cell");
      elements.methodMatrix.append(cell);
    });
  });
}

function renderPendingResult() {
  elements.resultMatrix.innerHTML = "";
  setGrid(elements.resultMatrix, 2, 1);
  for (let index = 0; index < 2; index += 1) {
    const cell = document.createElement("div");
    cell.className = "cell-output determinant-scalar pending-solution";
    cell.textContent = "?";
    elements.resultMatrix.append(cell);
  }
  elements.resultText.textContent = "再生すると P, D を表示します。";
  elements.labelR.textContent = "P, D";
}

function renderResult(step) {
  elements.resultMatrix.innerHTML = "";
  if (step.resultMatrix) {
    setGrid(elements.resultMatrix, step.resultMatrix.length, step.resultMatrix[0].length);
    step.resultMatrix.forEach((row) => {
      row.forEach((value) => {
        const cell = document.createElement("div");
        cell.className = "cell-output determinant-scalar";
        cell.textContent = formatNumber(value);
        elements.resultMatrix.append(cell);
      });
    });
  } else if (step.resultMessage) {
    setGrid(elements.resultMatrix, 1, 1);
    const cell = document.createElement("div");
    cell.className = "cell-output determinant-scalar pending-solution";
    cell.textContent = step.resultMessage;
    elements.resultMatrix.append(cell);
  } else {
    renderPendingResult();
    return;
  }
  elements.labelR.textContent = step.resultLabel || "Result";
  elements.resultText.textContent = step.resultText || "";
}

function renderTrack(step) {
  elements.animationTrack.innerHTML = "";
  const left = document.createElement("div");
  left.className = "flow-cell source-a";
  left.textContent = step.sourceLabel || "A";
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

function buildCalculation(matrix) {
  const diagonalization = diagonalize(matrix);
  const steps = [
    {
      title: "特性方程式を立てる",
      text: "det(A - λI) = 0 を作って固有値を調べます。",
      formula: diagonalization.analysis.equation,
      matrix: cloneMatrix(matrix),
      sourceLabel: "det(A - λI)",
    },
    {
      title: "固有値を求める",
      text: diagonalization.analysis.summary,
      formula: diagonalization.analysis.summary,
      matrix: cloneMatrix(matrix),
      sourceLabel: "固有値",
    },
  ];

  if (!diagonalization.analysis.realEigenvalues.length) {
    steps.push({
      title: "実数では対角化しない",
      text: diagonalization.reason,
      formula: diagonalization.analysis.complexSummary,
      matrix: cloneMatrix(matrix),
      resultMessage: "実数では対角化なし",
      resultText: diagonalization.reason,
      resultLabel: "結論",
      sourceLabel: "複素固有値",
    });
    return { diagonalization, steps };
  }

  diagonalization.eigenData.forEach((entry, index) => {
    steps.push({
      title: `固有ベクトル v${diagonalization.eigenData.length > 1 ? index + 1 : ""} を取る`,
      text: entry.text,
      formula: `λ = ${formatNumber(entry.lambda)}`,
      matrix: matrixMinusLambdaI(matrix, entry.lambda),
      resultMatrix: [[entry.vector[0]], [entry.vector[1]]],
      resultLabel: `v${diagonalization.eigenData.length > 1 ? index + 1 : ""}`,
      resultText: `固有ベクトルの一例: (${entry.vector.map((value) => formatNumber(value)).join(", ")})`,
      sourceLabel: `λ = ${formatNumber(entry.lambda)}`,
    });
  });

  if (!diagonalization.diagonalizable) {
    steps.push({
      title: "対角化できない",
      text: diagonalization.reason,
      formula: diagonalization.reason,
      matrix: cloneMatrix(matrix),
      resultMessage: "対角化不可",
      resultText: diagonalization.reason,
      resultLabel: "結論",
      sourceLabel: "判定",
    });
    return { diagonalization, steps };
  }

  steps.push({
    title: "P を作る",
    text: "固有ベクトルを列に並べて P を作ります。",
    formula: "P = [v1 v2]",
    matrix: cloneMatrix(diagonalization.P),
    resultMatrix: diagonalization.P,
    resultLabel: "P",
    resultText: "列が固有ベクトルです。",
    sourceLabel: "P",
  });
  steps.push({
    title: "D を作る",
    text: "対応する固有値を対角成分に並べます。",
    formula: "D = diag(λ1, λ2)",
    matrix: cloneMatrix(diagonalization.D),
    resultMatrix: diagonalization.D,
    resultLabel: "D",
    resultText: "対角成分が固有値です。",
    sourceLabel: "D",
  });
  steps.push({
    title: "P^-1 A P を確かめる",
    text: "実際に計算すると D になります。",
    formula: "P^-1 A P = D",
    matrix: cloneMatrix(diagonalization.verification),
    resultMatrix: diagonalization.verification,
    resultLabel: "P^-1AP",
    resultText: `P^-1 A P = (${diagonalization.verification[0].map((value) => formatNumber(value)).join(", ")} / ${diagonalization.verification[1].map((value) => formatNumber(value)).join(", ")})`,
    sourceLabel: "検算",
  });

  return { diagonalization, steps };
}

function updatePreviewMatrix(matrix, diagonalization) {
  if (diagonalization.analysis.realEigenvalues.length) {
    elements.methodTitle.textContent = "A - λI";
    elements.methodSubtitle.textContent = `まず λ = ${formatNumber(diagonalization.analysis.realEigenvalues[0])}`;
    renderMethodMatrix(matrixMinusLambdaI(matrix, diagonalization.analysis.realEigenvalues[0]));
  } else {
    elements.methodTitle.textContent = "特性方程式";
    elements.methodSubtitle.textContent = "実数固有値なし";
    renderMethodMatrix(matrix);
  }
}

function animate() {
  clearAnimation();
  elements.message.textContent = "";

  let matrix;
  let calculation;
  try {
    matrix = readInputMatrix();
    calculation = buildCalculation(matrix);
  } catch (error) {
    elements.message.textContent = error.message;
    return;
  }

  renderEquationSummary(matrix, calculation.diagonalization);
  renderPendingResult();

  calculation.steps.forEach((step, index) => {
    const timerId = window.setTimeout(() => {
      renderMethodMatrix(step.matrix, step);
      renderTrack(step);
      renderResult(step);
      elements.methodTitle.textContent = step.title;
      elements.methodSubtitle.textContent = step.sourceLabel || "";
      elements.formulaTitle.textContent = step.title;
      elements.formula.textContent = step.formula || step.text;
      appendHistory(step);
    }, index * 1250);
    state.timerIds.push(timerId);
  });
}

function randomInteger() {
  const value = Math.floor(Math.random() * 9) - 4;
  return value === 0 ? 1 : value;
}

function setMatrixValues(values) {
  const inputs = Array.from(elements.matrixA.querySelectorAll("input"));
  values.flat().forEach((value, index) => {
    inputs[index].value = value;
  });
}

function randomizeInputs() {
  const patterns = ["distinct", "diagonalizableRepeated", "nondiagonalizableRepeated", "complex"];
  const target = patterns[Math.floor(Math.random() * patterns.length)];

  for (let attempt = 0; attempt < 240; attempt += 1) {
    let candidate;
    if (target === "diagonalizableRepeated") {
      const lambda = randomInteger();
      candidate = [[lambda, 0], [0, lambda]];
    } else if (target === "nondiagonalizableRepeated") {
      const lambda = randomInteger();
      candidate = [[lambda, 1], [0, lambda]];
    } else {
      candidate = [
        [randomInteger(), randomInteger()],
        [randomInteger(), randomInteger()],
      ];
    }
    const diagonalization = diagonalize(candidate);
    const distinct = diagonalization.diagonalizable && diagonalization.analysis.realEigenvalues.length === 2;
    const diagonalizableRepeated = diagonalization.diagonalizable && diagonalization.analysis.realEigenvalues.length === 1;
    const nondiagonalizableRepeated = !diagonalization.diagonalizable && diagonalization.analysis.realEigenvalues.length === 1;
    const complex = !diagonalization.analysis.realEigenvalues.length;
    if (
      (target === "distinct" && distinct) ||
      (target === "diagonalizableRepeated" && diagonalizableRepeated) ||
      (target === "nondiagonalizableRepeated" && nondiagonalizableRepeated) ||
      (target === "complex" && complex)
    ) {
      setMatrixValues(candidate);
      updateLiveDisplays();
      return;
    }
  }

  setMatrixValues([[2, 1], [1, 2]]);
  updateLiveDisplays();
}

function updateLiveDisplays() {
  clearAnimation();
  try {
    const matrix = readInputMatrix();
    const diagonalization = diagonalize(matrix);
    renderEquationSummary(matrix, diagonalization);
    updatePreviewMatrix(matrix, diagonalization);
    renderPendingResult();
    elements.formulaTitle.textContent = "対角化の公式";
    elements.formula.textContent = diagonalization.diagonalizable ? "P^-1 A P = D" : "まず実数の固有値と独立な固有ベクトル 2 本が必要です。";
    elements.message.textContent = diagonalization.diagonalizable ? "" : diagonalization.reason;
  } catch (error) {
    elements.message.textContent = error.message;
  }
}

elements.randomize.addEventListener("click", randomizeInputs);
elements.animate.addEventListener("click", animate);

createInputGrid();
elements.dimensionStatus.textContent = "2 x 2";
updateLiveDisplays();
