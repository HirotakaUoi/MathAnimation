const EPSILON = 1e-9;
const MAX_RATIONAL_DENOMINATOR = 1000;

const elements = {
  sampleMode: document.querySelector("#sampleMode"),
  randomize: document.querySelector("#randomize"),
  animate: document.querySelector("#animate"),
  sizePill: document.querySelector("#sizePill"),
  matrixA: document.querySelector("#matrixA"),
  mathMatrixA: document.querySelector("#mathMatrixA"),
  characteristicEquation: document.querySelector("#characteristicEquation"),
  eigenvalueSummary: document.querySelector("#eigenvalueSummary"),
  methodMatrix: document.querySelector("#methodMatrix"),
  resultMatrix: document.querySelector("#resultMatrix"),
  resultText: document.querySelector("#resultText"),
  methodTitle: document.querySelector("#methodTitle"),
  methodSubtitle: document.querySelector("#methodSubtitle"),
  labelR: document.querySelector("#labelR"),
  dimensionStatus: document.querySelector("#dimensionStatus"),
  matrixSizeLabel: document.querySelector("#matrixSizeLabel"),
  message: document.querySelector("#message"),
  animationTrack: document.querySelector("#animationTrack"),
  formulaTitle: document.querySelector("#formulaTitle"),
  formula: document.querySelector("#formula"),
  historyList: document.querySelector("#historyList"),
};

const state = {
  timerIds: [],
};

