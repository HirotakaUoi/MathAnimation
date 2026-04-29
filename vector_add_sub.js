const EPSILON = 1e-9;

const elements = {
  dimension: document.querySelector("#dimension"),
  operation: document.querySelector("#operation"),
  viewControls: document.querySelector("#viewControls"),
  rotateX: document.querySelector("#rotateX"),
  rotateY: document.querySelector("#rotateY"),
  rotateZ: document.querySelector("#rotateZ"),
  rotateXValue: document.querySelector("#rotateXValue"),
  rotateYValue: document.querySelector("#rotateYValue"),
  rotateZValue: document.querySelector("#rotateZValue"),
  randomize: document.querySelector("#randomize"),
  animate: document.querySelector("#animate"),
  vectorA: document.querySelector("#vectorA"),
  vectorB: document.querySelector("#vectorB"),
  resultVector: document.querySelector("#resultVector"),
  resultDetail: document.querySelector("#resultDetail"),
  equationDisplay: document.querySelector("#equationDisplay"),
  message: document.querySelector("#message"),
  dimensionStatus: document.querySelector("#dimensionStatus"),
  operationStatus: document.querySelector("#operationStatus"),
  labelA: document.querySelector("#labelA"),
  labelB: document.querySelector("#labelB"),
  resultLabel: document.querySelector("#resultLabel"),
  operatorGlyph: document.querySelector("#operatorGlyph"),
  vectorDiagram: document.querySelector("#vectorDiagram"),
  animationTrack: document.querySelector("#animationTrack"),
  formulaTitle: document.querySelector("#formulaTitle"),
  formula: document.querySelector("#formula"),
  historyList: document.querySelector("#historyList"),
};

const state = {
  dimension: 2,
  operation: "add",
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  resultVisible: false,
  timerIds: [],
};

const PROJECT_3D = {
  zX: -0.78,
  zY: 0.46,
};

function schedulePreviewRefresh(preserveResult = false) {
  window.requestAnimationFrame(() => {
    refreshPreview(preserveResult);
  });
}

function refreshPreview(preserveResult = false) {
  clearAnimation();
  elements.message.textContent = "";
  renderResultVector(Array.from({ length: state.dimension }, () => 0), true);
  try {
    const a = readVector(elements.vectorA, "a");
    const b = readVector(elements.vectorB, "b");
    const result = computeResult(a, b);
    if (preserveResult && state.resultVisible) {
      renderEquationDisplay(a, b, result);
      renderResultVector(result, false);
      elements.resultDetail.textContent = `${shortResultLabel()} = (${result.map((value) => formatNumber(value)).join(", ")})`;
      renderDiagram(a, b, result, "final");
      return;
    }
    state.resultVisible = false;
    elements.equationDisplay.textContent = "";
    elements.resultDetail.textContent = state.operation === "add" ? "対応する成分を足し合わせます。" : "a - b は a + (-b) と考えます。";
    renderDiagram(a, b, result, "base");
  } catch {
    state.resultVisible = false;
    elements.equationDisplay.textContent = "";
    elements.resultDetail.textContent = state.operation === "add" ? "対応する成分を足し合わせます。" : "a - b は a + (-b) と考えます。";
    renderDiagram([0, 0, 0], [0, 0, 0], [0, 0, 0], "base");
  }
}

