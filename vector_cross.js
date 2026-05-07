const EPSILON = 1e-9;

const crossElements = {
  dimension: document.querySelector("#dimension"),
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
  resultValue: document.querySelector("#resultValue"),
  resultDetail: document.querySelector("#resultDetail"),
  resultKind: document.querySelector("#resultKind"),
  equationDisplay: document.querySelector("#equationDisplay"),
  message: document.querySelector("#message"),
  dimensionStatus: document.querySelector("#dimensionStatus"),
  labelA: document.querySelector("#labelA"),
  labelB: document.querySelector("#labelB"),
  animationTrack: document.querySelector("#animationTrack"),
  formulaTitle: document.querySelector("#formulaTitle"),
  formula: document.querySelector("#formula"),
  historyList: document.querySelector("#historyList"),
  vectorDiagram: document.querySelector("#vectorDiagram"),
};

const crossState = {
  dimension: 2,
  timerIds: [],
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  resultVisible: false,
};

const PROJECT_3D = {
  zX: -0.78,
  zY: 0.46,
};

function crossFormula() {
  return crossState.dimension === 2
    ? "a × b = a1b2 - a2b1"
    : "a × b = (a2b3 - a3b2, a3b1 - a1b3, a1b2 - a2b1)";
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

function clearAnimation() {
  crossState.timerIds.forEach((id) => window.clearTimeout(id));
  crossState.timerIds = [];
  crossElements.animationTrack.innerHTML = "";
  crossElements.historyList.innerHTML = "";
  crossElements.vectorA.querySelectorAll(".referenced-a").forEach((cell) => cell.classList.remove("referenced-a"));
  crossElements.vectorB.querySelectorAll(".referenced-b").forEach((cell) => cell.classList.remove("referenced-b"));
}

function appendHistory(step) {
  const item = document.createElement("li");
  item.className = "history-item";
  item.innerHTML = `<strong>${step.title}</strong><span>${step.text}</span>`;
  crossElements.historyList.append(item);
  crossElements.historyList.scrollTop = crossElements.historyList.scrollHeight;
}

function renderTrack(cells) {
  crossElements.animationTrack.innerHTML = "";
  cells.forEach((cellData) => {
    const cell = document.createElement("div");
    cell.className = `track-cell ${cellData.className || ""}`.trim();
    cell.textContent = cellData.text;
    crossElements.animationTrack.append(cell);
  });
}

function setVectorGrid(element, dimension) {
  element.style.gridTemplateColumns = `repeat(${dimension}, minmax(88px, 1fr))`;
}

function createVectorInputs(container, dimension, prefix) {
  const previous = Array.from(container.querySelectorAll("input")).map((input) => input.value || "0");
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
      input.addEventListener(eventName, renderPreviewFromInputs);
    });
    container.append(input);
  }
}

function readVector(container, label) {
  return Array.from(container.querySelectorAll("input")).map((input, index) => {
    const value = parseExpressionValue(input.value);
    input.classList.remove("invalid");
    if (!Number.isFinite(value)) {
      input.classList.add("invalid");
      throw new Error(`${label}${index + 1} に有限の数を入れてください。`);
    }
    return value;
  });
}

