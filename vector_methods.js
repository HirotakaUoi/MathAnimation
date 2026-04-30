const EPSILON = 1e-9;
const vectorPageType = location.pathname.includes("vector_angle") ? "angle" : "dot";

const vectorElements = {
  dimension: document.querySelector("#dimension"),
  methodMode: document.querySelector("#methodMode"),
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
  magnitudeA: document.querySelector("#magnitudeA"),
  magnitudeB: document.querySelector("#magnitudeB"),
  angleDegrees: document.querySelector("#angleDegrees"),
  vectorDiagram: document.querySelector("#vectorDiagram"),
};

const vectorState = {
  dimension: 2,
  methodMode: "components",
  timerIds: [],
  syncLock: false,
};

const PROJECT_3D = {
  zX: -0.78,
  zY: 0.46,
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

function scheduleDotSync(source) {
  if (vectorPageType !== "dot" || vectorState.syncLock) return;
  window.requestAnimationFrame(() => {
    if (source === "geometry") syncDotFromGeometry();
    else syncDotFromComponents();
  });
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
    if (vectorPageType === "dot") {
      ["input", "change", "keyup", "blur"].forEach((eventName) => {
        input.addEventListener(eventName, () => scheduleDotSync("components"));
      });
    }
    container.append(input);
  }
}