function formatNumber(value) {
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
    ["input", "change", "keyup", "blur"].forEach((eventName) => {
      input.addEventListener(eventName, schedulePreviewRefresh);
    });
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

function clearTimers() {
  state.timerIds.forEach((timerId) => window.clearTimeout(timerId));
  state.timerIds = [];
}

function clearAnimation() {
  clearTimers();
  elements.animationTrack.innerHTML = "";
  elements.historyList.innerHTML = "";
  document.querySelectorAll(".vector-stage .referenced-a, .vector-stage .referenced-b, .vector-stage .active").forEach((cell) => {
    cell.classList.remove("referenced-a", "referenced-b", "active");
  });
}

function highlightVectorIndex(index) {
  document.querySelectorAll(".vector-stage .referenced-a, .vector-stage .referenced-b, .vector-stage .active").forEach((cell) => {
    cell.classList.remove("referenced-a", "referenced-b", "active");
  });
  elements.vectorA.querySelector(`[data-index="${index}"]`)?.classList.add("referenced-a");
  elements.vectorB.querySelector(`[data-index="${index}"]`)?.classList.add("referenced-b");
  elements.resultVector.querySelector(`[data-index="${index}"]`)?.classList.add("active");
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

function renderTrack(parts) {
  elements.animationTrack.innerHTML = "";
  parts.forEach((part) => {
    const cell = document.createElement("div");
    cell.className = `flow-cell ${part.className || ""}`.trim();
    cell.textContent = part.text;
    elements.animationTrack.append(cell);
  });
}

function renderResultVector(vector, pending = false) {
  elements.resultVector.innerHTML = "";
  setVectorGrid(elements.resultVector, vector.length);
  vector.forEach((value, index) => {
    const cell = document.createElement("div");
    cell.className = "cell-output vector-output-cell";
    cell.dataset.index = index;
    cell.textContent = pending ? "?" : formatNumber(value);
    elements.resultVector.append(cell);
  });
}

function operationSymbol() {
  return state.operation === "add" ? "+" : "-";
}

function resultLabel() {
  return state.operation === "add" ? "ベクトル a + b" : "ベクトル a - b";
}

function shortResultLabel() {
  return state.operation === "add" ? "a + b" : "a - b";
}

function vectorMarkup(symbol) {
  return `<span class="vector-arrowed"><span class="vector-variable">${symbol}</span></span>`;
}

function resultLabelMarkup() {
  return `${vectorMarkup("a")}<span class="vector-expression-operator">${operationSymbol()}</span>${vectorMarkup("b")}`;
}

function computeResult(a, b) {
  return a.map((value, index) => state.operation === "add" ? value + b[index] : value - b[index]);
}

function renderEquationDisplay(a, b, result) {
  const sign = operationSymbol();
  const expression = result.map((value, index) => `(${formatNumber(a[index])} ${sign} ${formatNumber(b[index])}) = ${formatNumber(value)}`);
  elements.equationDisplay.textContent = `${shortResultLabel()} = [ ${expression.join(", ")} ]`;
}

function rotateVector3D(vector) {
  let [x, y, z] = vector;
  const rx = (state.rotateX * Math.PI) / 180;
  const ry = (state.rotateY * Math.PI) / 180;
  const rz = (state.rotateZ * Math.PI) / 180;

  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  let nextY = y * cosX - z * sinX;
  let nextZ = y * sinX + z * cosX;
  y = nextY;
  z = nextZ;

  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);
  let nextX = x * cosY + z * sinY;
  nextZ = -x * sinY + z * cosY;
  x = nextX;
  z = nextZ;

  const cosZ = Math.cos(rz);
  const sinZ = Math.sin(rz);
  nextX = x * cosZ - y * sinZ;
  nextY = x * sinZ + y * cosZ;
  x = nextX;
  y = nextY;

  return { x, y, z };
}

function projectPoint(vector) {
  if (state.dimension === 2) {
    return { x: vector[0], y: vector[1] };
  }
  const rotated = rotateVector3D(vector);
  return {
    x: rotated.x + rotated.z * PROJECT_3D.zX,
    y: rotated.y + rotated.z * PROJECT_3D.zY,
  };
}

function drawArrow(svg, from, to, className, label) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", from.x);
  line.setAttribute("y1", from.y);
  line.setAttribute("x2", to.x);
  line.setAttribute("y2", to.y);
  line.setAttribute("class", `diagram-line ${className}`);
  svg.append(line);

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;
  const size = 9;
  const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  arrow.setAttribute(
    "points",
    `${to.x},${to.y} ${to.x - ux * size - px * 4},${to.y - uy * size - py * 4} ${to.x - ux * size + px * 4},${to.y - uy * size + py * 4}`,
  );
  arrow.setAttribute("class", `diagram-arrow ${className}`);
  svg.append(arrow);

  if (label) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", `diagram-label-group ${className}`);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("class", `diagram-label ${className}`);
    text.textContent = label;
    group.append(text);
    svg.append(group);

    const paddingX = 8;
    const paddingY = 5;
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("rx", "8");
    rect.setAttribute("class", `diagram-label-box ${className}`);
    group.insertBefore(rect, text);

    const isResultLabel = className.includes("diagram-result");
    const candidates = isResultLabel
      ? [
          { along: 0.62, normal: 34, forward: 10 },
          { along: 0.72, normal: 34, forward: 12 },
          { along: 0.52, normal: 46, forward: 8 },
          { along: 0.72, normal: -34, forward: 12 },
          { along: 0.52, normal: -46, forward: 8 },
          { along: 0.82, normal: 52, forward: 10 },
          { along: 0.82, normal: -52, forward: 10 },
        ]
      : [
          { along: 0.5, normal: 18, forward: 0 },
          { along: 0.5, normal: -18, forward: 0 },
        ];

    const endpointMargin = isResultLabel ? 18 : 10;

    function updateLabelPosition(candidate) {
      const labelX = from.x + dx * candidate.along + px * candidate.normal + ux * candidate.forward;
      const labelY = from.y + dy * candidate.along + py * candidate.normal + uy * candidate.forward;
      text.setAttribute("x", String(labelX));
      text.setAttribute("y", String(labelY));
      const box = text.getBBox();
      rect.setAttribute("x", String(box.x - paddingX));
      rect.setAttribute("y", String(box.y - paddingY));
      rect.setAttribute("width", String(box.width + paddingX * 2));
      rect.setAttribute("height", String(box.height + paddingY * 2));
      return {
        x: box.x - paddingX,
        y: box.y - paddingY,
        width: box.width + paddingX * 2,
        height: box.height + paddingY * 2,
      };
    }

    function pointOverlapsBox(point, box, margin) {
      return (
        point.x >= box.x - margin &&
        point.x <= box.x + box.width + margin &&
        point.y >= box.y - margin &&
        point.y <= box.y + box.height + margin
      );
    }

    let fallbackBox = null;
    for (const candidate of candidates) {
      const box = updateLabelPosition(candidate);
      fallbackBox = box;
      const overlapsStart = pointOverlapsBox(from, box, endpointMargin);
      const overlapsEnd = pointOverlapsBox(to, box, endpointMargin);
      if (!overlapsStart && !overlapsEnd) {
        fallbackBox = null;
        break;
      }
    }

    if (fallbackBox) {
      rect.setAttribute("x", String(fallbackBox.x));
      rect.setAttribute("y", String(fallbackBox.y));
      rect.setAttribute("width", String(fallbackBox.width));
      rect.setAttribute("height", String(fallbackBox.height));
    }
  }
}