function highlightIndices(indicesA, indicesB) {
  crossElements.vectorA.querySelectorAll(".referenced-a").forEach((cell) => cell.classList.remove("referenced-a"));
  crossElements.vectorB.querySelectorAll(".referenced-b").forEach((cell) => cell.classList.remove("referenced-b"));
  indicesA.forEach((index) => crossElements.vectorA.querySelector(`[data-index="${index}"]`)?.classList.add("referenced-a"));
  indicesB.forEach((index) => crossElements.vectorB.querySelector(`[data-index="${index}"]`)?.classList.add("referenced-b"));
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

function appendDiagramText(svg, x, y, value, className) {
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", String(x));
  text.setAttribute("y", String(y));
  text.setAttribute("class", className);
  text.textContent = value;
  svg.append(text);
}

function drawArrow(svg, from, to, className, label) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;

  appendDiagramLine(svg, from.x, from.y, to.x, to.y, `diagram-line ${className}`);

  const size = 9;
  const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  arrow.setAttribute(
    "points",
    `${to.x},${to.y} ${to.x - ux * size - px * 4},${to.y - uy * size - py * 4} ${to.x - ux * size + px * 4},${to.y - uy * size + py * 4}`,
  );
  arrow.setAttribute("class", `diagram-arrow ${className}`);
  svg.append(arrow);

  if (!label) return;
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("class", `diagram-label-group ${className}`);
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("class", `diagram-label ${className}`);
  text.textContent = label;
  group.append(text);
  svg.append(group);

  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("rx", "8");
  rect.setAttribute("class", `diagram-label-box ${className}`);
  group.insertBefore(rect, text);

  const labelX = from.x + dx * 0.58 + px * 20;
  const labelY = from.y + dy * 0.58 + py * 20;
  text.setAttribute("x", String(labelX));
  text.setAttribute("y", String(labelY));
  const box = text.getBBox();
  rect.setAttribute("x", String(box.x - 8));
  rect.setAttribute("y", String(box.y - 5));
  rect.setAttribute("width", String(box.width + 16));
  rect.setAttribute("height", String(box.height + 10));
}

function projectPoint(vector) {
  if (crossState.dimension === 2) return { x: vector[0], y: vector[1] };
  const rotated = rotateVector3D(vector);
  return {
    x: rotated.x + rotated.z * PROJECT_3D.zX,
    y: rotated.y + rotated.z * PROJECT_3D.zY,
  };
}