function setVectorValues(container, vector) {
  const cells = Array.from(container.querySelectorAll("input"));
  vector.forEach((value, index) => {
    if (cells[index]) cells[index].value = vectorFormatNumber(value);
  });
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

function readMagnitudeAngleInputs() {
  if (!vectorElements.magnitudeA || !vectorElements.magnitudeB || !vectorElements.angleDegrees) {
    throw new Error("大きさ入力欄がありません。");
  }
  const magA = parseExpressionValue(vectorElements.magnitudeA.value);
  const magB = parseExpressionValue(vectorElements.magnitudeB.value);
  const theta = parseExpressionValue(vectorElements.angleDegrees.value);
  if (magA < 0 || magB < 0) throw new Error("大きさは 0 以上で入力してください。");
  if (theta < 0 || theta > 180) throw new Error("なす角 θ は 0 以上 180 以下で入力してください。");
  [vectorElements.magnitudeA, vectorElements.magnitudeB, vectorElements.angleDegrees].forEach((input) => input.classList.remove("invalid"));
  return { magA, magB, theta };
}

function canonicalVectorsFromGeometry(magA, magB, thetaDegrees) {
  const radians = (thetaDegrees * Math.PI) / 180;
  const a = vectorState.dimension === 2 ? [magA, 0] : [magA, 0, 0];
  const b = vectorState.dimension === 2
    ? [magB * Math.cos(radians), magB * Math.sin(radians)]
    : [magB * Math.cos(radians), magB * Math.sin(radians), 0];
  return { a, b };
}

function updateGeometryInputsFromVectors(a, b) {
  if (!vectorElements.magnitudeA || !vectorElements.magnitudeB || !vectorElements.angleDegrees) return;
  const magA = magnitude(a);
  const magB = magnitude(b);
  const theta = magA < EPSILON || magB < EPSILON
    ? 0
    : (Math.acos(Math.max(-1, Math.min(1, dotProduct(a, b) / (magA * magB)))) * 180) / Math.PI;
  vectorElements.magnitudeA.value = vectorFormatNumber(magA);
  vectorElements.magnitudeB.value = vectorFormatNumber(magB);
  vectorElements.angleDegrees.value = vectorFormatNumber(theta);
}

function renderEquationDisplay(a, b, mode, geometry = null) {
  if (mode === "dot-components") {
    const terms = a.map((value, index) => `${vectorFormatNumber(value)} x ${vectorFormatNumber(b[index])}`);
    const dot = dotProduct(a, b);
    const magA = magnitude(a);
    const magB = magnitude(b);
    vectorElements.equationDisplay.textContent =
      `a · b = ${terms.join(" + ")} = ${vectorFormatNumber(dot)} , |a| = ${vectorFormatNumber(magA)} , |b| = ${vectorFormatNumber(magB)}`;
    return;
  }
  if (mode === "dot-geometry" && geometry) {
    const dot = geometry.magA * geometry.magB * Math.cos((geometry.theta * Math.PI) / 180);
    vectorElements.equationDisplay.textContent =
      `a · b = |a| |b| cos θ = ${vectorFormatNumber(geometry.magA)} x ${vectorFormatNumber(geometry.magB)} x cos(${vectorFormatNumber(geometry.theta)}°) = ${vectorFormatNumber(dot)}`;
    return;
  }
  const terms = a.map((value, index) => `${vectorFormatNumber(value)} x ${vectorFormatNumber(b[index])}`);
  const magA = `|a| = sqrt(${a.map((value) => `${vectorFormatNumber(value)}^2`).join(" + ")})`;
  const magB = `|b| = sqrt(${b.map((value) => `${vectorFormatNumber(value)}^2`).join(" + ")})`;
  vectorElements.equationDisplay.textContent = `${terms.join(" + ")} , ${magA} , ${magB}`;
}

function rotateVector3D(vector) {
  return {
    x: vector[0] + vector[2] * PROJECT_3D.zX,
    y: vector[1] + vector[2] * PROJECT_3D.zY,
  };
}

function projectPoint(vector) {
  if (vectorState.dimension === 2) {
    return { x: vector[0], y: vector[1] };
  }
  return rotateVector3D(vector);
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

  const paddingX = 8;
  const paddingY = 5;
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("rx", "8");
  rect.setAttribute("class", `diagram-label-box ${className}`);
  group.insertBefore(rect, text);

  const labelX = from.x + dx * 0.58 + px * 20;
  const labelY = from.y + dy * 0.58 + py * 20;
  text.setAttribute("x", String(labelX));
  text.setAttribute("y", String(labelY));
  const box = text.getBBox();
  rect.setAttribute("x", String(box.x - paddingX));
  rect.setAttribute("y", String(box.y - paddingY));
  rect.setAttribute("width", String(box.width + paddingX * 2));
  rect.setAttribute("height", String(box.height + paddingY * 2));
}

function drawDiagramBadge(svg, x, y, className, label) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("class", `diagram-label-group ${className}`);

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("class", `diagram-label ${className}`);
  text.setAttribute("x", String(x));
  text.setAttribute("y", String(y));
  text.textContent = label;
  group.append(text);
  svg.append(group);

  const paddingX = 8;
  const paddingY = 5;
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("rx", "8");
  rect.setAttribute("class", `diagram-label-box ${className}`);
  group.insertBefore(rect, text);

  const box = text.getBBox();
  rect.setAttribute("x", String(box.x - paddingX));
  rect.setAttribute("y", String(box.y - paddingY));
  rect.setAttribute("width", String(box.width + paddingX * 2));
  rect.setAttribute("height", String(box.height + paddingY * 2));
}