function appendDiagramLine(svg, x1, y1, x2, y2, className) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", String(x1));
  line.setAttribute("y1", String(y1));
  line.setAttribute("x2", String(x2));
  line.setAttribute("y2", String(y2));
  line.setAttribute("class", className);
  svg.append(line);
}

function appendDiagramText(svg, x, y, textContent, className) {
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", String(x));
  text.setAttribute("y", String(y));
  text.setAttribute("class", className);
  text.textContent = textContent;
  svg.append(text);
}

function computeDiagramScale(center, width, height, points) {
  const marginX = 86;
  const marginTop = 42;
  const marginBottom = 58;
  const maxProjectedX = Math.max(1, ...points.map((point) => Math.abs(point.x)));
  const positiveProjectedY = Math.max(1, ...points.map((point) => Math.max(0, point.y)));
  const negativeProjectedY = Math.max(1, ...points.map((point) => Math.max(0, -point.y)));
  const availableRight = Math.max(80, width - center.x - marginX);
  const availableLeft = Math.max(80, center.x - marginX);
  const availableTop = Math.max(64, center.y - marginTop);
  const availableBottom = Math.max(64, height - center.y - marginBottom);
  const scaleX = Math.min(availableRight, availableLeft) / maxProjectedX;
  const scaleY = Math.min(availableTop / positiveProjectedY, availableBottom / negativeProjectedY);
  return Math.max(14, Math.min(state.dimension === 2 ? 30 : 26, scaleX, scaleY));
}