function rotateVector3D(vector) {
  let [x, y, z] = vector;
  const rx = (crossState.rotateX * Math.PI) / 180;
  const ry = (crossState.rotateY * Math.PI) / 180;
  const rz = (crossState.rotateZ * Math.PI) / 180;

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

function computeScale(points) {
  const width = 720;
  const height = 360;
  const center = { x: width / 2, y: height / 2 };
  const marginX = 90;
  const marginTop = 42;
  const marginBottom = 60;
  const maxProjectedX = Math.max(1, ...points.map((point) => Math.abs(point.x)));
  const positiveProjectedY = Math.max(1, ...points.map((point) => Math.max(0, point.y)));
  const negativeProjectedY = Math.max(1, ...points.map((point) => Math.max(0, -point.y)));
  const availableRight = Math.max(80, width - center.x - marginX);
  const availableLeft = Math.max(80, center.x - marginX);
  const availableTop = Math.max(64, center.y - marginTop);
  const availableBottom = Math.max(64, height - center.y - marginBottom);
  const scaleX = Math.min(availableRight, availableLeft) / maxProjectedX;
  const scaleY = Math.min(availableTop / positiveProjectedY, availableBottom / negativeProjectedY);
  return Math.max(14, Math.min(crossState.dimension === 2 ? 30 : 22, scaleX, scaleY));
}

function drawCoordinateGrid(svg, center, scale) {
  const width = 720;
  const height = 360;
  const gridStep = 2;
  if (crossState.dimension === 3) {
    const planeUnits = 12;
    for (let unit = -planeUnits; unit <= planeUnits; unit += gridStep) {
      const startX = projectPoint([unit, -planeUnits, 0]);
      const endX = projectPoint([unit, planeUnits, 0]);
      appendDiagramLine(svg, center.x + startX.x * scale, center.y - startX.y * scale, center.x + endX.x * scale, center.y - endX.y * scale, "diagram-grid");
      const startY = projectPoint([-planeUnits, unit, 0]);
      const endY = projectPoint([planeUnits, unit, 0]);
      appendDiagramLine(svg, center.x + startY.x * scale, center.y - startY.y * scale, center.x + endY.x * scale, center.y - endY.y * scale, "diagram-grid");
    }
    return;
  }
  const spacing = scale * gridStep;
  if (spacing < 8) return;
  for (let x = center.x + spacing; x <= width; x += spacing) appendDiagramLine(svg, x, 0, x, height, "diagram-grid");
  for (let x = center.x - spacing; x >= 0; x -= spacing) appendDiagramLine(svg, x, 0, x, height, "diagram-grid");
  for (let y = center.y + spacing; y <= height; y += spacing) appendDiagramLine(svg, 0, y, width, y, "diagram-grid");
  for (let y = center.y - spacing; y >= 0; y -= spacing) appendDiagramLine(svg, 0, y, width, y, "diagram-grid");
}

function drawAxes(svg, center, scale) {
  if (crossState.dimension === 3) {
    const axes = [
      { start: [-10, 0, 0], end: [10, 0, 0], name: "x" },
      { start: [0, -10, 0], end: [0, 10, 0], name: "y" },
      { start: [0, 0, -10], end: [0, 0, 10], name: "z" },
    ];
    axes.forEach((axis) => {
      const start = projectPoint(axis.start);
      const end = projectPoint(axis.end);
      appendDiagramLine(svg, center.x + start.x * scale, center.y - start.y * scale, center.x, center.y, "diagram-axis-negative");
      appendDiagramLine(svg, center.x, center.y, center.x + end.x * scale, center.y - end.y * scale, "diagram-axis");
      appendDiagramText(svg, center.x + end.x * scale + 10, center.y - end.y * scale - 8, axis.name, "diagram-axis-name");
    });
    appendDiagramText(svg, center.x + 14, center.y + 16, "0", "diagram-axis-label origin-label");
    return;
  }
  appendDiagramLine(svg, 0, center.y, 720, center.y, "diagram-axis");
  appendDiagramLine(svg, center.x, 0, center.x, 360, "diagram-axis");
  appendDiagramText(svg, center.x + 14, center.y + 16, "0", "diagram-axis-label origin-label");
  const tickHalf = 6;
  const labelOffset = 18;
  const maxX = Math.floor(Math.min(center.x, 720 - center.x) / scale);
  const maxY = Math.floor(Math.min(center.y, 360 - center.y) / scale);
  for (let unit = Math.ceil(-maxX / 5) * 5; unit <= Math.floor(maxX / 5) * 5; unit += 5) {
    if (unit === 0) continue;
    const x = center.x + unit * scale;
    appendDiagramLine(svg, x, center.y - tickHalf, x, center.y + tickHalf, "diagram-tick");
    appendDiagramText(svg, x, center.y + labelOffset, String(unit), "diagram-axis-label x-label");
  }
  for (let unit = Math.ceil(-maxY / 5) * 5; unit <= Math.floor(maxY / 5) * 5; unit += 5) {
    if (unit === 0) continue;
    const y = center.y - unit * scale;
    appendDiagramLine(svg, center.x - tickHalf, y, center.x + tickHalf, y, "diagram-tick");
    appendDiagramText(svg, center.x + labelOffset, y + 4, String(unit), "diagram-axis-label y-label");
  }
}

function cross2D(a, b) {
  return a[0] * b[1] - a[1] * b[0];
}

function cross3D(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function renderResult(value, pending = false) {
  crossElements.resultValue.innerHTML = "";
  crossElements.resultValue.style.gridTemplateColumns = crossState.dimension === 2 ? "minmax(0, 1fr)" : "repeat(3, minmax(88px, 1fr))";
  const values = crossState.dimension === 2 ? [pending ? "?" : formatNumber(value)] : (pending ? ["?", "?", "?"] : value.map((entry) => formatNumber(entry)));
  values.forEach((entry) => {
    const cell = document.createElement("div");
    cell.className = "cell-output vector-output-cell";
    cell.textContent = entry;
    crossElements.resultValue.append(cell);
  });
}

function renderEquation(a, b, result) {
  if (crossState.dimension === 2) {
    crossElements.equationDisplay.textContent =
      `a × b = a1b2 - a2b1 = ${formatNumber(a[0])} x ${formatNumber(b[1])} - ${formatNumber(a[1])} x ${formatNumber(b[0])} = ${formatNumber(result)}`;
    return;
  }
  crossElements.equationDisplay.textContent =
    `a × b = (${formatNumber(a[1])} x ${formatNumber(b[2])} - ${formatNumber(a[2])} x ${formatNumber(b[1])}, ${formatNumber(a[2])} x ${formatNumber(b[0])} - ${formatNumber(a[0])} x ${formatNumber(b[2])}, ${formatNumber(a[0])} x ${formatNumber(b[1])} - ${formatNumber(a[1])} x ${formatNumber(b[0])}) = (${result.map((value) => formatNumber(value)).join(", ")})`;
}

function renderDiagram(a, b, options = {}) {
  const svg = crossElements.vectorDiagram;
  svg.innerHTML = "";
  const center = { x: 360, y: 180 };
  const sumVector = a.map((value, index) => value + b[index]);
  const crossVector = crossState.dimension === 3 ? cross3D(a, b) : null;
  let diagramCrossVector = null;
  if (crossVector) {
    const magnitude = Math.hypot(...crossVector);
    const base = Math.max(4, Math.min(8, Math.max(Math.hypot(...a), Math.hypot(...b), 4)));
    diagramCrossVector = magnitude < EPSILON ? [0, 0, 0] : crossVector.map((value) => (value / magnitude) * base);
  }
  const projectedPoints = [projectPoint(a), projectPoint(b), projectPoint(sumVector)];
  if (diagramCrossVector) projectedPoints.push(projectPoint(diagramCrossVector));
  const scale = computeScale(projectedPoints);

  drawCoordinateGrid(svg, center, scale);
  drawAxes(svg, center, scale);

  const origin = center;
  const aPoint = projectPoint(a);
  const bPoint = projectPoint(b);
  const sumPoint = projectPoint(sumVector);
  const aEnd = { x: origin.x + aPoint.x * scale, y: origin.y - aPoint.y * scale };
  const bEnd = { x: origin.x + bPoint.x * scale, y: origin.y - bPoint.y * scale };
  const sumEnd = { x: origin.x + sumPoint.x * scale, y: origin.y - sumPoint.y * scale };

  if (options.showArea !== false) {
    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    poly.setAttribute("points", `${origin.x},${origin.y} ${aEnd.x},${aEnd.y} ${sumEnd.x},${sumEnd.y} ${bEnd.x},${bEnd.y}`);
    poly.setAttribute("class", "diagram-parallelogram");
    svg.append(poly);
  }

  appendDiagramLine(svg, aEnd.x, aEnd.y, sumEnd.x, sumEnd.y, "diagram-b-faded");
  appendDiagramLine(svg, bEnd.x, bEnd.y, sumEnd.x, sumEnd.y, "diagram-b-faded");
  drawArrow(svg, origin, aEnd, "diagram-a", "a");
  drawArrow(svg, origin, bEnd, "diagram-b", "b");

  if (crossState.dimension === 2) {
    const areaValue = cross2D(a, b);
    appendDiagramText(svg, (origin.x + sumEnd.x) / 2, (origin.y + sumEnd.y) / 2 - 14, `a×b = ${formatNumber(areaValue)}`, "diagram-angle-value");
    return;
  }

  if (!options.showCrossVector || !diagramCrossVector) return;
  const crossPoint = projectPoint(diagramCrossVector);
  const crossEnd = { x: origin.x + crossPoint.x * scale, y: origin.y - crossPoint.y * scale };
  drawArrow(svg, origin, crossEnd, "diagram-cross", "a×b");
}

function renderPreviewFromInputs() {
  clearAnimation();
  crossState.resultVisible = false;
  crossElements.message.textContent = "";
  try {
    const a = readVector(crossElements.vectorA, "a");
    const b = readVector(crossElements.vectorB, "b");
    const result = crossState.dimension === 2 ? cross2D(a, b) : cross3D(a, b);
    renderEquation(a, b, result);
    renderDiagram(a, b, { showCrossVector: false });
    renderResult(result, true);
    crossElements.resultDetail.textContent = crossState.dimension === 2
      ? "2次元では z 成分だけが残り、平行四辺形の符号付き面積になります。"
      : "3次元では a と b の両方に垂直なベクトルになります。";
  } catch (error) {
    crossElements.message.textContent = error.message;
    crossElements.equationDisplay.textContent = "";
    crossElements.vectorDiagram.innerHTML = "";
    renderResult(0, true);
  }
}

function rerenderCurrentDiagram() {
  crossElements.message.textContent = "";
  try {
    const a = readVector(crossElements.vectorA, "a");
    const b = readVector(crossElements.vectorB, "b");
    const result = crossState.dimension === 2 ? cross2D(a, b) : cross3D(a, b);
    renderEquation(a, b, result);
    renderDiagram(a, b, { showCrossVector: crossState.resultVisible && crossState.dimension === 3 });
    renderResult(result, !crossState.resultVisible);
    crossElements.resultDetail.textContent = crossState.dimension === 2
      ? "2次元では z 成分だけが残り、平行四辺形の符号付き面積になります。"
      : "3次元では a と b の両方に垂直なベクトルになります。";
  } catch (error) {
    crossElements.message.textContent = error.message;
  }
}

function syncLayout() {
  clearAnimation();
  crossState.dimension = Number.parseInt(crossElements.dimension.value, 10) || 2;
  crossState.rotateX = Number.parseInt(crossElements.rotateX.value, 10) || 0;
  crossState.rotateY = Number.parseInt(crossElements.rotateY.value, 10) || 0;
  crossState.rotateZ = Number.parseInt(crossElements.rotateZ.value, 10) || 0;
  crossState.resultVisible = false;
  createVectorInputs(crossElements.vectorA, crossState.dimension, "a");
  createVectorInputs(crossElements.vectorB, crossState.dimension, "b");
  crossElements.dimensionStatus.textContent = `${crossState.dimension} 次元`;
  crossElements.labelA.textContent = `${crossState.dimension} 要素`;
  crossElements.labelB.textContent = `${crossState.dimension} 要素`;
  crossElements.resultKind.textContent = crossState.dimension === 2 ? "z 成分" : "外積ベクトル";
  crossElements.viewControls.hidden = crossState.dimension !== 3;
  crossElements.rotateXValue.textContent = `${crossState.rotateX}°`;
  crossElements.rotateYValue.textContent = `${crossState.rotateY}°`;
  crossElements.rotateZValue.textContent = `${crossState.rotateZ}°`;
  crossElements.formulaTitle.textContent = "外積の公式";
  crossElements.formula.textContent = crossFormula();
  renderPreviewFromInputs();
}

function randomizeVectors() {
  crossState.resultVisible = false;
  [crossElements.vectorA, crossElements.vectorB].forEach((container) => {
    container.querySelectorAll("input").forEach((input) => {
      input.value = randomComponent();
    });
  });
  renderPreviewFromInputs();
}

function animateCross() {
  clearAnimation();
  crossState.resultVisible = false;
  crossElements.message.textContent = "";
  let a;
  let b;
  try {
    a = readVector(crossElements.vectorA, "a");
    b = readVector(crossElements.vectorB, "b");
  } catch (error) {
    crossElements.message.textContent = error.message;
    return;
  }

  const result = crossState.dimension === 2 ? cross2D(a, b) : cross3D(a, b);
  renderEquation(a, b, result);
  renderDiagram(a, b, { showCrossVector: crossState.dimension === 3 });
  renderResult(result, true);

  const steps = crossState.dimension === 2
    ? [
        {
          title: "a1b2",
          text: `${formatNumber(a[0])} x ${formatNumber(b[1])} = ${formatNumber(a[0] * b[1])}`,
          track: [
            { text: "a1", className: "source-a" },
            { text: "×", className: "operator" },
            { text: "b2", className: "source-b" },
            { text: "=", className: "operator" },
            { text: formatNumber(a[0] * b[1]), className: "result" },
          ],
          aIndices: [0],
          bIndices: [1],
        },
        {
          title: "a2b1",
          text: `${formatNumber(a[1])} x ${formatNumber(b[0])} = ${formatNumber(a[1] * b[0])}`,
          track: [
            { text: "a2", className: "source-a" },
            { text: "×", className: "operator" },
            { text: "b1", className: "source-b" },
            { text: "=", className: "operator" },
            { text: formatNumber(a[1] * b[0]), className: "result" },
          ],
          aIndices: [1],
          bIndices: [0],
        },
        {
          title: "外積",
          text: `${formatNumber(a[0] * b[1])} - ${formatNumber(a[1] * b[0])} = ${formatNumber(result)}`,
          track: [
            { text: "a×b", className: "source-a" },
            { text: "=", className: "operator" },
            { text: formatNumber(result), className: "result" },
          ],
          final: true,
        },
      ]
    : [
        {
          title: "x 成分",
          text: `${formatNumber(a[1])} x ${formatNumber(b[2])} - ${formatNumber(a[2])} x ${formatNumber(b[1])} = ${formatNumber(result[0])}`,
          track: [
            { text: "(a×b)x", className: "source-a" },
            { text: "=", className: "operator" },
            { text: formatNumber(result[0]), className: "result" },
          ],
          aIndices: [1, 2],
          bIndices: [2, 1],
        },
        {
          title: "y 成分",
          text: `${formatNumber(a[2])} x ${formatNumber(b[0])} - ${formatNumber(a[0])} x ${formatNumber(b[2])} = ${formatNumber(result[1])}`,
          track: [
            { text: "(a×b)y", className: "source-a" },
            { text: "=", className: "operator" },
            { text: formatNumber(result[1]), className: "result" },
          ],
          aIndices: [2, 0],
          bIndices: [0, 2],
        },
        {
          title: "z 成分",
          text: `${formatNumber(a[0])} x ${formatNumber(b[1])} - ${formatNumber(a[1])} x ${formatNumber(b[0])} = ${formatNumber(result[2])}`,
          track: [
            { text: "(a×b)z", className: "source-a" },
            { text: "=", className: "operator" },
            { text: formatNumber(result[2]), className: "result" },
          ],
          aIndices: [0, 1],
          bIndices: [1, 0],
        },
        {
          title: "外積ベクトル",
          text: `a × b = (${result.map((value) => formatNumber(value)).join(", ")})`,
          track: [
            { text: "a×b", className: "source-a" },
            { text: "=", className: "operator" },
            { text: `(${result.map((value) => formatNumber(value)).join(", ")})`, className: "result" },
          ],
          final: true,
        },
      ];

  steps.forEach((step, index) => {
    const timerId = window.setTimeout(() => {
      highlightIndices(step.aIndices || [], step.bIndices || []);
      renderTrack(step.track);
      crossElements.formulaTitle.textContent = step.title;
      crossElements.formula.textContent = step.text;
      appendHistory(step);
      if (step.final) {
        crossState.resultVisible = true;
        renderResult(result, false);
        crossElements.resultDetail.textContent = crossState.dimension === 2
          ? "正なら反時計回り、負なら時計回りの向きです。"
          : "a と b の両方に垂直な方向が外積です。";
      }
    }, index * 1000);
    crossState.timerIds.push(timerId);
  });
}

["input", "change"].forEach((eventName) => {
  crossElements.rotateX.addEventListener(eventName, () => {
    crossState.rotateX = Number.parseInt(crossElements.rotateX.value, 10) || 0;
    crossElements.rotateXValue.textContent = `${crossState.rotateX}°`;
    rerenderCurrentDiagram();
  });
  crossElements.rotateY.addEventListener(eventName, () => {
    crossState.rotateY = Number.parseInt(crossElements.rotateY.value, 10) || 0;
    crossElements.rotateYValue.textContent = `${crossState.rotateY}°`;
    rerenderCurrentDiagram();
  });
  crossElements.rotateZ.addEventListener(eventName, () => {
    crossState.rotateZ = Number.parseInt(crossElements.rotateZ.value, 10) || 0;
    crossElements.rotateZValue.textContent = `${crossState.rotateZ}°`;
    rerenderCurrentDiagram();
  });
});

crossElements.dimension.addEventListener("change", syncLayout);
crossElements.randomize.addEventListener("click", randomizeVectors);
crossElements.animate.addEventListener("click", animateCross);

syncLayout();