function drawAngleArc(svg, center, radius, startAngle, endAngle) {
  if (Math.abs(endAngle - startAngle) < 0.03) return;
  let delta = endAngle - startAngle;
  while (delta <= -Math.PI) delta += Math.PI * 2;
  while (delta > Math.PI) delta -= Math.PI * 2;
  const startX = center.x + Math.cos(startAngle) * radius;
  const startY = center.y - Math.sin(startAngle) * radius;
  const endX = center.x + Math.cos(startAngle + delta) * radius;
  const endY = center.y - Math.sin(startAngle + delta) * radius;
  const largeArc = Math.abs(delta) > Math.PI ? 1 : 0;
  const sweep = delta > 0 ? 0 : 1;
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${endX} ${endY}`);
  path.setAttribute("class", "diagram-angle-arc");
  svg.append(path);
}

function drawProjectionGuide(svg, from, to) {
  appendDiagramLine(svg, from.x, from.y, to.x, to.y, "diagram-projection-guide");
  const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  point.setAttribute("cx", String(to.x));
  point.setAttribute("cy", String(to.y));
  point.setAttribute("r", "4.5");
  point.setAttribute("class", "diagram-projection-point");
  svg.append(point);
}

function projectionOnLine(a, b) {
  const denominator = dotProduct(b, b);
  if (denominator < EPSILON) return null;
  const scale = dotProduct(a, b) / denominator;
  return b.map((value) => value * scale);
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
  return Math.max(14, Math.min(vectorState.dimension === 2 ? 30 : 24, scaleX, scaleY));
}

function drawCoordinateGrid(svg, center, width, height, scale) {
  const gridStep = 2;
  if (vectorState.dimension === 3) {
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
  for (let x = center.x + spacing; x <= width; x += spacing) appendDiagramLine(svg, x, 0, x, height, "diagram-grid");
  for (let x = center.x - spacing; x >= 0; x -= spacing) appendDiagramLine(svg, x, 0, x, height, "diagram-grid");
  for (let y = center.y + spacing; y <= height; y += spacing) appendDiagramLine(svg, 0, y, width, y, "diagram-grid");
  for (let y = center.y - spacing; y >= 0; y -= spacing) appendDiagramLine(svg, 0, y, width, y, "diagram-grid");
}

function drawAxisTicks(svg, center, width, height, scale) {
  if (vectorState.dimension === 3) {
    const xEnd = projectPoint([10, 0, 0]);
    const yEnd = projectPoint([0, 10, 0]);
    const zEnd = projectPoint([0, 0, 10]);
    appendDiagramText(svg, center.x + xEnd.x * scale + 12, center.y - xEnd.y * scale + 4, "x", "diagram-axis-name");
    appendDiagramText(svg, center.x + yEnd.x * scale + 8, center.y - yEnd.y * scale - 12, "y", "diagram-axis-name");
    appendDiagramText(svg, center.x + zEnd.x * scale - 12, center.y - zEnd.y * scale - 8, "z", "diagram-axis-name");
    appendDiagramText(svg, center.x + 14, center.y + 16, "0", "diagram-axis-label origin-label");
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

function renderDotDiagram(a, b, geometry, options = {}) {
  if (!vectorElements.vectorDiagram) return;
  const svg = vectorElements.vectorDiagram;
  svg.innerHTML = "";
  const width = 720;
  const height = 360;
  const center = { x: width / 2, y: height / 2 };
  const aPoint = projectPoint(a);
  const bPoint = projectPoint(b);
  const scale = computeDiagramScale(center, width, height, [aPoint, bPoint]);
  drawCoordinateGrid(svg, center, width, height, scale);

  if (vectorState.dimension === 3) {
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
    appendDiagramLine(svg, 0, center.y, width, center.y, "diagram-axis");
    appendDiagramLine(svg, center.x, 0, center.x, height, "diagram-axis");
  }

  drawAxisTicks(svg, center, width, height, scale);

  const origin = { x: center.x, y: center.y };
  const aEnd = { x: origin.x + aPoint.x * scale, y: origin.y - aPoint.y * scale };
  const bEnd = { x: origin.x + bPoint.x * scale, y: origin.y - bPoint.y * scale };
  drawArrow(svg, origin, aEnd, "diagram-a", "a");
  drawArrow(svg, origin, bEnd, "diagram-b", "b");

  if (options.showProjection) {
    const projectedVector = projectionOnLine(a, b);
    if (projectedVector) {
      const projectedPoint = projectPoint(projectedVector);
      const foot = { x: origin.x + projectedPoint.x * scale, y: origin.y - projectedPoint.y * scale };
      appendDiagramLine(
        svg,
        origin.x - bPoint.x * scale * 0.55,
        origin.y + bPoint.y * scale * 0.55,
        origin.x + bPoint.x * scale * 1.55,
        origin.y - bPoint.y * scale * 1.55,
        "diagram-projection-line",
      );
      appendDiagramLine(svg, origin.x, origin.y, foot.x, foot.y, "diagram-projection-shadow");
      drawProjectionGuide(svg, aEnd, foot);
      appendDiagramText(svg, (aEnd.x + foot.x) / 2 + 16, (aEnd.y + foot.y) / 2 - 14, "⊥", "diagram-angle-value");
    }
  }

  if (!geometry) return;
  const angleA = Math.atan2(aPoint.y, aPoint.x);
  const angleB = Math.atan2(bPoint.y, bPoint.x);
  const arcRadius = Math.max(24, Math.min(54, scale * 1.4));
  drawAngleArc(svg, origin, arcRadius, angleA, angleB);
  const midAngle = angleA + ((((angleB - angleA) + Math.PI * 3) % (Math.PI * 2)) - Math.PI) / 2;
  const thetaBadgeX = origin.x + Math.cos(midAngle) * (arcRadius + 18);
  const thetaBadgeY = origin.y - Math.sin(midAngle) * (arcRadius + 18);
  drawDiagramBadge(
    svg,
    thetaBadgeX,
    thetaBadgeY,
    "diagram-result",
    "θ",
  );
  const tangentX = -Math.sin(midAngle);
  const tangentY = -Math.cos(midAngle);
  appendDiagramText(
    svg,
    thetaBadgeX + Math.cos(midAngle) * 54 + tangentX * 16,
    thetaBadgeY - Math.sin(midAngle) * 22 + tangentY * 16,
    `θ = ${vectorFormatNumber(geometry.theta)}°`,
    "diagram-angle-value",
  );
  appendDiagramText(svg, aEnd.x + 12, aEnd.y - 10, `|a|=${vectorFormatNumber(geometry.magA)}`, "diagram-angle-value");
  appendDiagramText(svg, bEnd.x + 12, bEnd.y - 10, `|b|=${vectorFormatNumber(geometry.magB)}`, "diagram-angle-value");
}

function renderDotPreview(a, b) {
  const magA = magnitude(a);
  const magB = magnitude(b);
  const theta = magA < EPSILON || magB < EPSILON
    ? 0
    : (Math.acos(Math.max(-1, Math.min(1, dotProduct(a, b) / (magA * magB)))) * 180) / Math.PI;
  renderEquationDisplay(a, b, vectorState.methodMode === "geometry" ? "dot-geometry" : "dot-components", { magA, magB, theta });
  renderDotDiagram(a, b, { magA, magB, theta });
  vectorElements.resultValue.textContent = "?";
  vectorElements.resultDetail.textContent = vectorState.methodMode === "components"
    ? "成分の積の和と，大きさ |a|, |b| を順に確認します。"
    : "入力した |a|, |b|, θ から a · b = |a||b|cosθ を作ります。";
}

function syncDotFromComponents() {
  clearVectorAnimation();
  vectorElements.message.textContent = "";
  try {
    const a = readVector(vectorElements.vectorA, "a");
    const b = readVector(vectorElements.vectorB, "b");
    vectorState.syncLock = true;
    updateGeometryInputsFromVectors(a, b);
    vectorState.syncLock = false;
    renderDotPreview(a, b);
  } catch (error) {
    vectorState.syncLock = false;
    vectorElements.message.textContent = error.message;
    vectorElements.equationDisplay.textContent = "";
    if (vectorElements.vectorDiagram) vectorElements.vectorDiagram.innerHTML = "";
    vectorElements.resultValue.textContent = "?";
  }
}

function syncDotFromGeometry() {
  clearVectorAnimation();
  vectorElements.message.textContent = "";
  try {
    const geometry = readMagnitudeAngleInputs();
    const canonical = canonicalVectorsFromGeometry(geometry.magA, geometry.magB, geometry.theta);
    vectorState.syncLock = true;
    setVectorValues(vectorElements.vectorA, canonical.a);
    setVectorValues(vectorElements.vectorB, canonical.b);
    vectorState.syncLock = false;
    renderEquationDisplay(canonical.a, canonical.b, vectorState.methodMode === "geometry" ? "dot-geometry" : "dot-components", geometry);
    renderDotDiagram(canonical.a, canonical.b, geometry);
    vectorElements.resultValue.textContent = "?";
    vectorElements.resultDetail.textContent = vectorState.methodMode === "geometry"
      ? "入力した |a|, |b|, θ から a · b = |a||b|cosθ を作ります。"
      : "成分表示も同時に更新しています。";
  } catch (error) {
    vectorState.syncLock = false;
    [vectorElements.magnitudeA, vectorElements.magnitudeB, vectorElements.angleDegrees].forEach((input) => {
      if (input) input.classList.add("invalid");
    });
    vectorElements.message.textContent = error.message;
    vectorElements.equationDisplay.textContent = "";
    if (vectorElements.vectorDiagram) vectorElements.vectorDiagram.innerHTML = "";
    vectorElements.resultValue.textContent = "?";
  }
}

function syncVectorLayout() {
  clearVectorAnimation();
  vectorState.dimension = Number.parseInt(vectorElements.dimension.value, 10) || 2;
  vectorElements.dimension.value = String(vectorState.dimension);
  if (vectorElements.methodMode) {
    vectorState.methodMode = vectorElements.methodMode.value;
  }
  createVectorInputs(vectorElements.vectorA, vectorState.dimension, "a");
  createVectorInputs(vectorElements.vectorB, vectorState.dimension, "b");
  vectorElements.labelA.textContent = `${vectorState.dimension} 要素`;
  vectorElements.labelB.textContent = `${vectorState.dimension} 要素`;
  vectorElements.dimensionStatus.textContent = `${vectorState.dimension} 次元`;
  vectorElements.resultValue.textContent = "?";
  if (vectorPageType === "dot") {
    vectorElements.resultDetail.textContent = vectorState.methodMode === "components"
      ? "成分の積の和と，大きさ |a|, |b| を順に確認します。"
      : "入力した |a|, |b|, θ から a · b = |a||b|cosθ を作ります。";
    vectorElements.formulaTitle.textContent = "内積";
    vectorElements.formula.textContent = vectorState.methodMode === "components"
      ? "対応する成分を掛けて和をとり、その後 |a| と |b| も計算します。"
      : "大きさ |a|, |b| と なす角 θ を使って a · b = |a||b|cosθ を計算します。";
    syncDotFromComponents();
  } else {
    vectorElements.resultDetail.textContent = "cos θ = (a · b) / (|a||b|) を使います。";
    vectorElements.formulaTitle.textContent = "なす角";
    vectorElements.formula.textContent = "まず内積を求め、その後 |a| と |b| で割って cos θ を作り、最後に arccos をとります。";
    vectorElements.equationDisplay.textContent = "";
    try {
      const a = readVector(vectorElements.vectorA, "a");
      const b = readVector(vectorElements.vectorB, "b");
      const magA = magnitude(a);
      const magB = magnitude(b);
      const theta = magA < EPSILON || magB < EPSILON
        ? 0
        : (Math.acos(Math.max(-1, Math.min(1, dotProduct(a, b) / (magA * magB)))) * 180) / Math.PI;
      renderDotDiagram(a, b, { magA, magB, theta });
    } catch {
      if (vectorElements.vectorDiagram) vectorElements.vectorDiagram.innerHTML = "";
    }
  }
}

function randomizeVectors() {
  [vectorElements.vectorA, vectorElements.vectorB].forEach((container) => {
    container.querySelectorAll("input").forEach((input) => {
      input.value = randomComponent();
    });
  });
  if (vectorPageType === "dot") syncDotFromComponents();
  else {
    try {
      const a = readVector(vectorElements.vectorA, "a");
      const b = readVector(vectorElements.vectorB, "b");
      const magA = magnitude(a);
      const magB = magnitude(b);
      const theta = magA < EPSILON || magB < EPSILON
        ? 0
        : (Math.acos(Math.max(-1, Math.min(1, dotProduct(a, b) / (magA * magB)))) * 180) / Math.PI;
      renderDotDiagram(a, b, { magA, magB, theta });
    } catch {
      if (vectorElements.vectorDiagram) vectorElements.vectorDiagram.innerHTML = "";
    }
  }
}

function animateDot() {
  clearVectorAnimation();
  vectorElements.message.textContent = "";

  if (vectorState.methodMode === "geometry") {
    let geometry;
    let canonical;
    try {
      geometry = readMagnitudeAngleInputs();
      canonical = canonicalVectorsFromGeometry(geometry.magA, geometry.magB, geometry.theta);
      vectorState.syncLock = true;
      setVectorValues(vectorElements.vectorA, canonical.a);
      setVectorValues(vectorElements.vectorB, canonical.b);
      vectorState.syncLock = false;
    } catch (error) {
      vectorState.syncLock = false;
      vectorElements.message.textContent = error.message;
      return;
    }
    animateDotByGeometry(canonical.a, canonical.b, geometry);
    return;
  }

  let a;
  let b;
  try {
    a = readVector(vectorElements.vectorA, "a");
    b = readVector(vectorElements.vectorB, "b");
    vectorState.syncLock = true;
    updateGeometryInputsFromVectors(a, b);
    vectorState.syncLock = false;
  } catch (error) {
    vectorState.syncLock = false;
    vectorElements.message.textContent = error.message;
    return;
  }

  const dot = dotProduct(a, b);
  const magA = magnitude(a);
  const magB = magnitude(b);
  const geometry = {
    magA,
    magB,
    theta: magA < EPSILON || magB < EPSILON ? 0 : (Math.acos(Math.max(-1, Math.min(1, dot / (magA * magB)))) * 180) / Math.PI,
  };
  renderEquationDisplay(a, b, "dot-components", geometry);
  renderDotDiagram(a, b, geometry);

  const steps = a.map((value, index) => ({
    title: `${index + 1} 成分目`,
    text: `${vectorFormatNumber(value)} x ${vectorFormatNumber(b[index])} = ${vectorFormatNumber(value * b[index])}`,
    index,
  }));
  steps.push({
    title: "内積の合計",
    text: `${a.map((value, index) => `${vectorFormatNumber(value * b[index])}`).join(" + ")} = ${vectorFormatNumber(dot)}`,
    finalDot: true,
  });
  steps.push({
    title: "a の射影",
    text: "ベクトル a の先端から、ベクトル b の延長線へ垂線を下ろして b 方向の成分を見ます。",
    projection: true,
  });
  steps.push({
    title: "|a|",
    text: `|a| = sqrt(${a.map((value) => `${vectorFormatNumber(value)}^2`).join(" + ")}) = ${vectorFormatNumber(magA)}`,
  });
  steps.push({
    title: "|b|",
    text: `|b| = sqrt(${b.map((value) => `${vectorFormatNumber(value)}^2`).join(" + ")}) = ${vectorFormatNumber(magB)}`,
    final: true,
  });

  steps.forEach((step, order) => {
    const timerId = window.setTimeout(() => {
      if (step.index !== undefined) highlightVectorIndex(step.index);
      if (step.finalDot) {
        renderTrack([
          { text: "a · b", className: "source-a" },
          { text: "=", className: "operator" },
          { text: vectorFormatNumber(dot), className: "result" },
        ]);
      } else if (step.projection) {
        renderDotDiagram(a, b, geometry, { showProjection: true });
        renderTrack([
          { text: "a", className: "source-a" },
          { text: "→", className: "operator" },
          { text: "b の延長線へ垂線", className: "source-b" },
        ]);
      } else if (step.title === "|a|") {
        renderTrack([
          { text: "|a|", className: "source-a" },
          { text: "=", className: "operator" },
          { text: vectorFormatNumber(magA), className: "result" },
        ]);
      } else if (step.title === "|b|") {
        renderTrack([
          { text: "|b|", className: "source-b" },
          { text: "=", className: "operator" },
          { text: vectorFormatNumber(magB), className: "result" },
        ]);
      } else {
        renderTrack([
          { text: `a${step.index + 1}: ${vectorFormatNumber(a[step.index])}`, className: "source-a" },
          { text: "x", className: "operator" },
          { text: `b${step.index + 1}: ${vectorFormatNumber(b[step.index])}`, className: "source-b" },
          { text: "=", className: "operator" },
          { text: vectorFormatNumber(a[step.index] * b[step.index]), className: "result" },
        ]);
      }
      vectorElements.formulaTitle.textContent = step.title;
      vectorElements.formula.textContent = step.text;
      appendHistory(step);
      if (step.finalDot || step.final || step.projection) {
        vectorElements.resultValue.textContent = vectorFormatNumber(dot);
        vectorElements.resultDetail.textContent = `a · b = ${vectorFormatNumber(dot)} , |a| = ${vectorFormatNumber(magA)} , |b| = ${vectorFormatNumber(magB)}`;
      }
    }, order * 950);
    vectorState.timerIds.push(timerId);
  });
}

function animateDotByGeometry(a, b, geometry) {
  const dot = geometry.magA * geometry.magB * Math.cos((geometry.theta * Math.PI) / 180);
  renderEquationDisplay(a, b, "dot-geometry", geometry);
  renderDotDiagram(a, b, geometry);

  const steps = [
    {
      title: "|a|",
      text: `|a| = ${vectorFormatNumber(geometry.magA)}`,
      track: [
        { text: "|a|", className: "source-a" },
        { text: "=", className: "operator" },
        { text: vectorFormatNumber(geometry.magA), className: "result" },
      ],
    },
    {
      title: "|b|",
      text: `|b| = ${vectorFormatNumber(geometry.magB)}`,
      track: [
        { text: "|b|", className: "source-b" },
        { text: "=", className: "operator" },
        { text: vectorFormatNumber(geometry.magB), className: "result" },
      ],
    },
    {
      title: "θ",
      text: `θ = ${vectorFormatNumber(geometry.theta)}°`,
      track: [
        { text: "θ", className: "source-a" },
        { text: "=", className: "operator" },
        { text: `${vectorFormatNumber(geometry.theta)}°`, className: "result" },
      ],
    },
    {
      title: "a の射影",
      text: "ベクトル a を b の方向へ落とした影が、内積の幾何的な意味です。",
      track: [
        { text: "a", className: "source-a" },
        { text: "→", className: "operator" },
        { text: "b 方向の影", className: "source-b" },
      ],
      projection: true,
    },
    {
      title: "内積",
      text: `a · b = ${vectorFormatNumber(geometry.magA)} x ${vectorFormatNumber(geometry.magB)} x cos(${vectorFormatNumber(geometry.theta)}°) = ${vectorFormatNumber(dot)}`,
      track: [
        { text: "|a||b|cosθ", className: "source-a" },
        { text: "=", className: "operator" },
        { text: vectorFormatNumber(dot), className: "result" },
      ],
      final: true,
    },
  ];

  steps.forEach((step, order) => {
    const timerId = window.setTimeout(() => {
      if (step.projection) {
        renderDotDiagram(a, b, geometry, { showProjection: true });
      }
      renderTrack(step.track);
      vectorElements.formulaTitle.textContent = step.title;
      vectorElements.formula.textContent = step.text;
      appendHistory(step);
      if (step.final) {
        vectorElements.resultValue.textContent = vectorFormatNumber(dot);
        vectorElements.resultDetail.textContent = step.text;
      }
    }, order * 1000);
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
  renderDotDiagram(a, b, { magA, magB, theta });
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
if (vectorElements.methodMode) {
  vectorElements.methodMode.addEventListener("change", syncVectorLayout);
}
if (vectorPageType === "dot") {
  [vectorElements.magnitudeA, vectorElements.magnitudeB, vectorElements.angleDegrees].forEach((input) => {
    input?.addEventListener("input", () => scheduleDotSync("geometry"));
    input?.addEventListener("change", () => scheduleDotSync("geometry"));
    input?.addEventListener("keyup", () => scheduleDotSync("geometry"));
    input?.addEventListener("blur", () => scheduleDotSync("geometry"));
  });
}
vectorElements.randomize.addEventListener("click", () => {
  randomizeVectors();
  if (vectorPageType === "dot") return;
  animateAngle();
});
vectorElements.animate.addEventListener("click", () => {
  if (vectorPageType === "dot") animateDot();
  else animateAngle();
});

syncVectorLayout();