function drawAxisTicks(svg, center, width, height, scale) {
  if (state.dimension === 3) {
    draw3DAxisGuides(svg, center, scale);
    return;
  }
  const tickHalf = 6;
  const labelOffset = 18;
  const maxX = Math.floor(Math.min(center.x, width - center.x) / scale);
  const maxY = Math.floor(Math.min(center.y, height - center.y) / scale);
  const tickStep = 5;
  const startX = Math.ceil(-maxX / tickStep) * tickStep;
  const endX = Math.floor(maxX / tickStep) * tickStep;
  const startY = Math.ceil(-maxY / tickStep) * tickStep;
  const endY = Math.floor(maxY / tickStep) * tickStep;

  appendDiagramText(svg, center.x + 14, center.y + 16, "0", "diagram-axis-label origin-label");

  for (let unit = startX; unit <= endX; unit += tickStep) {
    if (unit === 0) continue;
    const x = center.x + unit * scale;
    appendDiagramLine(svg, x, center.y - tickHalf, x, center.y + tickHalf, "diagram-tick");
    appendDiagramText(svg, x, center.y + labelOffset, String(unit), "diagram-axis-label x-label");
  }

  for (let unit = startY; unit <= endY; unit += tickStep) {
    if (unit === 0) continue;
    const y = center.y - unit * scale;
    appendDiagramLine(svg, center.x - tickHalf, y, center.x + tickHalf, y, "diagram-tick");
    appendDiagramText(svg, center.x + labelOffset, y + 4, String(unit), "diagram-axis-label y-label");
  }
}

function draw3DAxisGuides(svg, center, scale) {
  const axisUnits = 10;
  const tickUnits = 5;
  const tickHalf = 5;
  const xEnd = projectPoint([axisUnits, 0, 0]);
  const yEnd = projectPoint([0, axisUnits, 0]);
  const zEnd = projectPoint([0, 0, axisUnits]);
  appendDiagramText(svg, center.x + xEnd.x * scale + 12, center.y - xEnd.y * scale + 4, "x", "diagram-axis-name");
  appendDiagramText(svg, center.x + yEnd.x * scale + 8, center.y - yEnd.y * scale - 12, "y", "diagram-axis-name");
  appendDiagramText(svg, center.x + zEnd.x * scale - 12, center.y - zEnd.y * scale - 8, "z", "diagram-axis-name");
  appendDiagramText(svg, center.x + 14, center.y + 16, "0", "diagram-axis-label origin-label");

  const xTick = projectPoint([tickUnits, 0, 0]);
  appendDiagramLine(
    svg,
    center.x + xTick.x * scale,
    center.y - xTick.y * scale - tickHalf,
    center.x + xTick.x * scale,
    center.y - xTick.y * scale + tickHalf,
    "diagram-tick",
  );
  appendDiagramText(svg, center.x + xTick.x * scale, center.y - xTick.y * scale + 18, "5", "diagram-axis-label x-label");

  const yTick = projectPoint([0, tickUnits, 0]);
  appendDiagramLine(
    svg,
    center.x + yTick.x * scale - tickHalf,
    center.y - yTick.y * scale,
    center.x + yTick.x * scale + tickHalf,
    center.y - yTick.y * scale,
    "diagram-tick",
  );
  appendDiagramText(svg, center.x + yTick.x * scale + 16, center.y - yTick.y * scale, "5", "diagram-axis-label y-label");

  const zTick = projectPoint([0, 0, tickUnits]);
  appendDiagramLine(
    svg,
    center.x + zTick.x * scale - tickHalf,
    center.y - zTick.y * scale - tickHalf,
    center.x + zTick.x * scale + tickHalf,
    center.y - zTick.y * scale + tickHalf,
    "diagram-tick",
  );
  appendDiagramText(svg, center.x + zTick.x * scale - 28, center.y - zTick.y * scale - 22, "5", "diagram-axis-label z-label");
}