const SAMPLE_PRESETS = {
  sample3distinct: {
    dimension: 3,
    matrix: [
      [2, 1, 0],
      [1, 2, 0],
      [0, 0, 4],
    ],
    equation: "det(A - λI) = (4 - λ)((2 - λ)(2 - λ) - 1) = -λ^3 + 8λ^2 - 19λ + 12 = -(λ - 4)(λ - 3)(λ - 1) = 0",
    summary: "λ₁ = 3, λ₂ = 1, λ₃ = 4",
    eigenData: [
      { lambda: 3, vector: [1, 1, 0], text: "λ = 3 に対して v₁ = (1, 1, 0) を取れます。" },
      { lambda: 1, vector: [1, -1, 0], text: "λ = 1 に対して v₂ = (1, -1, 0) を取れます。" },
      { lambda: 4, vector: [0, 0, 1], text: "λ = 4 に対して v₃ = (0, 0, 1) を取れます。" },
    ],
  },
  sample3repeat: {
    dimension: 3,
    matrix: [
      [2, 1, 0],
      [1, 2, 0],
      [0, 0, 3],
    ],
    equation: "det(A - λI) = (3 - λ)((2 - λ)(2 - λ) - 1) = -λ^3 + 7λ^2 - 15λ + 9 = -(λ - 3)^2(λ - 1) = 0",
    summary: "λ = 3, 3, 1",
    eigenData: [
      { lambda: 3, vector: [1, 1, 0], text: "λ = 3 に対して v₁ = (1, 1, 0) を取れます。" },
      { lambda: 1, vector: [1, -1, 0], text: "λ = 1 に対して v₂ = (1, -1, 0) を取れます。" },
      { lambda: 3, vector: [0, 0, 1], text: "もう 1 本の λ = 3 の固有ベクトルとして v₃ = (0, 0, 1) を取れます。" },
    ],
  },
  sample3nondiag: {
    dimension: 3,
    matrix: [
      [2, 1, 0],
      [0, 2, 0],
      [0, 0, 3],
    ],
    equation: "det(A - λI) = (2 - λ)(2 - λ)(3 - λ) = -λ^3 + 7λ^2 - 16λ + 12 = -(λ - 2)^2(λ - 3) = 0",
    summary: "λ = 2, 2, 3",
    eigenData: [
      { lambda: 2, vector: [1, 0, 0], text: "λ = 2 に対する固有ベクトルは v = (1, 0, 0) の方向だけです。" },
      { lambda: 3, vector: [0, 0, 1], text: "λ = 3 に対しては v = (0, 0, 1) を取れます。" },
    ],
    reason: "重解 λ = 2 に対して独立な固有ベクトルが 2 本ないので、固有ベクトルは 3 本そろいません。",
  },
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

function sqrtText(value) {
  const cleaned = cleanNumber(value);
  const root = Math.sqrt(cleaned);
  if (Number.isFinite(root) && Math.abs(root - Math.round(root)) < EPSILON) {
    return formatNumber(Math.round(root));
  }
  const text = formatNumber(cleaned);
  return Number.isInteger(cleaned) ? `√${text}` : `√(${text})`;
}

function factorizedPolynomialString(trace, discriminant, eigenvalues) {
  if (!eigenvalues.length) return "";
  if (eigenvalues.length === 1) {
    return `(λ - ${formatNumber(trace / 2)})^2`;
  }
  const root = Math.sqrt(cleanNumber(discriminant));
  if (Number.isFinite(root) && Math.abs(root - Math.round(root)) < EPSILON) {
    return eigenvalues.map((lambda) => `(λ ${lambda >= 0 ? "-" : "+"} ${formatNumber(Math.abs(lambda))})`).join("");
  }
  const traceText = formatNumber(trace);
  const rootText = sqrtText(discriminant);
  return [
    `(λ - (${traceText} + ${rootText})/2)`,
    `(λ - (${traceText} - ${rootText})/2)`,
  ].join("");
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

function setGrid(element, rows, cols) {
  element.style.gridTemplateColumns = `repeat(${cols}, minmax(var(--matrix-cell-min, 0px), 1fr))`;
  element.dataset.rows = rows;
  element.dataset.cols = cols;
}

function cloneMatrix(matrix) {
  return matrix.map((row) => row.slice());
}

function cleanNumber(value) {
  return Math.abs(value) < EPSILON ? 0 : value;
}

function cleanMatrix(matrix) {
  return matrix.map((row) => row.map(cleanNumber));
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

function currentDimension() {
  return elements.sampleMode.value === "free2" ? 2 : SAMPLE_PRESETS[elements.sampleMode.value].dimension;
}

function createInputGrid(size = 2, defaults = [[2, 1], [1, 2]], readOnly = false) {
  elements.matrixA.innerHTML = "";
  setGrid(elements.matrixA, size, size);

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "decimal";
      input.spellcheck = false;
      input.className = "cell-input";
      input.value = defaults[row][col];
      input.readOnly = readOnly;
      input.dataset.row = row;
      input.dataset.col = col;
      input.ariaLabel = `A${row + 1}${col + 1}`;
      if (!readOnly) input.addEventListener("input", updateLiveDisplays);
      elements.matrixA.append(input);
    }
  }
}

function readInputMatrix() {
  const cells = Array.from(elements.matrixA.querySelectorAll("input"));
  const size = currentDimension();
  const matrix = [];
  for (let row = 0; row < size; row += 1) {
    const line = [];
    for (let col = 0; col < size; col += 1) {
      const cell = cells[row * size + col];
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

function matrixMinusLambdaI(matrix, lambda) {
  return matrix.map((row, rowIndex) =>
    row.map((value, colIndex) => cleanNumber(value - (rowIndex === colIndex ? lambda : 0))),
  );
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
  let working = cleanMatrix(start);
  const steps = [];

  steps.push({
    title: `A - ${formatNumber(lambda)}I を作る`,
    text: `(A - ${formatNumber(lambda)}I)v = 0 を解きます。`,
    formula: `A - ${formatNumber(lambda)}I`,
    matrix: cloneMatrix(working),
    sourceLabel: `λ = ${formatNumber(lambda)}`,
    eigenvalue: lambda,
  });

  const rowNorm = (row) => Math.abs(row[0]) + Math.abs(row[1]);
  if (rowNorm(working[0]) < EPSILON && rowNorm(working[1]) > EPSILON) {
    working = [working[1], working[0]];
    steps.push({
      title: "行を入れ替える",
      text: "上の行を非零にして、式を読み取りやすくします。",
      formula: "R1 ↔ R2",
      matrix: cloneMatrix(working),
      activeRows: [0, 1],
      sourceLabel: `λ = ${formatNumber(lambda)}`,
      eigenvalue: lambda,
    });
  }

  if (rowNorm(working[0]) < EPSILON && rowNorm(working[1]) < EPSILON) {
    const representative = [1, 0];
    steps.push({
      title: "すべての式が 0 = 0",
      text: `A = ${formatNumber(lambda)}I なので、0 でない任意のベクトルが固有ベクトルです。`,
      formula: `(A - ${formatNumber(lambda)}I)v = 0 は恒等式`,
      matrix: cloneMatrix(working),
      resultVector: representative,
      resultText: `λ = ${formatNumber(lambda)} では、0 でない任意のベクトルが固有ベクトルです。例として v = (1, 0) を表示します。`,
      sourceLabel: `λ = ${formatNumber(lambda)}`,
      eigenvalue: lambda,
    });
    return { steps };
  }

  if (rowNorm(working[1]) > EPSILON) {
    let factor = 0;
    if (Math.abs(working[0][0]) > EPSILON) factor = working[1][0] / working[0][0];
    else if (Math.abs(working[0][1]) > EPSILON) factor = working[1][1] / working[0][1];

    if (Math.abs(factor) > EPSILON) {
      working[1][0] = cleanNumber(working[1][0] - factor * working[0][0]);
      working[1][1] = cleanNumber(working[1][1] - factor * working[0][1]);
      steps.push({
        title: "下の行を消去",
        text: `det(A - ${formatNumber(lambda)}I) = 0 なので、式は 1 本にまとまります。`,
        formula: `R2 ← R2 ${factor >= 0 ? "-" : "+"} (${formatNumber(Math.abs(factor))})R1`,
        matrix: cloneMatrix(working),
        activeRows: [0, 1],
        sourceLabel: `λ = ${formatNumber(lambda)}`,
        eigenvalue: lambda,
      });
    }
  }

  const equationRow = rowNorm(working[0]) > EPSILON ? working[0] : working[1];
  const [p, q] = equationRow;

  let vector;
  let text;
  if (Math.abs(p) < EPSILON) {
    vector = [1, 0];
    text = `${formatNumber(q)}y = 0 なので y = 0 です。x = 1 とすれば v = (1, 0) です。`;
  } else if (Math.abs(q) < EPSILON) {
    vector = [0, 1];
    text = `${formatNumber(p)}x = 0 なので x = 0 です。y = 1 とすれば v = (0, 1) です。`;
  } else {
    vector = normalizeVector([q, -p]);
    text = `${formatNumber(p)}x ${formatSigned(q, "y")} = 0 なので、(x, y) = (${formatNumber(vector[0])}, ${formatNumber(vector[1])}) とおけます。`;
  }

  steps.push({
    title: "自由変数で固有ベクトルを作る",
    text,
    formula: `${formatNumber(p)}x ${formatSigned(q, "y")} = 0`,
    matrix: cloneMatrix(working),
    resultVector: vector,
    resultText: `λ = ${formatNumber(lambda)} に対する固有ベクトルの一例: v = (${formatNumber(vector[0])}, ${formatNumber(vector[1])})`,
    sourceLabel: `λ = ${formatNumber(lambda)}`,
    eigenvalue: lambda,
  });

  return { steps };
}

function analyzeMatrix(matrix) {
  const trace = matrix[0][0] + matrix[1][1];
  const determinant = determinant2(matrix);
  const discriminant = trace ** 2 - 4 * determinant;
  const polynomial = polynomialString(trace, determinant);
  const rawEquation = `det(A - λI) = (${formatNumber(matrix[0][0])} - λ)(${formatNumber(matrix[1][1])} - λ) - ${formatNumber(matrix[0][1])} × ${formatNumber(matrix[1][0])}`;

  if (discriminant < -EPSILON) {
    const realPart = trace / 2;
    const imaginaryPart = Math.sqrt(-discriminant) / 2;
    return {
      trace,
      determinant,
      discriminant,
      equation: `${rawEquation} = ${polynomial} = 0`,
      realEigenvalues: [],
      summary: `D = ${formatNumber(discriminant)} < 0 なので、実数の固有値はありません。 λ = ${formatNumber(realPart)} ± ${formatNumber(imaginaryPart)}i`,
      complexSummary: `λ = ${formatNumber(realPart)} ± ${formatNumber(imaginaryPart)}i`,
    };
  }

  const root = Math.sqrt(Math.max(discriminant, 0));
  const lambda1 = cleanNumber((trace + root) / 2);
  const lambda2 = cleanNumber((trace - root) / 2);
  const realEigenvalues = Math.abs(lambda1 - lambda2) < EPSILON ? [lambda1] : [lambda1, lambda2];
  const factorized = factorizedPolynomialString(trace, discriminant, realEigenvalues);
  const equation = factorized
    ? `${rawEquation} = ${polynomial} = ${factorized} = 0`
    : `${rawEquation} = ${polynomial} = 0`;
  const summary = realEigenvalues.length === 1
    ? `D = ${formatNumber(discriminant)} なので重解です。 λ = ${formatNumber(realEigenvalues[0])}`
    : `D = ${formatNumber(discriminant)} なので、λ₁ = ${formatNumber(realEigenvalues[0])}, λ₂ = ${formatNumber(realEigenvalues[1])}`;

  return { trace, determinant, discriminant, equation, realEigenvalues, summary };
}

function buildCalculation(matrix) {
  if (elements.sampleMode.value !== "free2") {
    const preset = SAMPLE_PRESETS[elements.sampleMode.value];
    const steps = [
      {
        title: "特性方程式を立てる",
        text: "3 x 3 サンプル行列について、特性方程式を確認します。",
        formula: preset.equation,
        matrix: cloneMatrix(matrix),
        sourceLabel: "det(A - λI)",
      },
      {
        title: "固有値を読む",
        text: preset.summary,
        formula: preset.summary,
        matrix: cloneMatrix(matrix),
        sourceLabel: "固有値",
      },
    ];

    preset.eigenData.forEach((entry, index) => {
      steps.push({
        title: `固有ベクトル v${index + 1} を取る`,
        text: entry.text,
        formula: `λ${index + 1} = ${formatNumber(entry.lambda)}`,
        matrix: matrixMinusLambdaI(matrix, entry.lambda),
        resultVector: entry.vector,
        resultText: `固有ベクトルの一例: v${index + 1} = (${entry.vector.map((value) => formatNumber(value)).join(", ")})`,
        sourceLabel: `λ = ${formatNumber(entry.lambda)}`,
        eigenvalue: entry.lambda,
      });
    });

    if (preset.reason) {
      steps.push({
        title: "固有ベクトルが足りない",
        text: preset.reason,
        formula: preset.reason,
        matrix: cloneMatrix(matrix),
        resultMessage: "独立な固有ベクトル不足",
        resultText: preset.reason,
        sourceLabel: "判定",
      });
    }

    return {
      analysis: {
        equation: preset.equation,
        realEigenvalues: preset.eigenData.map((entry) => entry.lambda),
        summary: preset.summary,
        reason: preset.reason,
      },
      steps,
    };
  }

  const analysis = analyzeMatrix(matrix);
  const steps = [
    {
      title: "特性方程式を立てる",
      text: "det(A - λI) = 0 を作って λ の方程式にします。",
      formula: analysis.equation,
      matrix: cloneMatrix(matrix),
      sourceLabel: "det(A - λI)",
    },
    {
      title: "判別式を調べる",
      text: `D = (${formatNumber(analysis.trace)})² - 4 × ${formatNumber(analysis.determinant)} = ${formatNumber(analysis.discriminant)}`,
      formula: `D = tr(A)² - 4det(A) = ${formatNumber(analysis.discriminant)}`,
      matrix: cloneMatrix(matrix),
      sourceLabel: "D",
    },
  ];

  if (!analysis.realEigenvalues.length) {
    steps.push({
      title: "実数の固有値なし",
      text: "判別式が負なので、実数の固有値と実数固有ベクトルは求まりません。",
      formula: analysis.complexSummary,
      matrix: cloneMatrix(matrix),
      resultMessage: "実数では固有ベクトルなし",
      resultText: "このページでは実数の範囲で扱うため、ここで終了します。",
      sourceLabel: "複素固有値",
    });
    return { analysis, steps };
  }

  analysis.realEigenvalues.forEach((lambda, index) => {
    steps.push({
      title: `固有値 λ${analysis.realEigenvalues.length === 1 ? "" : index + 1} を確定`,
      text: `λ${analysis.realEigenvalues.length === 1 ? "" : index + 1} = ${formatNumber(lambda)} です。`,
      formula: `λ${analysis.realEigenvalues.length === 1 ? "" : index + 1} = ${formatNumber(lambda)}`,
      matrix: cloneMatrix(matrix),
      sourceLabel: `λ${analysis.realEigenvalues.length === 1 ? "" : index + 1}`,
      eigenvalue: lambda,
    });
    steps.push(...solveEigenvector(matrix, lambda).steps);
  });

  return { analysis, steps };
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

function renderEquationSummary(matrix) {
  let analysis;
  if (elements.sampleMode.value === "free2") {
    analysis = analyzeMatrix(matrix);
  } else {
    const preset = SAMPLE_PRESETS[elements.sampleMode.value];
    analysis = {
      equation: preset.equation,
      summary: preset.summary,
      realEigenvalues: preset.eigenData.map((entry) => entry.lambda),
      reason: preset.reason,
    };
  }
  renderMathMatrix(matrix);
  elements.characteristicEquation.textContent = analysis.equation;
  elements.eigenvalueSummary.textContent = analysis.summary;
  return analysis;
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
      elements.methodMatrix.append(cell);
    });
  });
}

function renderPendingResult() {
  elements.resultMatrix.innerHTML = "";
  const size = currentDimension();
  setGrid(elements.resultMatrix, size, 1);
  for (let index = 0; index < size; index += 1) {
    const cell = document.createElement("div");
    cell.className = "cell-output determinant-scalar pending-solution";
    cell.textContent = "?";
    elements.resultMatrix.append(cell);
  }
  elements.resultText.textContent = "再生すると固有ベクトルを表示します。";
  elements.labelR.textContent = "固有ベクトル";
}

function renderResult(step) {
  elements.resultMatrix.innerHTML = "";
  if (step.resultMessage) {
    setGrid(elements.resultMatrix, 1, 1);
    const cell = document.createElement("div");
    cell.className = "cell-output determinant-scalar pending-solution";
    cell.textContent = step.resultMessage;
    elements.resultMatrix.append(cell);
  } else if (step.resultVector) {
    setGrid(elements.resultMatrix, step.resultVector.length, 1);
    step.resultVector.forEach((value) => {
      const cell = document.createElement("div");
      cell.className = "cell-output determinant-scalar";
      cell.textContent = formatNumber(value);
      elements.resultMatrix.append(cell);
    });
  } else {
    renderPendingResult();
    return;
  }
  if (step.eigenvalue !== undefined) elements.labelR.textContent = `λ = ${formatNumber(step.eigenvalue)}`;
  elements.resultText.textContent = step.resultText || "固有ベクトルを表示します。";
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

function updatePreviewMatrix(matrix, analysis) {
  if (analysis.realEigenvalues.length) {
    elements.methodTitle.textContent = "A - λI";
    elements.methodSubtitle.textContent = `まず λ = ${formatNumber(analysis.realEigenvalues[0])}`;
    renderMethodMatrix(matrixMinusLambdaI(matrix, analysis.realEigenvalues[0]));
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

  renderEquationSummary(matrix);
  renderPendingResult();

  calculation.steps.forEach((step, index) => {
    const timerId = window.setTimeout(() => {
      renderMethodMatrix(step.matrix, step);
      renderTrack(step);
      renderResult(step);
      elements.methodTitle.textContent = step.eigenvalue !== undefined ? "A - λI" : "特性方程式";
      elements.methodSubtitle.textContent = step.eigenvalue !== undefined ? `λ = ${formatNumber(step.eigenvalue)}` : "det(A - λI) = 0";
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
  if (elements.sampleMode.value !== "free2") {
    const keys = Object.keys(SAMPLE_PRESETS);
    elements.sampleMode.value = keys[Math.floor(Math.random() * keys.length)];
    applyMode();
    return;
  }
  const patterns = ["real", "repeated", "complex"];
  const target = patterns[Math.floor(Math.random() * patterns.length)];

  for (let attempt = 0; attempt < 240; attempt += 1) {
    const candidate = [
      [randomInteger(), randomInteger()],
      [randomInteger(), randomInteger()],
    ];
    const analysis = analyzeMatrix(candidate);
    const repeated = analysis.realEigenvalues.length === 1;
    const complex = !analysis.realEigenvalues.length;
    const real = analysis.realEigenvalues.length === 2;
    if ((target === "real" && real) || (target === "repeated" && repeated) || (target === "complex" && complex)) {
      setMatrixValues(candidate);
      updateLiveDisplays();
      elements.message.textContent = target === "complex" ? "今回は実数固有値が出ない例を選びました。" : target === "repeated" ? "今回は重解になる例を選びました。" : "";
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
    const analysis = renderEquationSummary(matrix);
    updatePreviewMatrix(matrix, analysis);
    renderPendingResult();
    elements.formulaTitle.textContent = "固有値の公式";
    elements.formula.textContent = "det(A - λI) = 0,  (A - λI)v = 0";
    elements.message.textContent = analysis.reason || (analysis.realEigenvalues.length ? "" : "この行列は実数の固有値を持ちません。");
  } catch (error) {
    elements.message.textContent = error.message;
  }
}

function applyMode() {
  const preset = SAMPLE_PRESETS[elements.sampleMode.value];
  if (elements.sampleMode.value === "free2") {
    createInputGrid(2, [[2, 1], [1, 2]], false);
    elements.sizePill.textContent = "2 x 2";
    elements.dimensionStatus.textContent = "2 x 2";
    elements.matrixSizeLabel.textContent = "2 x 2";
  } else {
    createInputGrid(preset.dimension, preset.matrix, true);
    elements.sizePill.textContent = `${preset.dimension} x ${preset.dimension}`;
    elements.dimensionStatus.textContent = `${preset.dimension} x ${preset.dimension}`;
    elements.matrixSizeLabel.textContent = `${preset.dimension} x ${preset.dimension}`;
  }
  updateLiveDisplays();
}

elements.sampleMode.addEventListener("change", applyMode);
elements.randomize.addEventListener("click", randomizeInputs);
elements.animate.addEventListener("click", animate);

applyMode();
