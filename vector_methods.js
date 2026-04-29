const EPSILON = 1e-9;
const vectorPageType = location.pathname.includes("vector_angle") ? "angle" : "dot";

const vectorElements = {
  dimension: document.querySelector("#dimension"),
  randomize: document.querySelector("#randomize"),
  animate: document.querySelector("#animate"),
  vectorA: document.querySelector("#vectorA"),
  vectorB: document.querySelector("#vectorB"),
  resultValue: document.querySelector("#resultValue"),
  resultDetail: document.querySelector("#resultDetail"),
  equationDisplay: document.querySelector("#equationDisplay"),
  message: document.querySelector("#message"),
  dimensionStatus: document.querySelector("#dimensionStatus"),
  labelA: document.querySelector("#labelA"),
  labelB: document.querySelector("#labelB"),
  animationTrack: document.querySelector("#animationTrack"),
  formulaTitle: document.querySelector("#formulaTitle"),
  formula: document.querySelector("#formula"),
  historyList: document.querySelector("#historyList"),
};

const vectorState = {
  dimension: 2,
  timerIds: [],
};

function vectorFormatNumber(value) {
  if (!Number.isFinite(value)) return "NaN";
  const rounded = Math.abs(value) < EPSILON ? 0 : value;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
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

function randomComponent() {
  const value = Math.floor(Math.random() * 11) - 5;
  return value === 0 ? 1 : value;
}

function setVectorGrid(element, dimension) {
  element.style.gridTemplateColumns = `repeat(${dimension}, minmax(88px, 1fr))`;
}

function readRawVector(container) {
  return Array.from(container.querySelectorAll("input")).map((input) => input.value || "0");
}

function createVectorInputs(container, dimension, prefix) {
  const previous = readRawVector(container);
  container.innerHTML = "";
  setVectorGrid(container, dimension);
  for (let index = 0; index < dimension; index += 1) {
    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "decimal";
    input.spellcheck = false;
    input.className = "cell-input vector-cell";
    input.value = previous[index] ?? randomComponent();
    input.dataset.index = index;
    input.ariaLabel = `${prefix}${index + 1}`;
    container.append(input);
  }
}

function readVector(container, label) {
  const values = [];
  const cells = Array.from(container.querySelectorAll("input"));
  for (let index = 0; index < cells.length; index += 1) {
    const cell = cells[index];
    try {
      values.push(parseExpressionValue(cell.value));
      cell.classList.remove("invalid");
    } catch (error) {
      cell.classList.add("invalid");
      throw new Error(`${label}${index + 1}: ${error.message}`);
    }
  }
  return values;
}

function dotProduct(a, b) {
  return a.reduce((sum, value, index) => sum + value * b[index], 0);
}

function magnitude(vector) {
  return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
}

function clearVectorTimers() {
  vectorState.timerIds.forEach((timerId) => window.clearTimeout(timerId));
  vectorState.timerIds = [];
}

function clearVectorAnimation() {
  clearVectorTimers();
  vectorElements.animationTrack.innerHTML = "";
  vectorElements.historyList.innerHTML = "";
  document.querySelectorAll(".vector-stage .referenced-a, .vector-stage .referenced-b").forEach((cell) => {
    cell.classList.remove("referenced-a", "referenced-b");
  });
}

function highlightVectorIndex(index) {
  document.querySelectorAll(".vector-stage .referenced-a, .vector-stage .referenced-b").forEach((cell) => {
    cell.classList.remove("referenced-a", "referenced-b");
  });
  vectorElements.vectorA.querySelector(`[data-index="${index}"]`)?.classList.add("referenced-a");
  vectorElements.vectorB.querySelector(`[data-index="${index}"]`)?.classList.add("referenced-b");
}

function appendHistory(step) {
  const item = document.createElement("li");
  const title = document.createElement("strong");
  const detail = document.createElement("span");
  title.textContent = step.title;
  detail.textContent = step.text;
  item.append(title, detail);
  vectorElements.historyList.append(item);
  vectorElements.historyList.scrollTop = vectorElements.historyList.scrollHeight;
}

function renderTrack(parts) {
  vectorElements.animationTrack.innerHTML = "";
  parts.forEach((part) => {
    const cell = document.createElement("div");
    cell.className = `flow-cell ${part.className || ""}`.trim();
    cell.textContent = part.text;
    vectorElements.animationTrack.append(cell);
  });
}

function renderEquationDisplay(a, b, mode) {
  if (mode === "dot") {
    const terms = a.map((value, index) => `${vectorFormatNumber(value)} x ${vectorFormatNumber(b[index])}`);
    vectorElements.equationDisplay.textContent = `a · b = ${terms.join(" + ")}`;
    return;
  }
  const terms = a.map((value, index) => `${vectorFormatNumber(value)} x ${vectorFormatNumber(b[index])}`);
  const magA = `|a| = sqrt(${a.map((value) => `${vectorFormatNumber(value)}^2`).join(" + ")})`;
  const magB = `|b| = sqrt(${b.map((value) => `${vectorFormatNumber(value)}^2`).join(" + ")})`;
  vectorElements.equationDisplay.textContent = `${terms.join(" + ")} , ${magA} , ${magB}`;
}

function syncVectorLayout() {
  clearVectorAnimation();
  vectorState.dimension = Number.parseInt(vectorElements.dimension.value, 10) || 2;
  vectorElements.dimension.value = String(vectorState.dimension);
  createVectorInputs(vectorElements.vectorA, vectorState.dimension, "a");
  createVectorInputs(vectorElements.vectorB, vectorState.dimension, "b");
  vectorElements.labelA.textContent = `${vectorState.dimension} 要素`;
  vectorElements.labelB.textContent = `${vectorState.dimension} 要素`;
  vectorElements.dimensionStatus.textContent = `${vectorState.dimension} 次元`;
  vectorElements.resultValue.textContent = "?";
  vectorElements.resultDetail.textContent = vectorPageType === "dot" ? "各成分の積の和として求めます。" : "cos θ = (a · b) / (|a||b|) を使います。";
  vectorElements.formulaTitle.textContent = vectorPageType === "dot" ? "内積" : "なす角";
  vectorElements.formula.textContent = vectorPageType === "dot" ? "対応する成分を掛けて、その和をとります。" : "まず内積を求め、その後 |a| と |b| で割って cos θ を作り、最後に arccos をとります。";
}

function randomizeVectors() {
  [vectorElements.vectorA, vectorElements.vectorB].forEach((container) => {
    container.querySelectorAll("input").forEach((input) => {
      input.value = randomComponent();
    });
  });
}

function animateDot() {
  clearVectorAnimation();
  vectorElements.message.textContent = "";
  let a;
  let b;
  try {
    a = readVector(vectorElements.vectorA, "a");
    b = readVector(vectorElements.vectorB, "b");
  } catch (error) {
    vectorElements.message.textContent = error.message;
    return;
  }

  renderEquationDisplay(a, b, "dot");
  const steps = a.map((value, index) => ({
    title: `${index + 1} 成分目`,
    text: `${vectorFormatNumber(value)} x ${vectorFormatNumber(b[index])} = ${vectorFormatNumber(value * b[index])}`,
    index,
  }));
  const dot = dotProduct(a, b);
  steps.push({
    title: "内積の合計",
    text: `${a.map((value, index) => `${vectorFormatNumber(value * b[index])}`).join(" + ")} = ${vectorFormatNumber(dot)}`,
    final: true,
  });

  steps.forEach((step, order) => {
    const timerId = window.setTimeout(() => {
      if (step.index !== undefined) highlightVectorIndex(step.index);
      renderTrack(step.final
        ? [
            { text: "全成分", className: "source-a" },
            { text: "+", className: "operator" },
            { text: vectorFormatNumber(dot), className: "result" },
          ]
        : [
            { text: `a${step.index + 1}: ${vectorFormatNumber(a[step.index])}`, className: "source-a" },
            { text: "x", className: "operator" },
            { text: `b${step.index + 1}: ${vectorFormatNumber(b[step.index])}`, className: "source-b" },
            { text: "=", className: "operator" },
            { text: vectorFormatNumber(a[step.index] * b[step.index]), className: "result" },
          ]);
      vectorElements.formulaTitle.textContent = step.title;
      vectorElements.formula.textContent = step.text;
      appendHistory(step);
      if (step.final) {
        vectorElements.resultValue.textContent = vectorFormatNumber(dot);
        vectorElements.resultDetail.textContent = step.text;
      }
    }, order * 900);
    vectorState.timerIds.push(timerId);
  });
}

function animateAngle() {
  clearVectorAnimation();
  vectorElements.message.textContent = "";
  let a;
  let b;
  try {
    a = readVector(vectorElements.vectorA, "a");
    b = readVector(vectorElements.vectorB, "b");
  } catch (error) {
    vectorElements.message.textContent = error.message;
    return;
  }

  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA < EPSILON || magB < EPSILON) {
    vectorElements.message.textContent = "零ベクトルとのなす角は定義できません。";
    return;
  }

  renderEquationDisplay(a, b, "angle");
  const dot = dotProduct(a, b);
  const cosTheta = Math.max(-1, Math.min(1, dot / (magA * magB)));
  const theta = (Math.acos(cosTheta) * 180) / Math.PI;
  const steps = [
    {
      title: "内積",
      text: `a · b = ${a.map((value, index) => `${vectorFormatNumber(value)} x ${vectorFormatNumber(b[index])}`).join(" + ")} = ${vectorFormatNumber(dot)}`,
      track: [
        { text: "a · b", className: "source-a" },
        { text: "=", className: "operator" },
        { text: vectorFormatNumber(dot), className: "result" },
      ],
    },
    {
      title: "|a|",
      text: `|a| = sqrt(${a.map((value) => `${vectorFormatNumber(value)}^2`).join(" + ")}) = ${vectorFormatNumber(magA)}`,
      track: [
        { text: "|a|", className: "source-a" },
        { text: "=", className: "operator" },
        { text: vectorFormatNumber(magA), className: "result" },
      ],
    },
    {
      title: "|b|",
      text: `|b| = sqrt(${b.map((value) => `${vectorFormatNumber(value)}^2`).join(" + ")}) = ${vectorFormatNumber(magB)}`,
      track: [
        { text: "|b|", className: "source-b" },
        { text: "=", className: "operator" },
        { text: vectorFormatNumber(magB), className: "result" },
      ],
    },
    {
      title: "cos θ",
      text: `cos θ = ${vectorFormatNumber(dot)} / (${vectorFormatNumber(magA)} x ${vectorFormatNumber(magB)}) = ${vectorFormatNumber(cosTheta)}`,
      track: [
        { text: "cos θ", className: "source-a" },
        { text: "=", className: "operator" },
        { text: vectorFormatNumber(cosTheta), className: "result" },
      ],
    },
    {
      title: "θ",
      text: `θ = arccos(${vectorFormatNumber(cosTheta)}) = ${vectorFormatNumber(theta)}°`,
      track: [
        { text: "θ", className: "source-a" },
        { text: "=", className: "operator" },
        { text: `${vectorFormatNumber(theta)}°`, className: "result" },
      ],
      final: true,
    },
  ];

  steps.forEach((step, order) => {
    const timerId = window.setTimeout(() => {
      if (order < vectorState.dimension) highlightVectorIndex(Math.min(order, vectorState.dimension - 1));
      renderTrack(step.track);
      vectorElements.formulaTitle.textContent = step.title;
      vectorElements.formula.textContent = step.text;
      appendHistory(step);
      if (step.final) {
        vectorElements.resultValue.textContent = `${vectorFormatNumber(theta)}°`;
        vectorElements.resultDetail.textContent = `cos θ = ${vectorFormatNumber(cosTheta)}`;
      }
    }, order * 1000);
    vectorState.timerIds.push(timerId);
  });
}

vectorElements.dimension.addEventListener("change", syncVectorLayout);
vectorElements.randomize.addEventListener("click", () => {
  randomizeVectors();
  if (vectorPageType === "dot") animateDot();
  else animateAngle();
});
vectorElements.animate.addEventListener("click", () => {
  if (vectorPageType === "dot") animateDot();
  else animateAngle();
});

syncVectorLayout();