function drawCoordinateGrid(svg, center, width, height, scale) {
  const gridStep = 2;
  if (state.dimension === 3) {
    const planeUnits = 12;
    for (let unit = -planeUnits; unit <= planeUnits; unit += gridStep) {
      const startX = projectPoint([unit, -planeUnits, 0]);
      const endX = projectPoint([unit, planeUnits, 0]);
      appendDiagramLine(
        svg,
        center.x + startX.x * scale,
        center.y - startX.y * scale,
        center.x + endX.x * scale,
        center.y - endX.y * scale,
        "diagram-grid",
      );
      const startY = projectPoint([-planeUnits, unit, 0]);
      const endY = projectPoint([planeUnits, unit, 0]);
      appendDiagramLine(
        svg,
        center.x + startY.x * scale,
        center.y - startY.y * scale,
        center.x + endY.x * scale,
        center.y - endY.y * scale,
        "diagram-grid",
      );
    }
    return;
  }

  const spacing = scale * gridStep;
  if (spacing < 8) return;

  for (let x = center.x + spacing; x <= width; x += spacing) {
    appendDiagramLine(svg, x, 0, x, height, "diagram-grid");
  }
  for (let x = center.x - spacing; x >= 0; x -= spacing) {
    appendDiagramLine(svg, x, 0, x, height, "diagram-grid");
  }
  for (let y = center.y + spacing; y <= height; y += spacing) {
    appendDiagramLine(svg, 0, y, width, y, "diagram-grid");
  }
  for (let y = center.y - spacing; y >= 0; y -= spacing) {
    appendDiagramLine(svg, 0, y, width, y, "diagram-grid");
  }
}

function renderDiagram(a, b, result, phase = "final") {
  const svg = elements.vectorDiagram;
  svg.innerHTML = "";
  const width = 720;
  const height = 360;
  const center = { x: width / 2, y: height / 2 };
  const baseB = state.operation === "add" ? b : b.map((value) => -value);
  const aPoint = projectPoint(a);
  const bPoint = projectPoint(baseB);
  const resultPoint = projectPoint(result);
  const translatedBPoint = { x: aPoint.x + bPoint.x, y: aPoint.y + bPoint.y };
  const scale = computeDiagramScale(center, width, height, [aPoint, bPoint, resultPoint, translatedBPoint]);
  drawCoordinateGrid(svg, center, width, height, scale);

  if (state.dimension === 3) {
    const origin = { x: center.x, y: center.y };
    const xAxisEnd = projectPoint([10, 0, 0]);
    const xAxisNegativeEnd = projectPoint([-10, 0, 0]);
    const yAxisEnd = projectPoint([0, 10, 0]);
    const yAxisNegativeEnd = projectPoint([0, -10, 0]);
    const zAxisEnd = projectPoint([0, 0, 10]);
    const zAxisNegativeEnd = projectPoint([0, 0, -10]);
    appendDiagramLine(svg, origin.x, origin.y, origin.x + xAxisNegativeEnd.x * scale, origin.y - xAxisNegativeEnd.y * scale, "diagram-axis-negative");
    appendDiagramLine(svg, origin.x, origin.y, origin.x + yAxisNegativeEnd.x * scale, origin.y - yAxisNegativeEnd.y * scale, "diagram-axis-negative");
    appendDiagramLine(svg, origin.x, origin.y, origin.x + zAxisNegativeEnd.x * scale, origin.y - zAxisNegativeEnd.y * scale, "diagram-axis-negative");
    appendDiagramLine(svg, origin.x, origin.y, origin.x + xAxisEnd.x * scale, origin.y - xAxisEnd.y * scale, "diagram-axis");
    appendDiagramLine(svg, origin.x, origin.y, origin.x + yAxisEnd.x * scale, origin.y - yAxisEnd.y * scale, "diagram-axis");
    appendDiagramLine(svg, origin.x, origin.y, origin.x + zAxisEnd.x * scale, origin.y - zAxisEnd.y * scale, "diagram-axis");
  } else {
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", "0");
    xAxis.setAttribute("y1", String(center.y));
    xAxis.setAttribute("x2", String(width));
    xAxis.setAttribute("y2", String(center.y));
    xAxis.setAttribute("class", "diagram-axis");
    svg.append(xAxis);

    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute("x1", String(center.x));
    yAxis.setAttribute("y1", "0");
    yAxis.setAttribute("x2", String(center.x));
    yAxis.setAttribute("y2", String(height));
    yAxis.setAttribute("class", "diagram-axis");
    svg.append(yAxis);
  }

  drawAxisTicks(svg, center, width, height, scale);

  const origin = { x: center.x, y: center.y };
  const aEnd = { x: origin.x + aPoint.x * scale, y: origin.y - aPoint.y * scale };
  const bEnd = { x: origin.x + bPoint.x * scale, y: origin.y - bPoint.y * scale };
  const resultEnd = { x: origin.x + resultPoint.x * scale, y: origin.y - resultPoint.y * scale };
  const bLabel = state.operation === "add" ? "b" : "-b";

  drawArrow(svg, origin, aEnd, "diagram-a", "a");
  if (phase === "base") {
    drawArrow(svg, origin, bEnd, "diagram-b", bLabel);
    return;
  }

  if (phase === "translate" || phase === "final") {
    const translatedStart = aEnd;
    const translatedEnd = { x: translatedStart.x + bPoint.x * scale, y: translatedStart.y - bPoint.y * scale };
    drawArrow(svg, origin, bEnd, "diagram-b-faded", bLabel);
    drawArrow(svg, translatedStart, translatedEnd, "diagram-b", bLabel);
    if (phase === "translate") return;
  }

  drawArrow(svg, origin, resultEnd, "diagram-result", shortResultLabel());
}

function syncLayout() {
  clearAnimation();
  state.resultVisible = false;
  state.dimension = Number.parseInt(elements.dimension.value, 10) || 2;
  state.operation = elements.operation.value;
  state.rotateX = Number.parseInt(elements.rotateX.value, 10) || 0;
  state.rotateY = Number.parseInt(elements.rotateY.value, 10) || 0;
  state.rotateZ = Number.parseInt(elements.rotateZ.value, 10) || 0;
  createVectorInputs(elements.vectorA, state.dimension, "a");
  createVectorInputs(elements.vectorB, state.dimension, "b");
  elements.labelA.textContent = `${state.dimension} 要素`;
  elements.labelB.textContent = `${state.dimension} 要素`;
  elements.dimensionStatus.textContent = `${state.dimension} 次元`;
  elements.operationStatus.textContent = shortResultLabel();
  elements.resultLabel.innerHTML = `<span class="vector-heading-prefix">ベクトル</span>${resultLabelMarkup()}`;
  elements.operatorGlyph.textContent = operationSymbol();
  elements.viewControls.hidden = state.dimension !== 3;
  elements.rotateXValue.textContent = `${state.rotateX}°`;
  elements.rotateYValue.textContent = `${state.rotateY}°`;
  elements.rotateZValue.textContent = `${state.rotateZ}°`;
  renderResultVector(Array.from({ length: state.dimension }, () => 0), true);
  elements.resultDetail.textContent = state.operation === "add" ? "対応する成分を足し合わせます。" : "a - b は a + (-b) と考えます。";
  elements.formulaTitle.textContent = "ベクトルの加減算";
  elements.formula.textContent = state.operation === "add" ? "図では、2本目のベクトルを平行移動して先端をつなぎます。" : "減算では b を反対向きにした -b を足します。";
  refreshPreview();
}

function randomizeVectors() {
  state.resultVisible = false;
  [elements.vectorA, elements.vectorB].forEach((container) => {
    container.querySelectorAll("input").forEach((input) => {
      input.value = randomComponent();
    });
  });
  refreshPreview();
}

function animateCalculation() {
  clearAnimation();
  state.resultVisible = false;
  elements.message.textContent = "";

  let a;
  let b;
  try {
    a = readVector(elements.vectorA, "a");
    b = readVector(elements.vectorB, "b");
  } catch (error) {
    elements.message.textContent = error.message;
    return;
  }

  const result = computeResult(a, b);
  renderEquationDisplay(a, b, result);
  renderResultVector(result, true);
  renderDiagram(a, b, result, "base");

  const steps = a.map((value, index) => ({
    title: `${index + 1} 成分目`,
    text: `${formatNumber(value)} ${operationSymbol()} ${formatNumber(b[index])} = ${formatNumber(result[index])}`,
    index,
  }));

  const diagramSteps = [
    {
      title: "ベクトル a",
      text: "まず原点からベクトル a を描きます。",
      phase: "base",
    },
    {
      title: state.operation === "add" ? "ベクトル b の平行移動" : "ベクトル -b の平行移動",
      text: state.operation === "add" ? "次に b を a の先端へ平行移動します。" : "減算なので b を反対向きにした -b を a の先端へ平行移動します。",
      phase: "translate",
    },
    {
      title: "結果ベクトル",
      text: `${shortResultLabel()} は原点から終点までのベクトルです。`,
      phase: "final",
      final: true,
    },
  ];

  let offset = 0;
  steps.forEach((step, order) => {
    const timerId = window.setTimeout(() => {
      highlightVectorIndex(step.index);
      renderTrack([
        { text: `a${step.index + 1}: ${formatNumber(a[step.index])}`, className: "source-a" },
        { text: operationSymbol(), className: "operator" },
        { text: `b${step.index + 1}: ${formatNumber(b[step.index])}`, className: "source-b" },
        { text: "=", className: "operator" },
        { text: formatNumber(result[step.index]), className: "result" },
      ]);
      elements.formulaTitle.textContent = step.title;
      elements.formula.textContent = step.text;
      appendHistory(step);
      const resultCell = elements.resultVector.querySelector(`[data-index="${step.index}"]`);
      if (resultCell) {
        resultCell.textContent = formatNumber(result[step.index]);
        resultCell.classList.add("active");
      }
    }, order * 800);
    state.timerIds.push(timerId);
    offset = (order + 1) * 800;
  });

  diagramSteps.forEach((step, order) => {
    const timerId = window.setTimeout(() => {
      renderDiagram(a, b, result, step.phase);
      renderTrack([
        { text: "図解", className: "source-a" },
        { text: "→", className: "operator" },
        { text: step.title, className: "result" },
      ]);
      elements.formulaTitle.textContent = step.title;
      elements.formula.textContent = step.text;
      appendHistory(step);
      if (step.final) {
        state.resultVisible = true;
        renderResultVector(result, false);
        elements.resultDetail.textContent = `${shortResultLabel()} = (${result.map((value) => formatNumber(value)).join(", ")})`;
      }
    }, offset + order * 950 + 200);
    state.timerIds.push(timerId);
  });
}

elements.dimension.addEventListener("change", syncLayout);
elements.operation.addEventListener("change", syncLayout);
["input", "change"].forEach((eventName) => {
  elements.rotateX.addEventListener(eventName, () => {
    state.rotateX = Number.parseInt(elements.rotateX.value, 10) || 0;
    elements.rotateXValue.textContent = `${state.rotateX}°`;
    schedulePreviewRefresh(true);
  });
  elements.rotateY.addEventListener(eventName, () => {
    state.rotateY = Number.parseInt(elements.rotateY.value, 10) || 0;
    elements.rotateYValue.textContent = `${state.rotateY}°`;
    schedulePreviewRefresh(true);
  });
  elements.rotateZ.addEventListener(eventName, () => {
    state.rotateZ = Number.parseInt(elements.rotateZ.value, 10) || 0;
    elements.rotateZValue.textContent = `${state.rotateZ}°`;
    schedulePreviewRefresh(true);
  });
});
["input", "change", "keyup", "blur"].forEach((eventName) => {
  elements.vectorA.addEventListener(eventName, () => schedulePreviewRefresh(false));
  elements.vectorB.addEventListener(eventName, () => schedulePreviewRefresh(false));
});
document.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (!target.closest("#vectorA, #vectorB")) return;
  schedulePreviewRefresh(false);
});
elements.randomize.addEventListener("click", () => {
  randomizeVectors();
  animateCalculation();
});
elements.animate.addEventListener("click", animateCalculation);

syncLayout();
