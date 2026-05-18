const TopicShared = (() => {
  const EPSILON = 1e-9;
  const VIEWBOX = { width: 720, height: 360 };

  function formatNumber(value, digits = 3) {
    if (!Number.isFinite(value)) return "NaN";
    const rounded = Math.abs(value) < EPSILON ? 0 : value;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
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
        if (!match) throw new Error("数値を読み取れません。");
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
      if (char === "π") {
        tokens.push({ type: "name", value: "pi" });
        index += 1;
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

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomNonZero(min = -5, max = 5) {
    let value = 0;
    while (value === 0) value = randomInt(min, max);
    return value;
  }

  function ensureNonZeroVector(vector) {
    if (norm(vector) > EPSILON) return vector;
    return vector.map((_, index) => (index === 0 ? 1 : 0));
  }

  function clearTimers(state) {
    state.timerIds.forEach((id) => window.clearTimeout(id));
    state.timerIds = [];
  }

  function clearHistory(list) {
    list.innerHTML = "";
  }

  function pushHistory(list, title, text) {
    const item = document.createElement("li");
    item.className = "history-item";
    item.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
    list.append(item);
    list.scrollTop = list.scrollHeight;
  }

  function renderTrack(container, labels, activeIndex, onSelect = null) {
    container.innerHTML = "";
    labels.forEach((label, index) => {
      const step = document.createElement(onSelect ? "button" : "div");
      if (onSelect) step.type = "button";
      step.className = "track-step";
      if (index < activeIndex) step.classList.add("done");
      if (index === activeIndex) step.classList.add("active");
      step.textContent = label;
      if (onSelect) step.addEventListener("click", () => onSelect(index));
      container.append(step);
    });
  }

  function createVectorInputs(container, dimension, prefix, initial = []) {
    container.innerHTML = "";
    container.style.gridTemplateColumns = `repeat(${dimension}, minmax(88px, 1fr))`;
    for (let index = 0; index < dimension; index += 1) {
      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "decimal";
      input.className = "cell-input vector-cell";
      input.value = initial[index] ?? 0;
      input.dataset.index = String(index);
      input.ariaLabel = `${prefix}${index + 1}`;
      container.append(input);
    }
  }

  function readVector(container, label) {
    return Array.from(container.querySelectorAll("input")).map((input, index) => {
      try {
        input.classList.remove("invalid");
        return parseExpressionValue(input.value);
      } catch (error) {
        input.classList.add("invalid");
        throw new Error(`${label}${index + 1}: ${error.message}`);
      }
    });
  }

  function writeVector(container, values) {
    Array.from(container.querySelectorAll("input")).forEach((input, index) => {
      input.value = formatNumber(values[index] ?? 0);
      input.classList.remove("invalid");
    });
  }

  function createMatrixInputs(container, rows, cols, prefix, initial = []) {
    container.innerHTML = "";
    container.style.gridTemplateColumns = `repeat(${cols}, minmax(88px, 1fr))`;
    container.classList.add("matrix-input");
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const input = document.createElement("input");
        input.type = "text";
        input.inputMode = "decimal";
        input.className = "cell-input";
        input.value = initial[row]?.[col] ?? 0;
        input.ariaLabel = `${prefix}${row + 1}${col + 1}`;
        container.append(input);
      }
    }
  }

  function readMatrix(container, rows, cols, label) {
    const cells = Array.from(container.querySelectorAll("input"));
    const matrix = [];
    for (let row = 0; row < rows; row += 1) {
      const values = [];
      for (let col = 0; col < cols; col += 1) {
        const input = cells[row * cols + col];
        try {
          input.classList.remove("invalid");
          values.push(parseExpressionValue(input.value));
        } catch (error) {
          input.classList.add("invalid");
          throw new Error(`${label}${row + 1},${col + 1}: ${error.message}`);
        }
      }
      matrix.push(values);
    }
    return matrix;
  }

  function writeMatrix(container, rows, cols, values) {
    const cells = Array.from(container.querySelectorAll("input"));
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const input = cells[row * cols + col];
        input.value = formatNumber(values[row]?.[col] ?? 0);
        input.classList.remove("invalid");
      }
    }
  }

  function dot(a, b) {
    return a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);
  }

  function norm(vector) {
    return Math.sqrt(dot(vector, vector));
  }

  function addVectors(a, b) {
    return a.map((value, index) => value + (b[index] ?? 0));
  }

  function subtractVectors(a, b) {
    return a.map((value, index) => value - (b[index] ?? 0));
  }

  function scaleVector(vector, scalar) {
    return vector.map((value) => value * scalar);
  }

  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  function determinant2(matrix) {
    return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  }

  function determinant3(matrix) {
    const [a, b, c] = matrix[0];
    const [d, e, f] = matrix[1];
    const [g, h, i] = matrix[2];
    return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  }

  function matrixFromColumns(vectors, dimension) {
    return Array.from({ length: dimension }, (_, row) =>
      Array.from({ length: dimension }, (_, col) => vectors[col]?.[row] ?? 0),
    );
  }

  function rankOfMatrix(matrix) {
    const work = matrix.map((row) => row.slice());
    const rows = work.length;
    const cols = work[0]?.length ?? 0;
    let rank = 0;
    let pivotRow = 0;

    for (let col = 0; col < cols && pivotRow < rows; col += 1) {
      let bestRow = pivotRow;
      for (let row = pivotRow + 1; row < rows; row += 1) {
        if (Math.abs(work[row][col]) > Math.abs(work[bestRow][col])) bestRow = row;
      }
      if (Math.abs(work[bestRow][col]) < EPSILON) continue;
      [work[pivotRow], work[bestRow]] = [work[bestRow], work[pivotRow]];
      const pivot = work[pivotRow][col];
      for (let currentCol = col; currentCol < cols; currentCol += 1) work[pivotRow][currentCol] /= pivot;
      for (let row = 0; row < rows; row += 1) {
        if (row === pivotRow) continue;
        const factor = work[row][col];
        if (Math.abs(factor) < EPSILON) continue;
        for (let currentCol = col; currentCol < cols; currentCol += 1) {
          work[row][currentCol] -= factor * work[pivotRow][currentCol];
        }
      }
      rank += 1;
      pivotRow += 1;
    }
    return rank;
  }

  function solveLinearSystem(matrix, vector) {
    const rows = matrix.length;
    const cols = matrix[0]?.length ?? 0;
    const work = matrix.map((row, index) => row.slice().concat(vector[index]));
    let pivotRow = 0;
    const pivotCols = [];

    for (let col = 0; col < cols && pivotRow < rows; col += 1) {
      let bestRow = pivotRow;
      for (let row = pivotRow + 1; row < rows; row += 1) {
        if (Math.abs(work[row][col]) > Math.abs(work[bestRow][col])) bestRow = row;
      }
      if (Math.abs(work[bestRow][col]) < EPSILON) continue;
      [work[pivotRow], work[bestRow]] = [work[bestRow], work[pivotRow]];
      const pivot = work[pivotRow][col];
      for (let currentCol = col; currentCol <= cols; currentCol += 1) work[pivotRow][currentCol] /= pivot;
      for (let row = 0; row < rows; row += 1) {
        if (row === pivotRow) continue;
        const factor = work[row][col];
        if (Math.abs(factor) < EPSILON) continue;
        for (let currentCol = col; currentCol <= cols; currentCol += 1) {
          work[row][currentCol] -= factor * work[pivotRow][currentCol];
        }
      }
      pivotCols.push(col);
      pivotRow += 1;
    }

    for (let row = 0; row < rows; row += 1) {
      const allZero = work[row].slice(0, cols).every((value) => Math.abs(value) < EPSILON);
      if (allZero && Math.abs(work[row][cols]) > EPSILON) {
        return { type: "none", solution: null };
      }
    }
    if (pivotCols.length < cols) return { type: "many", solution: null };

    const solution = Array(cols).fill(0);
    pivotCols.forEach((col, row) => {
      solution[col] = work[row][cols];
    });
    return { type: "unique", solution };
  }

  function multiplyMatrixVector(matrix, vector) {
    return matrix.map((row) => dot(row, vector));
  }

  function multiplyMatrices(a, b) {
    return a.map((row) =>
      b[0].map((_, col) => row.reduce((sum, value, index) => sum + value * b[index][col], 0)),
    );
  }

  function transpose(matrix) {
    return matrix[0].map((_, col) => matrix.map((row) => row[col]));
  }

  function identity(size) {
    return Array.from({ length: size }, (_, row) =>
      Array.from({ length: size }, (_, col) => (row === col ? 1 : 0)),
    );
  }

  function rotationAroundAxis(vector, axis, angleRadians) {
    const unit = normalizeVector(axis);
    const cos = Math.cos(angleRadians);
    const sin = Math.sin(angleRadians);
    const term1 = scaleVector(vector, cos);
    const term2 = scaleVector(cross(unit, vector), sin);
    const term3 = scaleVector(unit, dot(unit, vector) * (1 - cos));
    return addVectors(addVectors(term1, term2), term3);
  }

  function normalizeVector(vector) {
    const length = norm(vector);
    if (length < EPSILON) return vector.map((_, index) => (index === 0 ? 1 : 0));
    return vector.map((value) => value / length);
  }

  function quaternionFromAxisAngle(axis, angleRadians) {
    const unit = normalizeVector(axis);
    const half = angleRadians / 2;
    const s = Math.sin(half);
    return [Math.cos(half), unit[0] * s, unit[1] * s, unit[2] * s];
  }

  function quaternionMultiply(a, b) {
    return [
      a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
      a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
      a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
      a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
    ];
  }

  function quaternionConjugate(q) {
    return [q[0], -q[1], -q[2], -q[3]];
  }

  function rotateVectorByQuaternion(vector, axis, angleRadians) {
    const q = quaternionFromAxisAngle(axis, angleRadians);
    const p = [0, vector[0], vector[1], vector[2]];
    const rotated = quaternionMultiply(quaternionMultiply(q, p), quaternionConjugate(q));
    return rotated.slice(1);
  }

  function svgElement(name, attrs = {}, text = null) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
    if (text !== null) element.textContent = text;
    return element;
  }

  function rotate3(point, rotation) {
    const [x0, y0, z0] = point;
    const cx = Math.cos(rotation.x);
    const sx = Math.sin(rotation.x);
    const cy = Math.cos(rotation.y);
    const sy = Math.sin(rotation.y);
    const cz = Math.cos(rotation.z);
    const sz = Math.sin(rotation.z);

    let x = x0;
    let y = y0 * cx - z0 * sx;
    let z = y0 * sx + z0 * cx;

    const x2 = x * cy + z * sy;
    const z2 = -x * sy + z * cy;
    x = x2;
    z = z2;

    const x3 = x * cz - y * sz;
    const y3 = x * sz + y * cz;
    return [x3, y3, z];
  }

  function projectPoint(point, dimension, rotation) {
    if (dimension === 2) return { x: point[0], y: point[1] };
    const [x, y, z] = rotate3(point, rotation);
    return { x: x - z * 0.55, y: y - z * 0.35 };
  }

  function makeWorldPoint(values) {
    return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0];
  }

  function drawSpaceDiagram(svg, options) {
    const {
      dimension,
      rotation,
      vectors = [],
      segments = [],
      polygons = [],
      points = [],
      labels = [],
      axisExtent = 6,
      gridStep = 1,
      tickStep = 5,
    } = options;

    svg.innerHTML = "";
    const boundsPoints = [[0, 0, 0]];
    vectors.forEach((vector) => {
      boundsPoints.push(makeWorldPoint(vector.from || [0, 0, 0]));
      boundsPoints.push(makeWorldPoint(vector.to || [0, 0, 0]));
    });
    segments.forEach((segment) => {
      boundsPoints.push(makeWorldPoint(segment.from || [0, 0, 0]));
      boundsPoints.push(makeWorldPoint(segment.to || [0, 0, 0]));
    });
    polygons.forEach((polygon) => polygon.points.forEach((point) => boundsPoints.push(makeWorldPoint(point))));
    points.forEach((point) => boundsPoints.push(makeWorldPoint(point.at || [0, 0, 0])));
    labels.forEach((label) => boundsPoints.push(makeWorldPoint(label.at || [0, 0, 0])));

    const projected = boundsPoints.map((point) => projectPoint(point, dimension, rotation));
    let minX = Math.min(...projected.map((point) => point.x), -axisExtent);
    let maxX = Math.max(...projected.map((point) => point.x), axisExtent);
    let minY = Math.min(...projected.map((point) => point.y), -axisExtent);
    let maxY = Math.max(...projected.map((point) => point.y), axisExtent);
    if (maxX - minX < 2) {
      maxX += 1;
      minX -= 1;
    }
    if (maxY - minY < 2) {
      maxY += 1;
      minY -= 1;
    }

    const padding = 48;
    const scaleX = (VIEWBOX.width - padding * 2) / (maxX - minX);
    const scaleY = (VIEWBOX.height - padding * 2) / (maxY - minY);
    const scale = Math.min(scaleX, scaleY);

    function toScreen(point) {
      const projectedPoint = projectPoint(makeWorldPoint(point), dimension, rotation);
      return {
        x: padding + (projectedPoint.x - minX) * scale,
        y: VIEWBOX.height - padding - (projectedPoint.y - minY) * scale,
      };
    }

    const placedLabelRects = [];

    function overlaps(rect) {
      return placedLabelRects.some((other) => !(
        rect.x + rect.width < other.x ||
        other.x + other.width < rect.x ||
        rect.y + rect.height < other.y ||
        other.y + other.height < rect.y
      ));
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    if (dimension === 2) {
      for (let x = Math.ceil(minX / gridStep) * gridStep; x <= maxX; x += gridStep) {
        const from = toScreen([x, minY, 0]);
        const to = toScreen([x, maxY, 0]);
        svg.append(svgElement("line", { x1: from.x, y1: from.y, x2: to.x, y2: to.y, class: "diagram-grid" }));
      }
      for (let y = Math.ceil(minY / gridStep) * gridStep; y <= maxY; y += gridStep) {
        const from = toScreen([minX, y, 0]);
        const to = toScreen([maxX, y, 0]);
        svg.append(svgElement("line", { x1: from.x, y1: from.y, x2: to.x, y2: to.y, class: "diagram-grid" }));
      }
    }

    const axisVectors =
      dimension === 2
        ? [
            { from: [-axisExtent, 0, 0], to: [axisExtent, 0, 0], className: "diagram-axis", name: "x" },
            { from: [0, -axisExtent, 0], to: [0, axisExtent, 0], className: "diagram-axis", name: "y" },
          ]
        : [
            { from: [-axisExtent, 0, 0], to: [axisExtent, 0, 0], className: "diagram-axis", name: "x" },
            { from: [0, -axisExtent, 0], to: [0, axisExtent, 0], className: "diagram-axis", name: "y" },
            { from: [0, 0, -axisExtent], to: [0, 0, axisExtent], className: "diagram-axis", name: "z" },
          ];

    axisVectors.forEach((axis) => {
      const from = toScreen(axis.from);
      const to = toScreen(axis.to);
      svg.append(svgElement("line", { x1: from.x, y1: from.y, x2: to.x, y2: to.y, class: axis.className }));
      const namePoint = toScreen(axis.to);
      svg.append(svgElement("text", { x: namePoint.x + 10, y: namePoint.y - 10, class: "diagram-axis-name" }, axis.name));
    });

    if (dimension === 2) {
      for (let x = Math.ceil(minX / tickStep) * tickStep; x <= maxX; x += tickStep) {
        const center = toScreen([x, 0, 0]);
        svg.append(svgElement("line", { x1: center.x, y1: center.y - 7, x2: center.x, y2: center.y + 7, class: "diagram-tick" }));
        svg.append(svgElement("text", { x: center.x, y: center.y + 18, class: "diagram-axis-label" }, formatNumber(x)));
      }
      for (let y = Math.ceil(minY / tickStep) * tickStep; y <= maxY; y += tickStep) {
        if (Math.abs(y) < EPSILON) continue;
        const center = toScreen([0, y, 0]);
        svg.append(svgElement("line", { x1: center.x - 7, y1: center.y, x2: center.x + 7, y2: center.y, class: "diagram-tick" }));
        svg.append(svgElement("text", { x: center.x + 18, y: center.y, class: "diagram-axis-label y-label" }, formatNumber(y)));
      }
    }

    polygons.forEach((polygon) => {
      const pointsText = polygon.points.map((point) => {
        const projectedPoint = toScreen(point);
        return `${projectedPoint.x},${projectedPoint.y}`;
      }).join(" ");
      svg.append(svgElement("polygon", { points: pointsText, class: polygon.className || "diagram-surface" }));
    });

    segments.forEach((segment) => {
      const from = toScreen(segment.from);
      const to = toScreen(segment.to);
      svg.append(svgElement("line", {
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
        class: segment.className || "diagram-projection-line",
      }));
    });

    vectors.forEach((vector) => {
      const from = toScreen(vector.from);
      const to = toScreen(vector.to);
      svg.append(svgElement("line", {
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
        class: `diagram-line ${vector.className || "diagram-a"}`,
      }));
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const arrowLength = 13;
      const arrowWidth = 8;
      const arrowPoints = [
        `${to.x},${to.y}`,
        `${to.x - arrowLength * Math.cos(angle) + arrowWidth * Math.sin(angle)},${to.y - arrowLength * Math.sin(angle) - arrowWidth * Math.cos(angle)}`,
        `${to.x - arrowLength * Math.cos(angle) - arrowWidth * Math.sin(angle)},${to.y - arrowLength * Math.sin(angle) + arrowWidth * Math.cos(angle)}`,
      ].join(" ");
      svg.append(svgElement("polygon", { points: arrowPoints, class: `diagram-arrow ${vector.className || "diagram-a"}` }));
      if (vector.label) {
        const textLength = String(vector.label).length;
        const boxWidth = Math.max(34, 18 + textLength * 12);
        const boxHeight = 34;
        const base = {
          x: from.x + (to.x - from.x) * 0.68,
          y: from.y + (to.y - from.y) * 0.68,
        };
        const normal = {
          x: Math.sin(angle),
          y: -Math.cos(angle),
        };
        const tangent = {
          x: Math.cos(angle),
          y: Math.sin(angle),
        };
        const candidateOffsets = [
          { n: 24, t: 0 },
          { n: -24, t: 0 },
          { n: 34, t: 12 },
          { n: -34, t: 12 },
          { n: 34, t: -12 },
          { n: -34, t: -12 },
          { n: 18, t: 28 },
          { n: -18, t: 28 },
          { n: 18, t: -28 },
          { n: -18, t: -28 },
          { n: 42, t: 0 },
          { n: -42, t: 0 },
        ];
        let anchor = {
          x: base.x + 24 * normal.x,
          y: base.y + 24 * normal.y,
        };
        for (const offset of candidateOffsets) {
          const candidate = {
            x: base.x + normal.x * offset.n + tangent.x * offset.t,
            y: base.y + normal.y * offset.n + tangent.y * offset.t,
          };
          const rect = {
            x: candidate.x - boxWidth / 2,
            y: candidate.y - boxHeight / 2,
            width: boxWidth,
            height: boxHeight,
          };
          if (!overlaps(rect)) {
            anchor = candidate;
            placedLabelRects.push(rect);
            break;
          }
        }
        if (placedLabelRects.length === 0 || placedLabelRects[placedLabelRects.length - 1].width !== boxWidth || placedLabelRects[placedLabelRects.length - 1].height !== boxHeight) {
          placedLabelRects.push({
            x: anchor.x - boxWidth / 2,
            y: anchor.y - boxHeight / 2,
            width: boxWidth,
            height: boxHeight,
          });
        }
        anchor = {
          x: clamp(anchor.x, boxWidth / 2 + 6, VIEWBOX.width - boxWidth / 2 - 6),
          y: clamp(anchor.y, boxHeight / 2 + 6, VIEWBOX.height - boxHeight / 2 - 6),
        };
        const group = svgElement("g", { class: "diagram-label-group" });
        group.append(svgElement("rect", {
          x: anchor.x - boxWidth / 2,
          y: anchor.y - boxHeight / 2,
          width: boxWidth,
          height: boxHeight,
          rx: 10,
          class: `diagram-label-box ${vector.className || "diagram-a"}`,
        }));
        group.append(svgElement("text", { x: anchor.x, y: anchor.y + 1, class: `diagram-label ${vector.className || "diagram-a"}` }, vector.label));
        svg.append(group);
      }
    });

    points.forEach((point) => {
      const screen = toScreen(point.at);
      svg.append(svgElement("circle", { cx: screen.x, cy: screen.y, r: point.radius || 5, class: point.className || "diagram-projection-point" }));
    });

    labels.forEach((label) => {
      const screen = toScreen(label.at);
      svg.append(svgElement("text", { x: screen.x, y: screen.y, class: label.className || "diagram-angle-value" }, label.text));
    });
  }

  function attachLiveRefresh(container, callback) {
    container.querySelectorAll("input, select").forEach((element) => {
      ["input", "change", "keyup", "blur"].forEach((eventName) => element.addEventListener(eventName, callback));
    });
  }

  return {
    EPSILON,
    formatNumber,
    randomInt,
    randomNonZero,
    ensureNonZeroVector,
    parseExpressionValue,
    clearTimers,
    clearHistory,
    pushHistory,
    renderTrack,
    createVectorInputs,
    readVector,
    writeVector,
    createMatrixInputs,
    readMatrix,
    writeMatrix,
    dot,
    norm,
    addVectors,
    subtractVectors,
    scaleVector,
    cross,
    determinant2,
    determinant3,
    matrixFromColumns,
    rankOfMatrix,
    solveLinearSystem,
    multiplyMatrixVector,
    multiplyMatrices,
    transpose,
    identity,
    rotationAroundAxis,
    normalizeVector,
    quaternionFromAxisAngle,
    quaternionConjugate,
    rotateVectorByQuaternion,
    drawSpaceDiagram,
    attachLiveRefresh,
  };
})();

function initLinearIndependence() {
  const $ = (selector) => document.querySelector(selector);
  const elements = {
    dimension: $("#dimension"),
    mode: $("#mode"),
    randomize: $("#randomize"),
    animate: $("#animate"),
    message: $("#message"),
    vector1: $("#vector1"),
    vector2: $("#vector2"),
    vector3: $("#vector3"),
    panel3: $("#panel3"),
    summary: $("#summary"),
    equationDisplay: $("#equationDisplay"),
    dimensionStatus: $("#dimensionStatus"),
    modeStatus: $("#modeStatus"),
    vectorDiagram: $("#vectorDiagram"),
    viewControls: $("#viewControls"),
    rotateX: $("#rotateX"),
    rotateY: $("#rotateY"),
    rotateZ: $("#rotateZ"),
    rotateXValue: $("#rotateXValue"),
    rotateYValue: $("#rotateYValue"),
    rotateZValue: $("#rotateZValue"),
    animationTrack: $("#animationTrack"),
    formulaTitle: $("#formulaTitle"),
    formula: $("#formula"),
    historyList: $("#historyList"),
  };

  const state = { dimension: 2, timerIds: [], meta: null, resultVisible: false };

  function rotation() {
    return {
      x: (Number(elements.rotateX.value) * Math.PI) / 180,
      y: (Number(elements.rotateY.value) * Math.PI) / 180,
      z: (Number(elements.rotateZ.value) * Math.PI) / 180,
    };
  }

  function setRotationVisibility() {
    const show = state.dimension === 3;
    elements.viewControls.hidden = !show;
    [elements.rotateXValue, elements.rotateYValue, elements.rotateZValue].forEach((output, index) => {
      const values = [elements.rotateX.value, elements.rotateY.value, elements.rotateZ.value];
      output.textContent = `${values[index]}°`;
    });
  }

  function buildIndependent(dim) {
    if (dim === 2) {
      let v1 = [TopicShared.randomNonZero(), TopicShared.randomNonZero()];
      let v2 = [TopicShared.randomNonZero(), TopicShared.randomNonZero()];
      while (Math.abs(TopicShared.determinant2([[v1[0], v2[0]], [v1[1], v2[1]]])) < TopicShared.EPSILON) {
        v2 = [TopicShared.randomNonZero(), TopicShared.randomNonZero()];
      }
      return { vectors: [v1, v2], relation: null };
    }
    let vectors;
    do {
      vectors = Array.from({ length: 3 }, () => [
        TopicShared.randomNonZero(),
        TopicShared.randomNonZero(),
        TopicShared.randomNonZero(),
      ]);
    } while (
      Math.abs(TopicShared.determinant3(TopicShared.matrixFromColumns(vectors, 3))) < TopicShared.EPSILON
    );
    return { vectors, relation: null };
  }

  function buildDependent(dim) {
    if (dim === 2) {
      const base = [TopicShared.randomNonZero(), TopicShared.randomNonZero()];
      const scalar = TopicShared.randomNonZero(-3, 3);
      return { vectors: [base, TopicShared.scaleVector(base, scalar)], relation: { scalar } };
    }
    let v1 = [TopicShared.randomNonZero(), TopicShared.randomNonZero(), TopicShared.randomNonZero()];
    let v2 = [TopicShared.randomNonZero(), TopicShared.randomNonZero(), TopicShared.randomNonZero()];
    while (TopicShared.norm(TopicShared.cross(v1, v2)) < TopicShared.EPSILON) {
      v2 = [TopicShared.randomNonZero(), TopicShared.randomNonZero(), TopicShared.randomNonZero()];
    }
    const a = TopicShared.randomNonZero(-2, 2);
    const b = TopicShared.randomNonZero(-2, 2);
    const v3 = TopicShared.addVectors(TopicShared.scaleVector(v1, a), TopicShared.scaleVector(v2, b));
    return { vectors: [v1, v2, v3], relation: { a, b } };
  }

  function applyExample() {
    state.dimension = Number(elements.dimension.value);
    const mode = elements.mode.value;
    const example = mode === "independent" ? buildIndependent(state.dimension) : buildDependent(state.dimension);
    state.meta = example.relation;
    TopicShared.writeVector(elements.vector1, example.vectors[0]);
    TopicShared.writeVector(elements.vector2, example.vectors[1]);
    if (state.dimension === 3) TopicShared.writeVector(elements.vector3, example.vectors[2]);
    refreshPreview();
  }

  function readVectors() {
    const vectors = [
      TopicShared.readVector(elements.vector1, "v1"),
      TopicShared.readVector(elements.vector2, "v2"),
    ];
    if (state.dimension === 3) vectors.push(TopicShared.readVector(elements.vector3, "v3"));
    return vectors;
  }

  function analyze(vectors) {
    const matrix = TopicShared.matrixFromColumns(vectors, state.dimension);
    const determinant =
      state.dimension === 2 ? TopicShared.determinant2(matrix) : TopicShared.determinant3(matrix);
    const rank = TopicShared.rankOfMatrix(matrix);
    return {
      determinant,
      rank,
      independent: Math.abs(determinant) > TopicShared.EPSILON,
    };
  }

  function refreshPreview() {
    TopicShared.clearTimers(state);
    TopicShared.clearHistory(elements.historyList);
    elements.message.textContent = "";
    elements.panel3.hidden = state.dimension !== 3;
    elements.dimensionStatus.textContent = `${state.dimension} 次元`;
    elements.modeStatus.textContent = elements.mode.value === "independent" ? "線形独立" : "線形従属";
    setRotationVisibility();
    try {
      const vectors = readVectors();
      const analysis = analyze(vectors);
      elements.summary.textContent = analysis.independent ? "一次結合が 0 になるのは自明解だけです。" : "0 でない係数でも 0 ベクトルを作れます。";
      elements.equationDisplay.textContent =
        state.dimension === 2
          ? "c1 v1 + c2 v2 = 0, det([v1 v2]) ≠ 0 なら線形独立"
          : "c1 v1 + c2 v2 + c3 v3 = 0, det([v1 v2 v3]) ≠ 0 なら線形独立";
      elements.formulaTitle.textContent = "判定の公式";
      elements.formula.textContent =
        state.dimension === 2
          ? "2 本のベクトルを列に並べた 2 x 2 行列の行列式で判定します。"
          : "3 本のベクトルを列に並べた 3 x 3 行列の行列式で判定します。";
      TopicShared.renderTrack(elements.animationTrack, ["ベクトル配置", "一次結合", "判定", "結論"], -1);
      TopicShared.drawSpaceDiagram(elements.vectorDiagram, {
        dimension: state.dimension,
        rotation: rotation(),
        vectors: vectors.map((vector, index) => ({
          from: [0, 0, 0],
          to: vector,
          className: ["diagram-a", "diagram-b", "diagram-c"][index],
          label: `v${index + 1}`,
        })),
        axisExtent: 7,
        gridStep: 1,
        tickStep: 5,
      });
    } catch (error) {
      elements.message.textContent = error.message;
      elements.summary.textContent = "入力を確認してください。";
    }
  }

  function animate() {
    TopicShared.clearTimers(state);
    TopicShared.clearHistory(elements.historyList);
    try {
      const vectors = readVectors();
      const analysis = analyze(vectors);
      const labels = ["ベクトル配置", "一次結合", "判定", "結論"];
      const steps = [
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 0);
          elements.formulaTitle.textContent = "ベクトル配置";
          elements.formula.textContent = `${vectors.map((vector, index) => `v${index + 1} = (${vector.map((value) => TopicShared.formatNumber(value)).join(", ")})`).join(" , ")}`;
          TopicShared.pushHistory(elements.historyList, "配置", "各ベクトルを原点から伸ばして比較します。");
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 1);
          elements.formulaTitle.textContent = "一次結合";
          elements.formula.textContent =
            state.dimension === 2
              ? "c1 v1 + c2 v2 = 0 を満たす係数 c1, c2 を考えます。"
              : "c1 v1 + c2 v2 + c3 v3 = 0 を満たす係数を考えます。";
          TopicShared.pushHistory(elements.historyList, "一次結合", "0 ベクトルになる組み合わせが自明解だけかどうかを見ます。");
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 2);
          elements.formulaTitle.textContent = "判定";
          elements.formula.textContent =
            state.dimension === 2
              ? `det([v1 v2]) = ${TopicShared.formatNumber(analysis.determinant)}`
              : `det([v1 v2 v3]) = ${TopicShared.formatNumber(analysis.determinant)}`;
          TopicShared.pushHistory(
            elements.historyList,
            "判定",
            `rank = ${analysis.rank}, determinant = ${TopicShared.formatNumber(analysis.determinant)}`
          );
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 3);
          elements.formulaTitle.textContent = analysis.independent ? "線形独立" : "線形従属";
          if (analysis.independent) {
            elements.formula.textContent = "行列式が 0 でないので、0 ベクトルを作るのは c1 = c2 (= c3) = 0 だけです。";
          } else if (state.dimension === 2 && state.meta?.scalar !== undefined) {
            elements.formula.textContent = `v2 = ${TopicShared.formatNumber(state.meta.scalar)} v1 と書けるので線形従属です。`;
          } else if (state.dimension === 3 && state.meta) {
            elements.formula.textContent = `v3 = ${TopicShared.formatNumber(state.meta.a)} v1 + ${TopicShared.formatNumber(state.meta.b)} v2 と書けるので線形従属です。`;
          } else {
            elements.formula.textContent = "行列式が 0 なので、0 でない係数でも 0 ベクトルを作れます。";
          }
          TopicShared.pushHistory(elements.historyList, analysis.independent ? "結論" : "結論", elements.formula.textContent);
        },
      ];
      steps.forEach((step, index) => state.timerIds.push(window.setTimeout(step, index * 900)));
    } catch (error) {
      elements.message.textContent = error.message;
    }
  }

  TopicShared.createVectorInputs(elements.vector1, 2, "v1", [2, 1]);
  TopicShared.createVectorInputs(elements.vector2, 2, "v2", [1, 2]);
  TopicShared.createVectorInputs(elements.vector3, 3, "v3", [1, 0, 1]);
  TopicShared.attachLiveRefresh(document.body, () => {
    state.meta = null;
    refreshPreview();
  });
  elements.dimension.addEventListener("change", () => {
    state.dimension = Number(elements.dimension.value);
    TopicShared.createVectorInputs(elements.vector1, state.dimension, "v1", state.dimension === 2 ? [2, 1] : [2, 1, 0]);
    TopicShared.createVectorInputs(elements.vector2, state.dimension, "v2", state.dimension === 2 ? [1, 2] : [1, 2, 1]);
    TopicShared.createVectorInputs(elements.vector3, state.dimension, "v3", [1, 0, 1]);
    TopicShared.attachLiveRefresh(document.body, () => {
      state.meta = null;
      refreshPreview();
    });
    applyExample();
  });
  [elements.rotateX, elements.rotateY, elements.rotateZ].forEach((slider) => slider.addEventListener("input", refreshPreview));
  elements.mode.addEventListener("change", applyExample);
  elements.randomize.addEventListener("click", applyExample);
  elements.animate.addEventListener("click", animate);
  applyExample();
}

function initBasisVectors() {
  const $ = (selector) => document.querySelector(selector);
  const elements = {
    dimension: $("#dimension"),
    randomize: $("#randomize"),
    animate: $("#animate"),
    message: $("#message"),
    basis1: $("#basis1"),
    basis2: $("#basis2"),
    basis3: $("#basis3"),
    basis3Panel: $("#basis3Panel"),
    targetVector: $("#targetVector"),
    coordinateSummary: $("#coordinateSummary"),
    equationDisplay: $("#equationDisplay"),
    vectorDiagram: $("#vectorDiagram"),
    dimensionStatus: $("#dimensionStatus"),
    basisStatus: $("#basisStatus"),
    viewControls: $("#viewControls"),
    rotateX: $("#rotateX"),
    rotateY: $("#rotateY"),
    rotateZ: $("#rotateZ"),
    rotateXValue: $("#rotateXValue"),
    rotateYValue: $("#rotateYValue"),
    rotateZValue: $("#rotateZValue"),
    animationTrack: $("#animationTrack"),
    formulaTitle: $("#formulaTitle"),
    formula: $("#formula"),
    historyList: $("#historyList"),
  };
  const state = { dimension: 2, timerIds: [] };

  function rotation() {
    return {
      x: (Number(elements.rotateX.value) * Math.PI) / 180,
      y: (Number(elements.rotateY.value) * Math.PI) / 180,
      z: (Number(elements.rotateZ.value) * Math.PI) / 180,
    };
  }

  function updateViewControls() {
    const show = state.dimension === 3;
    elements.viewControls.hidden = !show;
    [elements.rotateXValue, elements.rotateYValue, elements.rotateZValue].forEach((output, index) => {
      const values = [elements.rotateX.value, elements.rotateY.value, elements.rotateZ.value];
      output.textContent = `${values[index]}°`;
    });
  }

  function randomBasis(dim) {
    const vectors = [];
    if (dim === 2) {
      let u1 = [TopicShared.randomNonZero(), TopicShared.randomNonZero()];
      let u2 = [TopicShared.randomNonZero(), TopicShared.randomNonZero()];
      while (Math.abs(TopicShared.determinant2([[u1[0], u2[0]], [u1[1], u2[1]]])) < TopicShared.EPSILON) {
        u2 = [TopicShared.randomNonZero(), TopicShared.randomNonZero()];
      }
      vectors.push(u1, u2);
    } else {
      do {
        vectors.length = 0;
        for (let index = 0; index < 3; index += 1) {
          vectors.push([TopicShared.randomNonZero(), TopicShared.randomNonZero(), TopicShared.randomNonZero()]);
        }
      } while (Math.abs(TopicShared.determinant3(TopicShared.matrixFromColumns(vectors, 3))) < TopicShared.EPSILON);
    }
    const coords = Array.from({ length: dim }, () => TopicShared.randomNonZero(-3, 3));
    const target = Array.from({ length: dim }, (_, row) => vectors.reduce((sum, vector, col) => sum + vector[row] * coords[col], 0));
    return { vectors, target, coords };
  }

  function readBasisVectors() {
    const vectors = [
      TopicShared.readVector(elements.basis1, "u1"),
      TopicShared.readVector(elements.basis2, "u2"),
    ];
    if (state.dimension === 3) vectors.push(TopicShared.readVector(elements.basis3, "u3"));
    return vectors;
  }

  function readTarget() {
    return TopicShared.readVector(elements.targetVector, "v");
  }

  function analyze() {
    const basis = readBasisVectors();
    const target = readTarget();
    const matrix = TopicShared.matrixFromColumns(basis, state.dimension);
    const solve = TopicShared.solveLinearSystem(matrix, target);
    return { basis, target, solve };
  }

  function applyExample() {
    state.dimension = Number(elements.dimension.value);
    const example = randomBasis(state.dimension);
    TopicShared.writeVector(elements.basis1, example.vectors[0]);
    TopicShared.writeVector(elements.basis2, example.vectors[1]);
    if (state.dimension === 3) TopicShared.writeVector(elements.basis3, example.vectors[2]);
    TopicShared.writeVector(elements.targetVector, example.target);
    refreshPreview();
  }

  function refreshPreview() {
    TopicShared.clearTimers(state);
    TopicShared.clearHistory(elements.historyList);
    elements.message.textContent = "";
    elements.basis3Panel.hidden = state.dimension !== 3;
    elements.dimensionStatus.textContent = `${state.dimension} 次元`;
    elements.basisStatus.textContent = "標準基底と基底";
    updateViewControls();
    try {
      const { basis, target, solve } = analyze();
      elements.equationDisplay.textContent =
        state.dimension === 2
          ? "標準基底では v = v1 e1 + v2 e2, 任意の基底では v = c1 u1 + c2 u2"
          : "標準基底では v = v1 e1 + v2 e2 + v3 e3, 任意の基底では v = c1 u1 + c2 u2 + c3 u3";
      if (solve.type === "unique") {
        elements.coordinateSummary.textContent = `この基底での座標 = (${solve.solution.map((value) => TopicShared.formatNumber(value)).join(", ")})`;
      } else {
        elements.coordinateSummary.textContent = "入力されたベクトルは基底になっていません。";
      }
      elements.formulaTitle.textContent = "基底の意味";
      elements.formula.textContent = "標準基底は各成分をそのまま読む基準です。別の基底では、同じベクトルを基底ベクトルの一次結合で表します。";
      TopicShared.renderTrack(elements.animationTrack, ["標準基底", "基底ベクトル", "座標を解く", "結論"], -1);
      TopicShared.drawSpaceDiagram(elements.vectorDiagram, {
        dimension: state.dimension,
        rotation: rotation(),
        vectors: [
          ...basis.map((vector, index) => ({
            from: [0, 0, 0],
            to: vector,
            className: ["diagram-a", "diagram-b", "diagram-c"][index],
          })),
          { from: [0, 0, 0], to: target, className: "diagram-result" },
        ],
        labels: [
          ...basis.map((vector, index) => ({
            at: vector.map((value, axis) => value * 0.72 + (axis === 1 ? 0.34 : 0.18)),
            text: `u${index + 1}`,
            className: `diagram-plain-label diagram-plain-${index === 0 ? "a" : index === 1 ? "b" : "c"}`,
          })),
          {
            at: target.map((value, axis) => value * 0.62 + (axis === 1 ? 0.36 : 0.22)),
            text: "v",
            className: "diagram-plain-label diagram-plain-result",
          },
        ],
        points: [{ at: [0, 0, 0], radius: 7, className: "diagram-origin-mask" }],
        axisExtent: 7,
        gridStep: 1,
        tickStep: 5,
      });
      elements.vectorDiagram.querySelectorAll("g.diagram-label-group").forEach((group) => group.remove());
    } catch (error) {
      elements.message.textContent = error.message;
      elements.coordinateSummary.textContent = "入力を確認してください。";
    }
  }

  function animate() {
    TopicShared.clearTimers(state);
    TopicShared.clearHistory(elements.historyList);
    try {
      const { basis, target, solve } = analyze();
      const labels = ["標準基底", "基底ベクトル", "座標を解く", "結論"];
      const standardFormula =
        state.dimension === 2
          ? `v = ${TopicShared.formatNumber(target[0])} e1 + ${TopicShared.formatNumber(target[1])} e2`
          : `v = ${TopicShared.formatNumber(target[0])} e1 + ${TopicShared.formatNumber(target[1])} e2 + ${TopicShared.formatNumber(target[2])} e3`;
      const customFormula =
        state.dimension === 2 ? "v = c1 u1 + c2 u2" : "v = c1 u1 + c2 u2 + c3 u3";
      const steps = [
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 0);
          elements.formulaTitle.textContent = "標準基底";
          elements.formula.textContent = standardFormula;
          TopicShared.pushHistory(elements.historyList, "標準基底", "標準基底ではベクトルの成分がそのまま座標です。");
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 1);
          elements.formulaTitle.textContent = "基底ベクトル";
          elements.formula.textContent = `${customFormula} とおくと、基底ベクトルの組み合わせで v を表せます。`;
          TopicShared.pushHistory(elements.historyList, "基底ベクトル", basis.map((vector, index) => `u${index + 1}=(${vector.map((value) => TopicShared.formatNumber(value)).join(", ")})`).join(" , "));
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 2);
          elements.formulaTitle.textContent = "座標を解く";
          elements.formula.textContent =
            solve.type === "unique"
              ? `基底行列 B の列を u1, u2${state.dimension === 3 ? ", u3" : ""} とすると、Bc = v を解いて c = (${solve.solution.map((value) => TopicShared.formatNumber(value)).join(", ")})`
              : "基底行列 B が正則でないので、Bc = v の解が一意に決まりません。";
          TopicShared.pushHistory(elements.historyList, "座標", solve.type === "unique" ? "基底での座標が一意に決まりました。" : "線形従属なので基底になりません。");
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 3);
          elements.formulaTitle.textContent = solve.type === "unique" ? "結論" : "基底にならない";
          elements.formula.textContent =
            solve.type === "unique"
              ? "標準基底と基底ベクトルは、同じベクトルを違うものさしで表しているだけです。"
              : "基底ベクトルには、空間を過不足なく張り、かつ線形独立であることが必要です。";
          TopicShared.pushHistory(elements.historyList, "結論", elements.formula.textContent);
        },
      ];
      steps.forEach((step, index) => state.timerIds.push(window.setTimeout(step, index * 900)));
    } catch (error) {
      elements.message.textContent = error.message;
    }
  }

  TopicShared.createVectorInputs(elements.basis1, 2, "u1", [2, 1]);
  TopicShared.createVectorInputs(elements.basis2, 2, "u2", [1, 2]);
  TopicShared.createVectorInputs(elements.basis3, 3, "u3", [1, 0, 1]);
  TopicShared.createVectorInputs(elements.targetVector, 2, "v", [5, 4]);
  TopicShared.attachLiveRefresh(document.body, refreshPreview);
  elements.dimension.addEventListener("change", () => {
    state.dimension = Number(elements.dimension.value);
    TopicShared.createVectorInputs(elements.basis1, state.dimension, "u1", state.dimension === 2 ? [2, 1] : [2, 1, 0]);
    TopicShared.createVectorInputs(elements.basis2, state.dimension, "u2", state.dimension === 2 ? [1, 2] : [1, 2, 1]);
    TopicShared.createVectorInputs(elements.basis3, state.dimension, "u3", [1, 0, 1]);
    TopicShared.createVectorInputs(elements.targetVector, state.dimension, "v", state.dimension === 2 ? [5, 4] : [5, 4, 3]);
    TopicShared.attachLiveRefresh(document.body, refreshPreview);
    applyExample();
  });
  [elements.rotateX, elements.rotateY, elements.rotateZ].forEach((slider) => slider.addEventListener("input", refreshPreview));
  elements.randomize.addEventListener("click", applyExample);
  elements.animate.addEventListener("click", animate);
  applyExample();
}

function initLinearMapMatrix() {
  const $ = (selector) => document.querySelector(selector);
  const elements = {
    dimension: $("#dimension"),
    preset: $("#preset"),
    randomize: $("#randomize"),
    animate: $("#animate"),
    message: $("#message"),
    matrixInput: $("#matrixInput"),
    vectorInput: $("#vectorInput"),
    resultSummary: $("#resultSummary"),
    equationDisplay: $("#equationDisplay"),
    vectorDiagram: $("#vectorDiagram"),
    dimensionStatus: $("#dimensionStatus"),
    presetStatus: $("#presetStatus"),
    viewControls: $("#viewControls"),
    zoomScale: $("#zoomScale"),
    zoomScaleValue: $("#zoomScaleValue"),
    rotateX: $("#rotateX"),
    rotateY: $("#rotateY"),
    rotateZ: $("#rotateZ"),
    rotateXValue: $("#rotateXValue"),
    rotateYValue: $("#rotateYValue"),
    rotateZValue: $("#rotateZValue"),
    animationTrack: $("#animationTrack"),
    formulaTitle: $("#formulaTitle"),
    formula: $("#formula"),
    historyList: $("#historyList"),
  };
  const state = { dimension: 2, timerIds: [] };

  function rotation() {
    return {
      x: (Number(elements.rotateX.value) * Math.PI) / 180,
      y: (Number(elements.rotateY.value) * Math.PI) / 180,
      z: (Number(elements.rotateZ.value) * Math.PI) / 180,
    };
  }

  function zoomFactor() {
    return Math.max(0.6, Math.min(1.8, Number(elements.zoomScale.value) / 100));
  }

  function presets(dim) {
    if (dim === 2) {
      return {
        shear: [[1, 1], [0, 1]],
        stretch: [[2, 0], [0, 1]],
        reflection: [[1, 0], [0, -1]],
        rotation: [[0, -1], [1, 0]],
      };
    }
    return {
      scale: [[2, 0, 0], [0, 1, 0], [0, 0, 1]],
      rotationz: [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
      shear: [[1, 1, 0], [0, 1, 0], [0, 0, 1]],
      projection: [[1, 0, 0], [0, 1, 0], [0, 0, 0]],
    };
  }

  function presetLabel(key) {
    const labels = {
      shear: "せん断",
      stretch: "拡大縮小",
      reflection: "鏡映",
      rotation: "回転",
      scale: "拡大縮小",
      rotationz: "z軸回転",
      projection: "xy平面への射影",
    };
    return labels[key] || key;
  }

  function sampleVector(dim, key) {
    if (dim === 2) {
      const samples = {
        shear: [2, 3],
        stretch: [1, 3],
        reflection: [3, 2],
        rotation: [3, 2],
      };
      return samples[key] || [2, 3];
    }
    const samples = {
      scale: [2, 3, 1],
      rotationz: [3, 2, 1],
      shear: [1, 3, 2],
      projection: [2, 1, 3],
    };
    return samples[key] || [2, 3, 1];
  }

  function autoAxisExtent(dim, vector, result, images, zoom) {
    const points = [
      vector,
      result,
      ...images,
      ...TopicShared.identity(dim),
    ];
    const maxAbs = Math.max(
      1,
      ...points.flatMap((entry) => entry.map((value) => Math.abs(value))),
    );
    const baseExtent = Math.max(3.5, Math.ceil(maxAbs + 1.5));
    return baseExtent / zoom;
  }

  function applyPreset() {
    state.dimension = Number(elements.dimension.value);
    const set = presets(state.dimension);
    const key = elements.preset.value;
    if (!set[key]) {
      elements.preset.value = Object.keys(set)[0];
    }
    const activeKey = elements.preset.value;
    TopicShared.writeMatrix(elements.matrixInput, state.dimension, state.dimension, set[activeKey]);
    TopicShared.writeVector(elements.vectorInput, sampleVector(state.dimension, activeKey));
    refreshPreview();
  }

  function readState() {
    const matrix = TopicShared.readMatrix(elements.matrixInput, state.dimension, state.dimension, "A");
    const vector = TopicShared.readVector(elements.vectorInput, "x");
    const result = TopicShared.multiplyMatrixVector(matrix, vector);
    const basis = TopicShared.identity(state.dimension);
    const images = basis.map((vectorValue) => TopicShared.multiplyMatrixVector(matrix, vectorValue));
    return { matrix, vector, result, images };
  }

  function refreshPreview() {
    TopicShared.clearTimers(state);
    TopicShared.clearHistory(elements.historyList);
    elements.message.textContent = "";
    elements.dimensionStatus.textContent = `${state.dimension} 次元`;
    elements.presetStatus.textContent = "表現行列";
    elements.viewControls.hidden = state.dimension !== 3;
    elements.zoomScaleValue.textContent = `${elements.zoomScale.value}%`;
    [elements.rotateXValue, elements.rotateYValue, elements.rotateZValue].forEach((output, index) => {
      const values = [elements.rotateX.value, elements.rotateY.value, elements.rotateZ.value];
      output.textContent = `${values[index]}°`;
    });
    try {
      const { vector, result, images } = readState();
      const axisExtent = autoAxisExtent(state.dimension, vector, result, images, zoomFactor());
      elements.resultSummary.textContent = `T(x) = (${result.map((value) => TopicShared.formatNumber(value)).join(", ")})`;
      elements.equationDisplay.textContent =
        state.dimension === 2
          ? "A の第 1 列と第 2 列は、それぞれ T(e1), T(e2) です。"
          : "A の各列は T(e1), T(e2), T(e3) を並べたものです。";
      elements.formulaTitle.textContent = "表現行列の公式";
      elements.formula.textContent = "標準基底に関する表現行列では、列ベクトルが基底ベクトルの像になります。";
      TopicShared.renderTrack(elements.animationTrack, ["標準基底", "像を並べる", "行列を作る", "ベクトルへ作用"], -1);
      TopicShared.drawSpaceDiagram(elements.vectorDiagram, {
        dimension: state.dimension,
        rotation: rotation(),
        vectors: [
          ...TopicShared.identity(state.dimension).map((basisVector, index) => ({
            from: [0, 0, 0],
            to: basisVector,
            className: "diagram-guide",
            label: `e${index + 1}`,
          })),
          ...images.map((image, index) => ({
            from: [0, 0, 0],
            to: image,
            className: ["diagram-a", "diagram-b", "diagram-c"][index],
            label: `T(e${index + 1})`,
          })),
          { from: [0, 0, 0], to: vector, className: "diagram-cross", label: "x" },
          { from: [0, 0, 0], to: result, className: "diagram-result", label: "T(x)" },
        ],
        axisExtent,
        gridStep: 1,
        tickStep: 5,
      });
    } catch (error) {
      elements.message.textContent = error.message;
      elements.resultSummary.textContent = "入力を確認してください。";
    }
  }

  function animate() {
    TopicShared.clearTimers(state);
    TopicShared.clearHistory(elements.historyList);
    try {
      const { matrix, vector, result, images } = readState();
      const labels = ["標準基底", "像を並べる", "行列を作る", "ベクトルへ作用"];
      const steps = [
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 0);
          elements.formulaTitle.textContent = "標準基底";
          elements.formula.textContent = `e1, e2${state.dimension === 3 ? ", e3" : ""} を基準にして写像 T を見ます。`;
          TopicShared.pushHistory(elements.historyList, "標準基底", "まず基準になる基底ベクトルを確認します。");
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 1);
          elements.formulaTitle.textContent = "像を並べる";
          elements.formula.textContent = images.map((image, index) => `T(e${index + 1}) = (${image.map((value) => TopicShared.formatNumber(value)).join(", ")})`).join(" , ");
          TopicShared.pushHistory(elements.historyList, "像", "各基底ベクトルの行き先を調べます。");
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 2);
          elements.formulaTitle.textContent = "表現行列";
          elements.formula.textContent = `A = [T(e1) ${state.dimension >= 2 ? "T(e2)" : ""}${state.dimension === 3 ? " T(e3)" : ""}]`;
          TopicShared.pushHistory(elements.historyList, "行列", matrix.map((row) => row.map((value) => TopicShared.formatNumber(value)).join(" ")).join(" / "));
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 3);
          elements.formulaTitle.textContent = "写像の適用";
          elements.formula.textContent = `T(x) = A x = (${result.map((value) => TopicShared.formatNumber(value)).join(", ")})`;
          TopicShared.pushHistory(elements.historyList, "結果", `x = (${vector.map((value) => TopicShared.formatNumber(value)).join(", ")}) を写すと T(x) になります。`);
        },
      ];
      steps.forEach((step, index) => state.timerIds.push(window.setTimeout(step, index * 900)));
    } catch (error) {
      elements.message.textContent = error.message;
    }
  }

  state.dimension = 2;
  TopicShared.createMatrixInputs(elements.matrixInput, 2, 2, "a", [[1, 1], [0, 1]]);
  TopicShared.createVectorInputs(elements.vectorInput, 2, "x", [2, 1]);
  TopicShared.attachLiveRefresh(document.body, refreshPreview);
  elements.dimension.addEventListener("change", () => {
    state.dimension = Number(elements.dimension.value);
    const set = presets(state.dimension);
    elements.preset.innerHTML = Object.keys(set)
      .map((key) => `<option value="${key}">${presetLabel(key)}</option>`)
      .join("");
    TopicShared.createMatrixInputs(elements.matrixInput, state.dimension, state.dimension, "a", set[Object.keys(set)[0]]);
    TopicShared.createVectorInputs(elements.vectorInput, state.dimension, "x", sampleVector(state.dimension, Object.keys(set)[0]));
    TopicShared.attachLiveRefresh(document.body, refreshPreview);
    applyPreset();
  });
  elements.preset.addEventListener("change", applyPreset);
  elements.zoomScale.addEventListener("input", refreshPreview);
  [elements.rotateX, elements.rotateY, elements.rotateZ].forEach((slider) => slider.addEventListener("input", refreshPreview));
  elements.randomize.addEventListener("click", applyPreset);
  elements.animate.addEventListener("click", animate);
  applyPreset();
}

function initAffineTransform() {
  const $ = (selector) => document.querySelector(selector);
  const elements = {
    dimension: $("#dimension"),
    subControls: $("#subControls"),
    randomize: $("#randomize"),
    animate: $("#animate"),
    message: $("#message"),
    rotateAngle: $("#rotateAngle"),
    rotate2DGroup: $("#rotate2DGroup"),
    rotateXYGroup: $("#rotateXYGroup"),
    rotateZGroup: $("#rotateZGroup"),
    rotateYZGroup: $("#rotateYZGroup"),
    rotateAngleX: $("#rotateAngleX"),
    rotateAngleY: $("#rotateAngleY"),
    rotateAngleZ: $("#rotateAngleZ"),
    rotateAngleUnit: $("#rotateAngleUnit"),
    scaleX: $("#scaleX"),
    scaleY: $("#scaleY"),
    scaleZControl: $("#scaleZControl"),
    scaleZ: $("#scaleZ"),
    translateX: $("#translateX"),
    translateY: $("#translateY"),
    translateZControl: $("#translateZControl"),
    translateZ: $("#translateZ"),
    pointInput: $("#pointInput"),
    resultSummary: $("#resultSummary"),
    equationDisplay: $("#equationDisplay"),
    vectorDiagram: $("#vectorDiagram"),
    dimensionStatus: $("#dimensionStatus"),
    transformStatus: $("#transformStatus"),
    viewControls: $("#viewControls"),
    rotateX: $("#rotateX"),
    rotateY: $("#rotateY"),
    rotateZ: $("#rotateZ"),
    rotateXValue: $("#rotateXValue"),
    rotateYValue: $("#rotateYValue"),
    rotateZValue: $("#rotateZValue"),
    animationTrack: $("#animationTrack"),
    formulaTitle: $("#formulaTitle"),
    formula: $("#formula"),
    historyList: $("#historyList"),
  };
  const state = { dimension: 2, timerIds: [], affineStageIndex: 3 };

  function rotation() {
    return {
      x: (Number(elements.rotateX.value) * Math.PI) / 180,
      y: (Number(elements.rotateY.value) * Math.PI) / 180,
      z: (Number(elements.rotateZ.value) * Math.PI) / 180,
    };
  }

  function syncTransformPanels() {
    const show3D = state.dimension === 3;
    elements.rotate2DGroup.hidden = show3D;
    elements.rotateXYGroup.hidden = !show3D;
    elements.rotateZGroup.hidden = !show3D;
    elements.rotateYZGroup.hidden = !show3D;
    elements.scaleZControl.hidden = !show3D;
    elements.translateZControl.hidden = !show3D;
    elements.subControls.classList.toggle("with-axis-control", show3D);
  }

  function readTransforms() {
    return {
      rotate: {
        angle: TopicShared.parseExpressionValue(elements.rotateAngle.value),
        angleX: state.dimension === 3 ? TopicShared.parseExpressionValue(elements.rotateAngleX.value) : 0,
        angleY: state.dimension === 3 ? TopicShared.parseExpressionValue(elements.rotateAngleY.value) : 0,
        angleZ: state.dimension === 3 ? TopicShared.parseExpressionValue(elements.rotateAngleZ.value) : 0,
        angleUnit: elements.rotateAngleUnit.value,
      },
      scale: {
        sx: TopicShared.parseExpressionValue(elements.scaleX.value),
        sy: TopicShared.parseExpressionValue(elements.scaleY.value),
        sz: state.dimension === 3 ? TopicShared.parseExpressionValue(elements.scaleZ.value) : 1,
      },
      translate: {
        tx: TopicShared.parseExpressionValue(elements.translateX.value),
        ty: TopicShared.parseExpressionValue(elements.translateY.value),
        tz: state.dimension === 3 ? TopicShared.parseExpressionValue(elements.translateZ.value) : 0,
      },
    };
  }

  function rotatePoint(point, params) {
    const matrix = linearRotationMatrix(params);
    return matrix.map((row) => row.reduce((sum, value, index) => sum + value * point[index], 0));
  }

  function scalePoint(point, params) {
    return [point[0] * params.sx, point[1] * params.sy, (point[2] ?? 0) * (params.sz ?? 1)];
  }

  function translatePoint(point, params) {
    return [point[0] + params.tx, point[1] + params.ty, (point[2] ?? 0) + (params.tz ?? 0)];
  }

  function pointForDisplay(point) {
    return point.slice(0, state.dimension);
  }

  function formatPoint(point) {
    return `(${pointForDisplay(point).map((value) => TopicShared.formatNumber(value)).join(", ")})`;
  }

  function affineStageFormula(index, diagramStates, applied) {
    if (index === 0) return diagramStates[0].text;
    if (index === 1) return `R(p) = ${formatPoint(applied.afterRotate)} / ${diagramStates[1].text}`;
    if (index === 2) return `S(R(p)) = ${formatPoint(applied.afterScale)} / ${diagramStates[2].text}`;
    return `T(S(R(p))) = ${formatPoint(applied.afterTranslate)} / ${diagramStates[3].text}`;
  }

  function toRadians(angle, unit) {
    return unit === "rad" ? angle : (angle * Math.PI) / 180;
  }

  function multiplyMatrices(left, right) {
    return left.map((row) => right[0].map((_, columnIndex) => row.reduce((sum, value, rowIndex) => sum + value * right[rowIndex][columnIndex], 0)));
  }

  function linearRotationMatrix(params) {
    if (state.dimension === 2) {
      const angle = toRadians(params.angle, params.angleUnit);
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      return [
        [c, -s],
        [s, c],
      ];
    }
    const angleX = toRadians(params.angleX, params.angleUnit);
    const angleY = toRadians(params.angleY, params.angleUnit);
    const angleZ = toRadians(params.angleZ, params.angleUnit);
    const cx = Math.cos(angleX);
    const sx = Math.sin(angleX);
    const cy = Math.cos(angleY);
    const sy = Math.sin(angleY);
    const cz = Math.cos(angleZ);
    const sz = Math.sin(angleZ);
    const rx = [
      [1, 0, 0],
      [0, cx, -sx],
      [0, sx, cx],
    ];
    const ry = [
      [cy, 0, sy],
      [0, 1, 0],
      [-sy, 0, cy],
    ];
    const rz = [
      [cz, -sz, 0],
      [sz, cz, 0],
      [0, 0, 1],
    ];
    return multiplyMatrices(rz, multiplyMatrices(ry, rx));
  }

  function homogeneousRotationMatrix(params) {
    const linear = linearRotationMatrix(params);
    if (state.dimension === 2) {
      return [
        [linear[0][0], linear[0][1], 0],
        [linear[1][0], linear[1][1], 0],
        [0, 0, 1],
      ];
    }
    return [
      [linear[0][0], linear[0][1], linear[0][2], 0],
      [linear[1][0], linear[1][1], linear[1][2], 0],
      [linear[2][0], linear[2][1], linear[2][2], 0],
      [0, 0, 0, 1],
    ];
  }

  function homogeneousScaleMatrix(params) {
    if (state.dimension === 2) {
      return [
        [params.sx, 0, 0],
        [0, params.sy, 0],
        [0, 0, 1],
      ];
    }
    return [
      [params.sx, 0, 0, 0],
      [0, params.sy, 0, 0],
      [0, 0, params.sz, 0],
      [0, 0, 0, 1],
    ];
  }

  function homogeneousTranslateMatrix(params) {
    if (state.dimension === 2) {
      return [
        [1, 0, params.tx],
        [0, 1, params.ty],
        [0, 0, 1],
      ];
    }
    return [
      [1, 0, 0, params.tx],
      [0, 1, 0, params.ty],
      [0, 0, 1, params.tz],
      [0, 0, 0, 1],
    ];
  }

  function sourceAngleLabel(source, unit) {
    const trimmed = String(source || "").trim() || "0";
    const normalized = trimmed.replace(/PI/g, "π").replace(/pi/g, "π");
    return unit === "rad" ? normalized : `${normalized}°`;
  }

  function compositeTransformMatrix(transforms) {
    return multiplyMatrices(
      homogeneousTranslateMatrix(transforms.translate),
      multiplyMatrices(homogeneousScaleMatrix(transforms.scale), homogeneousRotationMatrix(transforms.rotate)),
    );
  }

  function renderMathMatrix(matrix, formatter = (value) => TopicShared.formatNumber(value)) {
    const columns = matrix[0]?.length ?? 1;
    return `<div class="math-matrix" style="grid-template-columns: repeat(${columns}, auto);">${matrix
      .flat()
      .map((value) => `<span class="math-matrix-cell">${formatter(value)}</span>`)
      .join("")}</div>`;
  }

  function normalizedSymbol(source) {
    const trimmed = String(source || "").trim();
    if (!trimmed) return "0";
    return trimmed.replace(/PI/g, "π").replace(/pi/g, "π");
  }

  function exactTrigStrings(angle, unit, label) {
    const radians = toRadians(angle, unit);
    const fullTurn = Math.PI * 2;
    let normalized = ((radians % fullTurn) + fullTurn) % fullTurn;
    if (Math.abs(normalized - fullTurn) < TopicShared.EPSILON) normalized = 0;
    const exactTable = [
      { radians: 0, cos: "1", sin: "0" },
      { radians: Math.PI / 6, cos: "√3/2", sin: "1/2" },
      { radians: Math.PI / 4, cos: "√2/2", sin: "√2/2" },
      { radians: Math.PI / 3, cos: "1/2", sin: "√3/2" },
      { radians: Math.PI / 2, cos: "0", sin: "1" },
      { radians: (2 * Math.PI) / 3, cos: "-1/2", sin: "√3/2" },
      { radians: (3 * Math.PI) / 4, cos: "-√2/2", sin: "√2/2" },
      { radians: (5 * Math.PI) / 6, cos: "-√3/2", sin: "1/2" },
      { radians: Math.PI, cos: "-1", sin: "0" },
      { radians: (7 * Math.PI) / 6, cos: "-√3/2", sin: "-1/2" },
      { radians: (5 * Math.PI) / 4, cos: "-√2/2", sin: "-√2/2" },
      { radians: (4 * Math.PI) / 3, cos: "-1/2", sin: "-√3/2" },
      { radians: (3 * Math.PI) / 2, cos: "0", sin: "-1" },
      { radians: (5 * Math.PI) / 3, cos: "1/2", sin: "-√3/2" },
      { radians: (7 * Math.PI) / 4, cos: "√2/2", sin: "-√2/2" },
      { radians: (11 * Math.PI) / 6, cos: "√3/2", sin: "-1/2" },
    ];
    const exact = exactTable.find((entry) => Math.abs(entry.radians - normalized) < 1e-8);
    if (exact) return exact;
    return {
      cos: `cos(${label})`,
      sin: `sin(${label})`,
    };
  }

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y !== 0) {
      const next = x % y;
      x = y;
      y = next;
    }
    return x || 1;
  }

  function normalizeFraction(numerator, denominator) {
    if (denominator === 0) throw new Error("分母が 0 です。");
    if (numerator === 0) return { numerator: 0, denominator: 1 };
    const sign = denominator < 0 ? -1 : 1;
    const divisor = gcd(numerator, denominator);
    return {
      numerator: sign * numerator / divisor,
      denominator: Math.abs(denominator) / divisor,
    };
  }

  function decimalToFraction(value) {
    if (Number.isInteger(value)) return { numerator: value, denominator: 1 };
    const source = String(value);
    const decimals = source.includes(".") ? source.split(".")[1].length : 0;
    const denominator = 10 ** decimals;
    const numerator = Math.round(value * denominator);
    return normalizeFraction(numerator, denominator);
  }

  function multiplyFractions(left, right) {
    return normalizeFraction(left.numerator * right.numerator, left.denominator * right.denominator);
  }

  function addFractions(left, right) {
    return normalizeFraction(
      left.numerator * right.denominator + right.numerator * left.denominator,
      left.denominator * right.denominator,
    );
  }

  function negateSymbol(symbol) {
    if (symbol === "0") return "0";
    if (symbol.startsWith("-")) return symbol.slice(1);
    return `-${symbol}`;
  }

  function parseAtomicFactor(source) {
    const factor = source.trim();
    if (!factor || factor === "1") return { coefficient: { numerator: 1, denominator: 1 }, factors: [] };
    if (factor === "-1") return { coefficient: { numerator: -1, denominator: 1 }, factors: [] };
    if (/^-?\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?$/.test(factor)) {
      if (factor.includes("/")) {
        const [left, right] = factor.split("/");
        const numeratorFraction = decimalToFraction(Number(left));
        const denominatorFraction = decimalToFraction(Number(right));
        return {
          coefficient: normalizeFraction(
            numeratorFraction.numerator * denominatorFraction.denominator,
            numeratorFraction.denominator * denominatorFraction.numerator,
          ),
          factors: [],
        };
      }
      return { coefficient: decimalToFraction(Number(factor)), factors: [] };
    }
    const sqrtMatch = factor.match(/^(-)?√(\d+)(?:\/(\d+))?$/);
    if (sqrtMatch) {
      const sign = sqrtMatch[1] ? -1 : 1;
      const radicand = Number(sqrtMatch[2]);
      const denominator = sqrtMatch[3] ? Number(sqrtMatch[3]) : 1;
      const root = Math.sqrt(radicand);
      if (Number.isInteger(root)) {
        return { coefficient: normalizeFraction(sign * root, denominator), factors: [] };
      }
      return {
        coefficient: normalizeFraction(sign, denominator),
        factors: [`√${radicand}`],
      };
    }
    return { coefficient: { numerator: 1, denominator: 1 }, factors: [factor] };
  }

  function makeMonomial(source) {
    const trimmed = String(source || "").trim();
    if (!trimmed || trimmed === "0") return [];
    const pieces = trimmed.split("·").map((piece) => piece.trim()).filter(Boolean);
    let coefficient = { numerator: 1, denominator: 1 };
    const factors = [];
    pieces.forEach((piece) => {
      const parsed = parseAtomicFactor(piece);
      coefficient = multiplyFractions(coefficient, parsed.coefficient);
      factors.push(...parsed.factors);
    });
    if (coefficient.numerator === 0) return [];
    return [{ coefficient, factors: factors.sort() }];
  }

  function normalizeExpression(expression) {
    const combined = new Map();
    expression.forEach((term) => {
      if (!term || term.coefficient.numerator === 0) return;
      const key = term.factors.join("·");
      const current = combined.get(key) ?? { coefficient: { numerator: 0, denominator: 1 }, factors: term.factors.slice() };
      current.coefficient = addFractions(current.coefficient, term.coefficient);
      combined.set(key, current);
    });
    return Array.from(combined.values()).filter((term) => term.coefficient.numerator !== 0);
  }

  function addExpressions(expressions) {
    return normalizeExpression(expressions.flat());
  }

  function multiplyExpressions(left, right) {
    const result = [];
    left.forEach((leftTerm) => {
      right.forEach((rightTerm) => {
        result.push({
          coefficient: multiplyFractions(leftTerm.coefficient, rightTerm.coefficient),
          factors: leftTerm.factors.concat(rightTerm.factors).sort(),
        });
      });
    });
    return normalizeExpression(result);
  }

  function multiplySymbolicMatrices(left, right) {
    return left.map((row) =>
      right[0].map((_, columnIndex) =>
        addExpressions(row.map((value, rowIndex) => multiplyExpressions(value, right[rowIndex][columnIndex]))),
      ),
    );
  }

  function formatFraction(value) {
    const numerator = Math.abs(value.numerator);
    return value.denominator === 1 ? String(numerator) : `${numerator}/${value.denominator}`;
  }

  function renderExpression(expression) {
    const normalized = normalizeExpression(expression);
    if (normalized.length === 0) return "0";
    return normalized.reduce((parts, term, index) => {
      const sign = term.coefficient.numerator < 0 ? "-" : "+";
      const magnitude = formatFraction(term.coefficient);
      const factorText = term.factors.join("·");
      let body = "";
      if (!factorText) {
        body = magnitude;
      } else if (magnitude === "1") {
        body = factorText;
      } else {
        body = `${magnitude}·${factorText}`;
      }
      if (index === 0) return sign === "-" ? `-${body}` : body;
      return `${parts} ${sign} ${body}`;
    }, "");
  }

  function symbolicScaleMatrix(transforms) {
    const sx = normalizedSymbol(elements.scaleX.value);
    const sy = normalizedSymbol(elements.scaleY.value);
    if (state.dimension === 2) {
      return [
        [sx, "0", "0"],
        ["0", sy, "0"],
        ["0", "0", "1"],
      ];
    }
    const sz = normalizedSymbol(elements.scaleZ.value);
    return [
      [sx, "0", "0", "0"],
      ["0", sy, "0", "0"],
      ["0", "0", sz, "0"],
      ["0", "0", "0", "1"],
    ];
  }

  function symbolicTranslateMatrix(transforms) {
    const tx = normalizedSymbol(elements.translateX.value);
    const ty = normalizedSymbol(elements.translateY.value);
    if (state.dimension === 2) {
      return [
        ["1", "0", tx],
        ["0", "1", ty],
        ["0", "0", "1"],
      ];
    }
    const tz = normalizedSymbol(elements.translateZ.value);
    return [
      ["1", "0", "0", tx],
      ["0", "1", "0", ty],
      ["0", "0", "1", tz],
      ["0", "0", "0", "1"],
    ];
  }

  function symbolicRotationMatrices(transforms) {
    if (state.dimension === 2) {
      const theta = sourceAngleLabel(elements.rotateAngle.value, transforms.rotate.angleUnit);
      const trig = exactTrigStrings(transforms.rotate.angle, transforms.rotate.angleUnit, theta);
      return [{
        label: "R",
        note: `θ = ${theta}`,
        matrix: [
          [trig.cos, negateSymbol(trig.sin), "0"],
          [trig.sin, trig.cos, "0"],
          ["0", "0", "1"],
        ],
      }];
    }

    const ax = sourceAngleLabel(elements.rotateAngleX.value, transforms.rotate.angleUnit);
    const ay = sourceAngleLabel(elements.rotateAngleY.value, transforms.rotate.angleUnit);
    const az = sourceAngleLabel(elements.rotateAngleZ.value, transforms.rotate.angleUnit);
    const trigX = exactTrigStrings(transforms.rotate.angleX, transforms.rotate.angleUnit, ax);
    const trigY = exactTrigStrings(transforms.rotate.angleY, transforms.rotate.angleUnit, ay);
    const trigZ = exactTrigStrings(transforms.rotate.angleZ, transforms.rotate.angleUnit, az);
    const rz = [
      [trigZ.cos, negateSymbol(trigZ.sin), "0", "0"],
      [trigZ.sin, trigZ.cos, "0", "0"],
      ["0", "0", "1", "0"],
      ["0", "0", "0", "1"],
    ];
    const ry = [
      [trigY.cos, "0", trigY.sin, "0"],
      ["0", "1", "0", "0"],
      [negateSymbol(trigY.sin), "0", trigY.cos, "0"],
      ["0", "0", "0", "1"],
    ];
    const rx = [
      ["1", "0", "0", "0"],
      ["0", trigX.cos, negateSymbol(trigX.sin), "0"],
      ["0", trigX.sin, trigX.cos, "0"],
      ["0", "0", "0", "1"],
    ];
    const combined = multiplySymbolicMatrices(
      rz.map((row) => row.map((value) => makeMonomial(value))),
      multiplySymbolicMatrices(
        ry.map((row) => row.map((value) => makeMonomial(value))),
        rx.map((row) => row.map((value) => makeMonomial(value))),
      ),
    ).map((row) => row.map((expression) => renderExpression(expression)));
    return [{
      label: "Rxyz",
      note: `θx = ${ax}, θy = ${ay}, θz = ${az}`,
      matrix: combined,
    }];
  }

  function renderTransformMatrices(transforms) {
    const translateMatrix = symbolicTranslateMatrix(transforms);
    const scaleMatrix = symbolicScaleMatrix(transforms);
    const rotationMatrices = symbolicRotationMatrices(transforms);
    const numericComposite = compositeTransformMatrix(transforms);
    const symbolicComposite = [translateMatrix, scaleMatrix, ...rotationMatrices.map((entry) => entry.matrix)]
      .map((matrix) => matrix.map((row) => row.map((value) => makeMonomial(value))))
      .reduce((current, matrix) => multiplySymbolicMatrices(current, matrix));
    return `
      <div class="transform-matrix-display">
        <div class="transform-matrix-chain">
          <div class="math-matrix-term">
            <span class="math-matrix-label">T</span>
            ${renderMathMatrix(translateMatrix, String)}
          </div>
          <span class="math-operator">×</span>
          <div class="math-matrix-term">
            <span class="math-matrix-label">S</span>
            ${renderMathMatrix(scaleMatrix, String)}
          </div>
          ${rotationMatrices.map((entry) => `
            <span class="math-operator">×</span>
            <div class="math-matrix-term">
              <span class="math-matrix-label">${entry.label}</span>
              <span class="math-matrix-note">${entry.note}</span>
              ${renderMathMatrix(entry.matrix, String)}
            </div>
          `).join("")}
          <span class="math-operator">=</span>
          <div class="math-matrix-term">
            <span class="math-matrix-label">M</span>
            <span class="math-matrix-note">合成変換行列</span>
            ${renderMathMatrix(symbolicComposite, renderExpression)}
          </div>
        </div>
        <div class="transform-matrix-numeric">
          <span class="math-matrix-label">数値結果</span>
          ${renderMathMatrix(numericComposite)}
        </div>
      </div>
    `;
  }

  function applyTransformSequence(point, transforms) {
    const afterRotate = rotatePoint(point, transforms.rotate);
    const afterScale = scalePoint(afterRotate, transforms.scale);
    const afterTranslate = translatePoint(afterScale, transforms.translate);
    return {
      afterRotate,
      afterScale,
      afterTranslate,
    };
  }

  function sampleShape(dimension) {
    if (dimension === 2) {
      const points = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ];
      const edges = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
      ];
      return { points, edges, faces: [points] };
    }

    const points = [
      [-1, -1, -1],
      [1, -1, -1],
      [1, 1, -1],
      [-1, 1, -1],
      [-1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1],
    ];
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];
    const faces = [
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [0, 1, 5, 4],
      [1, 2, 6, 5],
      [2, 3, 7, 6],
      [3, 0, 4, 7],
    ].map((face) => face.map((index) => points[index]));
    return { points, edges, faces };
  }

  function shapeWithPoints(points, edges, faces) {
    return { points, edges, faces };
  }

  function transformShape(shape, transforms) {
    const pointsAfterRotate = shape.points.map((point) => rotatePoint(point, transforms.rotate));
    const pointsAfterScale = pointsAfterRotate.map((point) => scalePoint(point, transforms.scale));
    const pointsAfterTranslate = pointsAfterScale.map((point) => translatePoint(point, transforms.translate));
    const facesAfterRotate = shape.faces.map((face) => face.map((point) => rotatePoint(point, transforms.rotate)));
    const facesAfterScale = facesAfterRotate.map((face) => face.map((point) => scalePoint(point, transforms.scale)));
    const facesAfterTranslate = facesAfterScale.map((face) => face.map((point) => translatePoint(point, transforms.translate)));
    return {
      rotate: shapeWithPoints(pointsAfterRotate, shape.edges, facesAfterRotate),
      scale: shapeWithPoints(pointsAfterScale, shape.edges, facesAfterScale),
      translate: shapeWithPoints(pointsAfterTranslate, shape.edges, facesAfterTranslate),
    };
  }

  function shapeSegments(shape, className) {
    return shape.edges.map(([fromIndex, toIndex]) => ({
      from: shape.points[fromIndex],
      to: shape.points[toIndex],
      className,
    }));
  }

  function readShape() {
    return TopicShared.readVector(elements.pointInput, "p");
  }

  function buildAffineDiagramStates(point, transforms, applied, sample, transformedSample) {
    return [
      { point, shape: sample, title: "元の図形", text: state.dimension === 2 ? "正方形と点 p の初期状態です。" : "立方体と点 p の初期状態です。" },
      {
        point: applied.afterRotate,
        shape: transformedSample.rotate,
        title: "回転後",
        text: state.dimension === 2
          ? `回転角 = ${TopicShared.formatNumber(transforms.rotate.angle)} ${transforms.rotate.angleUnit === "rad" ? "rad" : "°"}`
          : `回転角 = (${TopicShared.formatNumber(transforms.rotate.angleX)}, ${TopicShared.formatNumber(transforms.rotate.angleY)}, ${TopicShared.formatNumber(transforms.rotate.angleZ)}) ${transforms.rotate.angleUnit === "rad" ? "rad" : "°"} [x → y → z]`,
      },
      {
        point: applied.afterScale,
        shape: transformedSample.scale,
        title: "拡大縮小後",
        text: `倍率 = (${TopicShared.formatNumber(transforms.scale.sx)}, ${TopicShared.formatNumber(transforms.scale.sy)}${state.dimension === 3 ? `, ${TopicShared.formatNumber(transforms.scale.sz)}` : ""})`,
      },
      {
        point: applied.afterTranslate,
        shape: transformedSample.translate,
        title: "平行移動後",
        text: `移動量 = (${TopicShared.formatNumber(transforms.translate.tx)}, ${TopicShared.formatNumber(transforms.translate.ty)}${state.dimension === 3 ? `, ${TopicShared.formatNumber(transforms.translate.tz)}` : ""})`,
      },
    ];
  }

  function renderAffineDiagramState(originPoint, current, sample, labels, diagramStates, applied) {
    TopicShared.drawSpaceDiagram(elements.vectorDiagram, {
      dimension: state.dimension,
      rotation: rotation(),
      vectors: [
        { from: [0, 0, 0], to: originPoint, className: "diagram-cross" },
        { from: [0, 0, 0], to: current.point, className: "diagram-result" },
      ],
      polygons: [
        ...sample.faces.map((face) => ({ points: face, className: "diagram-guide-surface" })),
        ...current.shape.faces.map((face) => ({ points: face, className: "diagram-surface" })),
      ],
      segments: [
        ...shapeSegments(sample, "diagram-guide-line"),
        ...shapeSegments(current.shape, "diagram-result-line"),
      ],
      axisExtent: 8,
      gridStep: 1,
      tickStep: 5,
    });
    TopicShared.renderTrack(elements.animationTrack, labels, state.affineStageIndex, (index) => {
      TopicShared.clearTimers(state);
      state.affineStageIndex = index;
      renderAffineDiagramState(originPoint, diagramStates[index], sample, labels, diagramStates, applied);
    });
    elements.formulaTitle.textContent = current.title;
    elements.formula.textContent = affineStageFormula(state.affineStageIndex, diagramStates, applied);
  }

  function refreshPreview() {
    TopicShared.clearTimers(state);
    TopicShared.clearHistory(elements.historyList);
    elements.message.textContent = "";
    state.dimension = Number(elements.dimension.value);
    syncTransformPanels();
    elements.viewControls.hidden = state.dimension !== 3;
    [elements.rotateXValue, elements.rotateYValue, elements.rotateZValue].forEach((output, index) => {
      const values = [elements.rotateX.value, elements.rotateY.value, elements.rotateZ.value];
      output.textContent = `${values[index]}°`;
    });
    elements.dimensionStatus.textContent = `${state.dimension} 次元`;
    elements.transformStatus.textContent = "回転 → 拡大縮小 → 平行移動";
    try {
      const point = readShape();
      const transforms = readTransforms();
      const applied = applyTransformSequence(point, transforms);
      elements.resultSummary.textContent = `最終像 = ${formatPoint(applied.afterTranslate)}`;
      elements.equationDisplay.innerHTML = renderTransformMatrices(transforms);
      elements.formulaTitle.textContent = "変換の考え方";
      elements.formula.textContent = state.dimension === 2
        ? "回転・拡大縮小・平行移動は、同次座標ではそれぞれ行列として表せます。"
        : "3D 回転は x → y → z の順に回転を合成した 1 個の回転行列で表しています。";
      const sample = sampleShape(state.dimension);
      const transformedSample = transformShape(sample, transforms);
      const labels = ["元の図形", "回転後", "拡大縮小後", "平行移動後"];
      const diagramStates = buildAffineDiagramStates(point, transforms, applied, sample, transformedSample);
      if (state.affineStageIndex < 0 || state.affineStageIndex >= diagramStates.length) state.affineStageIndex = 3;
      renderAffineDiagramState(point, diagramStates[state.affineStageIndex], sample, labels, diagramStates, applied);
    } catch (error) {
      elements.message.textContent = error.message;
      elements.resultSummary.textContent = "入力を確認してください。";
    }
  }

  function randomize() {
    TopicShared.writeVector(
      elements.pointInput,
      state.dimension === 2
        ? [TopicShared.randomNonZero(), TopicShared.randomNonZero()]
        : [TopicShared.randomNonZero(), TopicShared.randomNonZero(), TopicShared.randomNonZero()],
    );
    elements.rotateAngle.value = String(TopicShared.randomInt(15, 165));
    if (state.dimension === 3) {
      elements.rotateAngleX.value = String(TopicShared.randomInt(-120, 120));
      elements.rotateAngleY.value = String(TopicShared.randomInt(-120, 120));
      elements.rotateAngleZ.value = String(TopicShared.randomInt(-120, 120));
    }
    elements.rotateAngleUnit.value = "deg";
    elements.scaleX.value = String(TopicShared.randomNonZero(1, 3));
    elements.scaleY.value = String(TopicShared.randomInt(0, 1) === 0 ? 0.5 : TopicShared.randomNonZero(1, 3));
    if (state.dimension === 3) elements.scaleZ.value = String(TopicShared.randomNonZero(1, 3));
    elements.translateX.value = String(TopicShared.randomInt(-3, 3));
    elements.translateY.value = String(TopicShared.randomInt(-3, 3));
    if (state.dimension === 3) elements.translateZ.value = String(TopicShared.randomInt(-3, 3));
    refreshPreview();
  }

  function animate() {
    TopicShared.clearTimers(state);
    TopicShared.clearHistory(elements.historyList);
    try {
      const point = readShape();
      const transforms = readTransforms();
      const applied = applyTransformSequence(point, transforms);
      const sample = sampleShape(state.dimension);
      const transformedSample = transformShape(sample, transforms);
      const labels = ["元の図形", "回転後", "拡大縮小後", "平行移動後"];
      const diagramStates = buildAffineDiagramStates(point, transforms, applied, sample, transformedSample);

      const steps = [
        () => {
          state.affineStageIndex = 0;
          renderAffineDiagramState(point, diagramStates[0], sample, labels, diagramStates, applied);
          TopicShared.pushHistory(elements.historyList, "元の図形", diagramStates[0].text);
        },
        () => {
          state.affineStageIndex = 1;
          renderAffineDiagramState(point, diagramStates[1], sample, labels, diagramStates, applied);
          TopicShared.pushHistory(elements.historyList, "回転", elements.formula.textContent);
        },
        () => {
          state.affineStageIndex = 2;
          renderAffineDiagramState(point, diagramStates[2], sample, labels, diagramStates, applied);
          TopicShared.pushHistory(elements.historyList, "拡大縮小", elements.formula.textContent);
        },
        () => {
          state.affineStageIndex = 3;
          renderAffineDiagramState(point, diagramStates[3], sample, labels, diagramStates, applied);
          TopicShared.pushHistory(elements.historyList, "平行移動", elements.formula.textContent);
        },
      ];
      steps.forEach((step, index) => state.timerIds.push(window.setTimeout(step, index * 900)));
    } catch (error) {
      elements.message.textContent = error.message;
    }
  }

  TopicShared.createVectorInputs(elements.pointInput, 2, "p", [2, 1]);
  syncTransformPanels();
  TopicShared.attachLiveRefresh(document.body, refreshPreview);
  elements.dimension.addEventListener("change", () => {
    state.dimension = Number(elements.dimension.value);
    TopicShared.createVectorInputs(elements.pointInput, state.dimension, "p", state.dimension === 2 ? [2, 1] : [2, 1, 1]);
    syncTransformPanels();
    TopicShared.attachLiveRefresh(document.body, refreshPreview);
    refreshPreview();
  });
  [elements.rotateX, elements.rotateY, elements.rotateZ].forEach((control) => control.addEventListener("input", refreshPreview));
  elements.randomize.addEventListener("click", randomize);
  elements.animate.addEventListener("click", animate);
  refreshPreview();
}

function initHomogeneousCoordinates() {
  const $ = (selector) => document.querySelector(selector);
  const elements = {
    dimension: $("#dimension"),
    mode: $("#mode"),
    randomize: $("#randomize"),
    animate: $("#animate"),
    message: $("#message"),
    pointInput: $("#pointInput"),
    matrixInput: $("#matrixInput"),
    resultSummary: $("#resultSummary"),
    equationDisplay: $("#equationDisplay"),
    vectorDiagram: $("#vectorDiagram"),
    dimensionStatus: $("#dimensionStatus"),
    modeStatus: $("#modeStatus"),
    viewControls: $("#viewControls"),
    rotateX: $("#rotateX"),
    rotateY: $("#rotateY"),
    rotateZ: $("#rotateZ"),
    rotateXValue: $("#rotateXValue"),
    rotateYValue: $("#rotateYValue"),
    rotateZValue: $("#rotateZValue"),
    animationTrack: $("#animationTrack"),
    formulaTitle: $("#formulaTitle"),
    formula: $("#formula"),
    historyList: $("#historyList"),
  };
  const state = { dimension: 2, timerIds: [] };

  function rotation() {
    return {
      x: (Number(elements.rotateX.value) * Math.PI) / 180,
      y: (Number(elements.rotateY.value) * Math.PI) / 180,
      z: (Number(elements.rotateZ.value) * Math.PI) / 180,
    };
  }

  function defaultMatrix(dim, mode) {
    if (dim === 2) {
      return mode === "translate"
        ? [[1, 0, 3], [0, 1, -2], [0, 0, 1]]
        : [[0, -1, 2], [1, 0, 1], [0, 0, 1]];
    }
    return mode === "translate"
      ? [[1, 0, 0, 2], [0, 1, 0, -1], [0, 0, 1, 3], [0, 0, 0, 1]]
      : [[0, -1, 0, 1], [1, 0, 0, 2], [0, 0, 1, 1], [0, 0, 0, 1]];
  }

  function readState() {
    const point = TopicShared.readVector(elements.pointInput, "p");
    const size = state.dimension + 1;
    const matrix = TopicShared.readMatrix(elements.matrixInput, size, size, "H");
    const homogeneous = point.concat(1);
    const resultH = TopicShared.multiplyMatrixVector(matrix, homogeneous);
    const pointResult = resultH.slice(0, state.dimension).map((value) => value / resultH[state.dimension]);
    return { point, homogeneous, matrix, resultH, pointResult };
  }

  function refreshPreview() {
    TopicShared.clearTimers(state);
    TopicShared.clearHistory(elements.historyList);
    elements.message.textContent = "";
    state.dimension = Number(elements.dimension.value);
    const size = state.dimension + 1;
    elements.viewControls.hidden = state.dimension !== 3;
    [elements.rotateXValue, elements.rotateYValue, elements.rotateZValue].forEach((output, index) => {
      const values = [elements.rotateX.value, elements.rotateY.value, elements.rotateZ.value];
      output.textContent = `${values[index]}°`;
    });
    elements.dimensionStatus.textContent = `${state.dimension} 次元`;
    elements.modeStatus.textContent = elements.mode.selectedOptions[0].textContent;
    try {
      const { point, homogeneous, resultH, pointResult } = readState();
      elements.resultSummary.textContent = `同次座標 = (${resultH.map((value) => TopicShared.formatNumber(value)).join(", ")}) → (${pointResult.map((value) => TopicShared.formatNumber(value)).join(", ")})`;
      elements.equationDisplay.textContent =
        state.dimension === 2
          ? "[x y 1]^T にすると、平行移動も 3 x 3 行列で扱えます。"
          : "[x y z 1]^T にすると、3D の平行移動と回転を 4 x 4 行列にまとめられます。";
      elements.formulaTitle.textContent = "同次座標";
      elements.formula.textContent = "グラフィックスでは、平行移動・回転・拡大縮小を同じ行列積にのせるために最後に 1 を足します。";
      TopicShared.renderTrack(elements.animationTrack, ["1 を足す", "行列をかける", "w で読む", "グラフィックスで使う"], -1);
      TopicShared.drawSpaceDiagram(elements.vectorDiagram, {
        dimension: state.dimension,
        rotation: rotation(),
        vectors: [
          { from: [0, 0, 0], to: point, className: "diagram-cross", label: "p" },
          { from: [0, 0, 0], to: pointResult, className: "diagram-result", label: "H p" },
        ],
        axisExtent: 8,
        gridStep: 1,
        tickStep: 5,
      });
    } catch (error) {
      elements.message.textContent = error.message;
      elements.resultSummary.textContent = "入力を確認してください。";
    }
  }

  function animate() {
    TopicShared.clearTimers(state);
    TopicShared.clearHistory(elements.historyList);
    try {
      const { point, homogeneous, resultH, pointResult } = readState();
      const labels = ["1 を足す", "行列をかける", "w で読む", "グラフィックスで使う"];
      const steps = [
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 0);
          elements.formulaTitle.textContent = "同次化";
          elements.formula.textContent = `p = (${point.map((value) => TopicShared.formatNumber(value)).join(", ")}) → p~ = (${homogeneous.map((value) => TopicShared.formatNumber(value)).join(", ")})`;
          TopicShared.pushHistory(elements.historyList, "同次化", "最後に 1 を足して、平行移動も行列に入れます。");
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 1);
          elements.formulaTitle.textContent = "行列積";
          elements.formula.textContent = `H p~ = (${resultH.map((value) => TopicShared.formatNumber(value)).join(", ")})`;
          TopicShared.pushHistory(elements.historyList, "行列積", "1 本の行列積で変換をまとめて計算します。");
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 2);
          elements.formulaTitle.textContent = "通常座標へ戻す";
          elements.formula.textContent = `最後の成分 w = ${TopicShared.formatNumber(resultH[state.dimension])} を使って (${pointResult.map((value) => TopicShared.formatNumber(value)).join(", ")}) と読みます。`;
          TopicShared.pushHistory(elements.historyList, "読み戻し", "アフィン変換では通常 w = 1 のままです。");
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 3);
          elements.formulaTitle.textContent = "グラフィックス";
          elements.formula.textContent = "モデル変換・ビュー変換・射影変換を同じ 4 x 4 行列積でつなげるため、同次座標が使われます。";
          TopicShared.pushHistory(elements.historyList, "用途", "グラフィックスでは変換の合成を効率よく行えます。");
        },
      ];
      steps.forEach((step, index) => state.timerIds.push(window.setTimeout(step, index * 900)));
    } catch (error) {
      elements.message.textContent = error.message;
    }
  }

  function resetInputs() {
    state.dimension = Number(elements.dimension.value);
    TopicShared.createVectorInputs(elements.pointInput, state.dimension, "p", state.dimension === 2 ? [2, 1] : [2, 1, 3]);
    TopicShared.createMatrixInputs(elements.matrixInput, state.dimension + 1, state.dimension + 1, "h", defaultMatrix(state.dimension, elements.mode.value));
  }

  TopicShared.attachLiveRefresh(document.body, refreshPreview);
  elements.dimension.addEventListener("change", () => {
    resetInputs();
    TopicShared.attachLiveRefresh(document.body, refreshPreview);
    refreshPreview();
  });
  elements.mode.addEventListener("change", () => {
    TopicShared.writeMatrix(elements.matrixInput, state.dimension + 1, state.dimension + 1, defaultMatrix(state.dimension, elements.mode.value));
    refreshPreview();
  });
  [elements.rotateX, elements.rotateY, elements.rotateZ].forEach((slider) => slider.addEventListener("input", refreshPreview));
  elements.randomize.addEventListener("click", () => {
    resetInputs();
    refreshPreview();
  });
  elements.animate.addEventListener("click", animate);
  resetInputs();
  refreshPreview();
}

function initLinearShapeTransform() {
  const $ = (selector) => document.querySelector(selector);
  const elements = {
    dimension: $("#dimension"),
    symmetryPreset: $("#symmetryPreset"),
    randomize: $("#randomize"),
    animate: $("#animate"),
    message: $("#message"),
    shapeSummary: $("#shapeSummary"),
    transformSummary: $("#transformSummary"),
    resultSummary: $("#resultSummary"),
    equationDisplay: $("#equationDisplay"),
    vectorDiagram: $("#vectorDiagram"),
    dimensionStatus: $("#dimensionStatus"),
    presetStatus: $("#presetStatus"),
    subControls: $("#subControls"),
    rotate2DGroup: $("#rotate2DGroup"),
    rotate3DGroup: $("#rotate3DGroup"),
    rotateAngle: $("#rotateAngle"),
    rotateAxis: $("#rotateAxis"),
    rotateAngleUnit: $("#rotateAngleUnit"),
    scaleX: $("#scaleX"),
    scaleY: $("#scaleY"),
    scaleZControl: $("#scaleZControl"),
    scaleZ: $("#scaleZ"),
    viewControls: $("#viewControls"),
    zoomScale: $("#zoomScale"),
    zoomScaleValue: $("#zoomScaleValue"),
    rotateX: $("#rotateX"),
    rotateY: $("#rotateY"),
    rotateZ: $("#rotateZ"),
    rotateXValue: $("#rotateXValue"),
    rotateYValue: $("#rotateYValue"),
    rotateZValue: $("#rotateZValue"),
    animationTrack: $("#animationTrack"),
    formulaTitle: $("#formulaTitle"),
    formula: $("#formula"),
    historyList: $("#historyList"),
  };
  const state = { dimension: 2, timerIds: [] };

  function rotation() {
    return {
      x: (Number(elements.rotateX.value) * Math.PI) / 180,
      y: (Number(elements.rotateY.value) * Math.PI) / 180,
      z: (Number(elements.rotateZ.value) * Math.PI) / 180,
    };
  }

  function zoomFactor() {
    return Math.max(0.7, Math.min(1.8, Number(elements.zoomScale.value) / 100));
  }

  function toRadians(value, unit) {
    return unit === "rad" ? value : (value * Math.PI) / 180;
  }

  function normalizedAngleSource(source, unit) {
    const trimmed = String(source || "").trim() || "0";
    const normalized = trimmed.replace(/PI/g, "π").replace(/pi/g, "π");
    return unit === "rad" ? normalized : `${normalized}°`;
  }

  function renderMathMatrix(matrix, formatter = (value) => TopicShared.formatNumber(value)) {
    const columns = matrix[0]?.length ?? 1;
    return `<div class="math-matrix" style="grid-template-columns: repeat(${columns}, auto);">${matrix
      .flat()
      .map((value) => `<span class="math-matrix-cell">${formatter(value)}</span>`)
      .join("")}</div>`;
  }

  function exactTrigStrings(angle, unit, label) {
    const radians = toRadians(angle, unit);
    const fullTurn = Math.PI * 2;
    let normalized = ((radians % fullTurn) + fullTurn) % fullTurn;
    if (Math.abs(normalized - fullTurn) < TopicShared.EPSILON) normalized = 0;
    const exactTable = [
      { radians: 0, cos: "1", sin: "0" },
      { radians: Math.PI / 6, cos: "√3/2", sin: "1/2" },
      { radians: Math.PI / 4, cos: "√2/2", sin: "√2/2" },
      { radians: Math.PI / 3, cos: "1/2", sin: "√3/2" },
      { radians: Math.PI / 2, cos: "0", sin: "1" },
      { radians: (2 * Math.PI) / 3, cos: "-1/2", sin: "√3/2" },
      { radians: (3 * Math.PI) / 4, cos: "-√2/2", sin: "√2/2" },
      { radians: (5 * Math.PI) / 6, cos: "-√3/2", sin: "1/2" },
      { radians: Math.PI, cos: "-1", sin: "0" },
      { radians: (7 * Math.PI) / 6, cos: "-√3/2", sin: "-1/2" },
      { radians: (5 * Math.PI) / 4, cos: "-√2/2", sin: "-√2/2" },
      { radians: (4 * Math.PI) / 3, cos: "-1/2", sin: "-√3/2" },
      { radians: (3 * Math.PI) / 2, cos: "0", sin: "-1" },
      { radians: (5 * Math.PI) / 3, cos: "1/2", sin: "-√3/2" },
      { radians: (7 * Math.PI) / 4, cos: "√2/2", sin: "-√2/2" },
      { radians: (11 * Math.PI) / 6, cos: "√3/2", sin: "-1/2" },
    ];
    const exact = exactTable.find((entry) => Math.abs(entry.radians - normalized) < 1e-8);
    if (exact) return exact;
    return {
      cos: `cos(${label})`,
      sin: `sin(${label})`,
    };
  }

  function symbolicRotationMatrix(dim, rotate) {
    const angleLabel = normalizedAngleSource(elements.rotateAngle.value, rotate.unit);
    const trig = exactTrigStrings(rotate.angle, rotate.unit, angleLabel);
    if (dim === 2) {
      return {
        label: "R",
        note: `θ = ${angleLabel}`,
        matrix: [
          [trig.cos, trig.sin.startsWith("-") ? trig.sin.slice(1) : `-${trig.sin}`],
          [trig.sin, trig.cos],
        ],
      };
    }
    if (rotate.axis === "x") {
      return {
        label: "R",
        note: `x軸まわり, θ = ${angleLabel}`,
        matrix: [
          ["1", "0", "0"],
          ["0", trig.cos, trig.sin.startsWith("-") ? trig.sin.slice(1) : `-${trig.sin}`],
          ["0", trig.sin, trig.cos],
        ],
      };
    }
    if (rotate.axis === "y") {
      return {
        label: "R",
        note: `y軸まわり, θ = ${angleLabel}`,
        matrix: [
          [trig.cos, "0", trig.sin],
          ["0", "1", "0"],
          [trig.sin.startsWith("-") ? trig.sin.slice(1) : `-${trig.sin}`, "0", trig.cos],
        ],
      };
    }
    return {
      label: "R",
      note: `z軸まわり, θ = ${angleLabel}`,
      matrix: [
        [trig.cos, trig.sin.startsWith("-") ? trig.sin.slice(1) : `-${trig.sin}`, "0"],
        [trig.sin, trig.cos, "0"],
        ["0", "0", "1"],
      ],
    };
  }

  function renderTransformMatrices(symmetry, rotate, scale, composite, rotateMatrixValue, scaleMatrixValue) {
    const symbolicRotation = symbolicRotationMatrix(state.dimension, rotate);
    const scaleSymbolic = state.dimension === 2
      ? [
          [String(elements.scaleX.value).trim() || "1", "0"],
          ["0", String(elements.scaleY.value).trim() || "1"],
        ]
      : [
          [String(elements.scaleX.value).trim() || "1", "0", "0"],
          ["0", String(elements.scaleY.value).trim() || "1", "0"],
          ["0", "0", String(elements.scaleZ.value).trim() || "1"],
        ];
    const vectorSymbol = state.dimension === 2 ? "(x, y)<sup>T</sup>" : "(x, y, z)<sup>T</sup>";
    return `
      <div class="transform-matrix-display">
        <div class="equation-line">
          <span>T(x)</span>
          <span class="math-equals">=</span>
          <span>A x</span>
          <span class="math-equals">=</span>
          <span>S R F ${vectorSymbol}</span>
        </div>
        <div class="transform-matrix-chain">
          <span class="math-matrix-note">適用順</span>
          <div class="math-matrix-term">
            <span class="math-matrix-label">F</span>
            <span class="math-matrix-note">${symmetry.label}</span>
            ${renderMathMatrix(symmetry.matrix, String)}
          </div>
          <span class="math-operator">→</span>
          <div class="math-matrix-term">
            <span class="math-matrix-label">${symbolicRotation.label}</span>
            <span class="math-matrix-note">${symbolicRotation.note}</span>
            ${renderMathMatrix(symbolicRotation.matrix, String)}
          </div>
          <span class="math-operator">→</span>
          <div class="math-matrix-term">
            <span class="math-matrix-label">S</span>
            <span class="math-matrix-note">各軸方向の倍率</span>
            ${renderMathMatrix(scaleSymbolic, String)}
          </div>
          <span class="math-operator">=</span>
          <div class="math-matrix-term">
            <span class="math-matrix-label">A</span>
            <span class="math-matrix-note">合成変換行列</span>
            ${renderMathMatrix(composite)}
          </div>
        </div>
        <div class="transform-matrix-chain">
          <span class="math-matrix-note">合成行列</span>
          <div class="math-matrix-term">
            <span class="math-matrix-label">S</span>
            ${renderMathMatrix(scaleMatrixValue)}
          </div>
          <span class="math-operator">×</span>
          <div class="math-matrix-term">
            <span class="math-matrix-label">R</span>
            ${renderMathMatrix(rotateMatrixValue)}
          </div>
          <span class="math-operator">×</span>
          <div class="math-matrix-term">
            <span class="math-matrix-label">F</span>
            ${renderMathMatrix(symmetry.matrix)}
          </div>
        </div>
      </div>
    `;
  }

  function symmetryPresets(dim) {
    if (dim === 2) {
      return {
        mirror_x: { label: "x軸対称", matrix: [[1, 0], [0, -1]], note: "x軸に関する対称移動" },
        mirror_y: { label: "y軸対称", matrix: [[-1, 0], [0, 1]], note: "y軸に関する対称移動" },
        mirror_origin: { label: "原点対称", matrix: [[-1, 0], [0, -1]], note: "原点に関する点対称" },
        mirror_diag: { label: "直線 y = x に関する対称", matrix: [[0, 1], [1, 0]], note: "x と y を入れ替えます" },
        mirror_anti_diag: { label: "直線 y = -x に関する対称", matrix: [[0, -1], [-1, 0]], note: "x と y を入れ替えて両方の符号を反転します" },
      };
    }
    return {
      mirror_xy: { label: "xy平面対称", matrix: [[1, 0, 0], [0, 1, 0], [0, 0, -1]], note: "z の符号だけ反転します" },
      mirror_yz: { label: "yz平面対称", matrix: [[-1, 0, 0], [0, 1, 0], [0, 0, 1]], note: "x の符号だけ反転します" },
      mirror_xz: { label: "xz平面対称", matrix: [[1, 0, 0], [0, -1, 0], [0, 0, 1]], note: "y の符号だけ反転します" },
      mirror_origin: { label: "原点対称", matrix: [[-1, 0, 0], [0, -1, 0], [0, 0, -1]], note: "3軸すべての符号を反転します" },
    };
  }

  function rotationMatrix(dim, params) {
    if (dim === 2) {
      const angle = toRadians(params.angle, params.unit);
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      return [[c, -s], [s, c]];
    }
    const angle = toRadians(params.angle, params.unit);
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    if (params.axis === "x") return [[1, 0, 0], [0, c, -s], [0, s, c]];
    if (params.axis === "y") return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
    return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
  }

  function scaleMatrix(dim, params) {
    if (dim === 2) return [[params.sx, 0], [0, params.sy]];
    return [[params.sx, 0, 0], [0, params.sy, 0], [0, 0, params.sz]];
  }

  function sampleShape(dim) {
    if (dim === 2) {
      const points = [
        [-3, -1],
        [0, -1],
        [0, -2],
        [3, 0],
        [0, 2],
        [0, 1],
        [-3, 1],
      ];
      const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0]];
      return { points, edges, faces: [points] };
    }
    const base = [
      [-3, -2],
      [0, -2],
      [0, -1],
      [2, -1],
      [2, 1],
      [-1, 1],
      [-1, 2],
      [-3, 2],
    ];
    const front = base.map(([x, y]) => [x, y, -1]);
    const back = base.map(([x, y]) => [x, y, 1]);
    const points = front.concat(back);
    const edgeCount = base.length;
    const edges = [];
    for (let index = 0; index < edgeCount; index += 1) {
      const next = (index + 1) % edgeCount;
      edges.push([index, next]);
      edges.push([index + edgeCount, next + edgeCount]);
      edges.push([index, index + edgeCount]);
    }
    const faces = [
      front,
      back,
      ...base.map((_, index) => {
        const next = (index + 1) % edgeCount;
        return [
          front[index],
          front[next],
          back[next],
          back[index],
        ];
      }),
    ];
    return { points, edges, faces };
  }

  function transformShape(shape, matrix) {
    const transformPoint = (point) => TopicShared.multiplyMatrixVector(matrix, point);
    return {
      points: shape.points.map(transformPoint),
      edges: shape.edges,
      faces: shape.faces.map((face) => face.map(transformPoint)),
    };
  }

  function shapeSegments(shape, className) {
    return shape.edges.map(([fromIndex, toIndex]) => ({
      from: shape.points[fromIndex],
      to: shape.points[toIndex],
      className,
    }));
  }

  function syncPanels() {
    state.dimension = Number(elements.dimension.value);
    const presets = symmetryPresets(state.dimension);
    const keys = Object.keys(presets);
    if (!presets[elements.symmetryPreset.value]) elements.symmetryPreset.value = keys[0];
    elements.symmetryPreset.innerHTML = keys
      .map((key) => `<option value="${key}" ${key === elements.symmetryPreset.value ? "selected" : ""}>${presets[key].label}</option>`)
      .join("");
    elements.rotate3DGroup.hidden = state.dimension !== 3;
    elements.scaleZControl.hidden = state.dimension !== 3;
    elements.viewControls.hidden = state.dimension !== 3;
    elements.subControls.classList.toggle("with-axis-control", state.dimension === 3);
  }

  function readState() {
    state.dimension = Number(elements.dimension.value);
    const symmetry = symmetryPresets(state.dimension)[elements.symmetryPreset.value];
    if (!symmetry) throw new Error("対称移動を選んでください。");
    const rotateValue = TopicShared.parseExpressionValue(elements.rotateAngle.value);
    const rotate = {
      angle: rotateValue,
      unit: elements.rotateAngleUnit.value,
      axis: state.dimension === 3 ? elements.rotateAxis.value : "z",
    };
    const scale = {
      sx: TopicShared.parseExpressionValue(elements.scaleX.value),
      sy: TopicShared.parseExpressionValue(elements.scaleY.value),
      sz: state.dimension === 3 ? TopicShared.parseExpressionValue(elements.scaleZ.value) : 1,
    };
    const rotateMatrixValue = rotationMatrix(state.dimension, rotate);
    const scaleMatrixValue = scaleMatrix(state.dimension, scale);
    const composite = TopicShared.multiplyMatrices(
      scaleMatrixValue,
      TopicShared.multiplyMatrices(rotateMatrixValue, symmetry.matrix),
    );
    const sample = sampleShape(state.dimension);
    const afterSymmetry = transformShape(sample, symmetry.matrix);
    const rotateAfterSymmetry = TopicShared.multiplyMatrices(rotateMatrixValue, symmetry.matrix);
    const afterRotate = transformShape(sample, rotateAfterSymmetry);
    const transformed = transformShape(sample, composite);
    return {
      symmetry,
      rotate,
      scale,
      rotateMatrixValue,
      scaleMatrixValue,
      composite,
      sample,
      afterSymmetry,
      afterRotate,
      transformed,
    };
  }

  function axisExtent(...shapes) {
    const maxAbs = Math.max(
      1,
      ...shapes.flatMap((shape) => shape.points).flatMap((point) => point.map((value) => Math.abs(value))),
    );
    return Math.max(5, Math.ceil(maxAbs + 1.5)) / zoomFactor();
  }

  function refreshPreview() {
    TopicShared.clearTimers(state);
    TopicShared.clearHistory(elements.historyList);
    elements.message.textContent = "";
    refreshPresetOptions();
    elements.viewControls.hidden = state.dimension !== 3;
    elements.dimensionStatus.textContent = `${state.dimension} 次元`;
    elements.zoomScaleValue.textContent = `${elements.zoomScale.value}%`;
    [elements.rotateXValue, elements.rotateYValue, elements.rotateZValue].forEach((output, index) => {
      const values = [elements.rotateX.value, elements.rotateY.value, elements.rotateZ.value];
      output.textContent = `${values[index]}°`;
    });
    try {
      const {
        symmetry,
        rotate,
        scale,
        rotateMatrixValue,
        scaleMatrixValue,
        composite,
        sample,
        afterSymmetry,
        afterRotate,
        transformed,
      } = readState();
      const angleLabel = normalizedAngleSource(elements.rotateAngle.value, rotate.unit);
      elements.presetStatus.textContent = "対称移動 → 回転 → 拡大縮小";
      elements.shapeSummary.textContent = state.dimension === 2
        ? "2D では矢印形を使って、向きや伸び方の変化を見ます。"
        : "3D では非対称な押し出し形を使って、面の向きや伸び方の変化を見ます。";
      elements.transformSummary.textContent = `${symmetry.label} → ${state.dimension === 2 ? `${angleLabel}回転` : `${elements.rotateAxis.value}軸まわり${angleLabel}回転`} → x${TopicShared.formatNumber(scale.sx)}, y${TopicShared.formatNumber(scale.sy)}${state.dimension === 3 ? `, z${TopicShared.formatNumber(scale.sz)}` : ""}`;
      elements.resultSummary.textContent = "3つの写像を順にかけた結果を、最後は 1 個の合成行列 A としてまとめて見ます。";
      elements.equationDisplay.innerHTML = renderTransformMatrices(symmetry, rotate, scale, composite, rotateMatrixValue, scaleMatrixValue);
      elements.formulaTitle.textContent = "合成の考え方";
      elements.formula.textContent = "線形写像どうしの合成は、対応する行列の積として 1 個の行列 A にまとめられます。";
      TopicShared.renderTrack(elements.animationTrack, ["元の図形", "対称移動", "回転", "拡大縮小"], -1);
      TopicShared.drawSpaceDiagram(elements.vectorDiagram, {
        dimension: state.dimension,
        rotation: rotation(),
        polygons: [
          ...sample.faces.map((face) => ({ points: face, className: "diagram-guide-surface" })),
          ...transformed.faces.map((face) => ({ points: face, className: "diagram-surface" })),
        ],
        segments: [
          ...shapeSegments(sample, "diagram-guide-line"),
          ...shapeSegments(transformed, "diagram-result-line"),
        ],
        axisExtent: axisExtent(sample, afterSymmetry, afterRotate, transformed),
        gridStep: 1,
        tickStep: 5,
      });
    } catch (error) {
      elements.message.textContent = error.message;
      elements.resultSummary.textContent = "入力を確認してください。";
    }
  }

  function animate() {
    TopicShared.clearTimers(state);
    TopicShared.clearHistory(elements.historyList);
    try {
      const { symmetry, rotate, scale, sample, afterSymmetry, afterRotate, transformed } = readState();
      const angleLabel = normalizedAngleSource(elements.rotateAngle.value, rotate.unit);
      const labels = ["元の図形", "対称移動", "回転", "拡大縮小"];
      const extent = axisExtent(sample, afterSymmetry, afterRotate, transformed);
      const steps = [
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 0);
          elements.formulaTitle.textContent = "元の図形";
          elements.formula.textContent = "まずは原点まわりの元の図形を確認します。";
          TopicShared.pushHistory(elements.historyList, "元の図形", "線形写像は原点を固定したまま働きます。");
          TopicShared.drawSpaceDiagram(elements.vectorDiagram, {
            dimension: state.dimension,
            rotation: rotation(),
            polygons: sample.faces.map((face) => ({ points: face, className: "diagram-guide-surface" })),
            segments: shapeSegments(sample, "diagram-guide-line"),
            axisExtent: extent,
            gridStep: 1,
            tickStep: 5,
          });
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 1);
          elements.formulaTitle.textContent = "対称移動";
          elements.formula.textContent = `${symmetry.label}: ${symmetry.note}`;
          TopicShared.pushHistory(elements.historyList, "対称移動", symmetry.note);
          TopicShared.drawSpaceDiagram(elements.vectorDiagram, {
            dimension: state.dimension,
            rotation: rotation(),
            polygons: [
              ...sample.faces.map((face) => ({ points: face, className: "diagram-guide-surface" })),
              ...afterSymmetry.faces.map((face) => ({ points: face, className: "diagram-surface" })),
            ],
            segments: [
              ...shapeSegments(sample, "diagram-guide-line"),
              ...shapeSegments(afterSymmetry, "diagram-result-line"),
            ],
            axisExtent: extent,
            gridStep: 1,
            tickStep: 5,
          });
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 2);
          elements.formulaTitle.textContent = "回転";
          elements.formula.textContent = state.dimension === 2
            ? `${angleLabel} だけ回転します。`
            : `${elements.rotateAxis.value}軸のまわりに ${angleLabel} 回転します。`;
          TopicShared.pushHistory(elements.historyList, "回転", elements.formula.textContent);
          TopicShared.drawSpaceDiagram(elements.vectorDiagram, {
            dimension: state.dimension,
            rotation: rotation(),
            polygons: [
              ...sample.faces.map((face) => ({ points: face, className: "diagram-guide-surface" })),
              ...afterRotate.faces.map((face) => ({ points: face, className: "diagram-surface" })),
            ],
            segments: [
              ...shapeSegments(sample, "diagram-guide-line"),
              ...shapeSegments(afterRotate, "diagram-result-line"),
            ],
            axisExtent: extent,
            gridStep: 1,
            tickStep: 5,
          });
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 3);
          elements.formulaTitle.textContent = "拡大縮小";
          elements.formula.textContent = `倍率 = (${TopicShared.formatNumber(scale.sx)}, ${TopicShared.formatNumber(scale.sy)}${state.dimension === 3 ? `, ${TopicShared.formatNumber(scale.sz)}` : ""})`;
          TopicShared.pushHistory(elements.historyList, "拡大縮小", elements.formula.textContent);
          TopicShared.drawSpaceDiagram(elements.vectorDiagram, {
            dimension: state.dimension,
            rotation: rotation(),
            polygons: [
              ...sample.faces.map((face) => ({ points: face, className: "diagram-guide-surface" })),
              ...transformed.faces.map((face) => ({ points: face, className: "diagram-surface" })),
            ],
            segments: [
              ...shapeSegments(sample, "diagram-guide-line"),
              ...shapeSegments(transformed, "diagram-result-line"),
            ],
            axisExtent: extent,
            gridStep: 1,
            tickStep: 5,
          });
        },
      ];
      steps.forEach((step, index) => state.timerIds.push(window.setTimeout(step, index * 900)));
    } catch (error) {
      elements.message.textContent = error.message;
    }
  }

  elements.dimension.addEventListener("change", refreshPreview);
  elements.symmetryPreset.addEventListener("change", refreshPreview);
  elements.rotateAxis.addEventListener("change", refreshPreview);
  elements.rotateAngle.addEventListener("input", refreshPreview);
  elements.rotateAngleUnit.addEventListener("change", refreshPreview);
  elements.scaleX.addEventListener("input", refreshPreview);
  elements.scaleY.addEventListener("input", refreshPreview);
  elements.scaleZ.addEventListener("input", refreshPreview);
  elements.zoomScale.addEventListener("input", refreshPreview);
  [elements.rotateX, elements.rotateY, elements.rotateZ].forEach((slider) => slider.addEventListener("input", refreshPreview));
  elements.randomize.addEventListener("click", () => {
    syncPanels();
    const options = Array.from(elements.symmetryPreset.options);
    elements.symmetryPreset.value = options[TopicShared.randomInt(0, options.length - 1)].value;
    elements.rotateAngle.value = String(TopicShared.randomInt(15, 165));
    if (state.dimension === 3) elements.rotateAxis.value = ["x", "y", "z"][TopicShared.randomInt(0, 2)];
    elements.rotateAngleUnit.value = "deg";
    elements.scaleX.value = String(TopicShared.randomNonZero(1, 3));
    elements.scaleY.value = String(TopicShared.randomNonZero(1, 3));
    if (state.dimension === 3) elements.scaleZ.value = String(TopicShared.randomNonZero(1, 3));
    refreshPreview();
  });
  elements.animate.addEventListener("click", animate);
  syncPanels();
  refreshPreview();
}

function initQuaternionVector() {
  const $ = (selector) => document.querySelector(selector);
  const elements = {
    randomize: $("#randomize"),
    animate: $("#animate"),
    message: $("#message"),
    axisInput: $("#axisInput"),
    vectorInput: $("#vectorInput"),
    angle: $("#angle"),
    resultSummary: $("#resultSummary"),
    equationDisplay: $("#equationDisplay"),
    vectorDiagram: $("#vectorDiagram"),
    angleStatus: $("#angleStatus"),
    viewControls: $("#viewControls"),
    rotateX: $("#rotateX"),
    rotateY: $("#rotateY"),
    rotateZ: $("#rotateZ"),
    rotateXValue: $("#rotateXValue"),
    rotateYValue: $("#rotateYValue"),
    rotateZValue: $("#rotateZValue"),
    animationTrack: $("#animationTrack"),
    formulaTitle: $("#formulaTitle"),
    formula: $("#formula"),
    historyList: $("#historyList"),
  };
  const state = { timerIds: [] };

  function rotation() {
    return {
      x: (Number(elements.rotateX.value) * Math.PI) / 180,
      y: (Number(elements.rotateY.value) * Math.PI) / 180,
      z: (Number(elements.rotateZ.value) * Math.PI) / 180,
    };
  }

  function readState() {
    const axis = TopicShared.normalizeVector(TopicShared.ensureNonZeroVector(TopicShared.readVector(elements.axisInput, "u")));
    const vector = TopicShared.readVector(elements.vectorInput, "v");
    const angle = TopicShared.parseExpressionValue(elements.angle.value);
    const radians = (angle * Math.PI) / 180;
    const quaternion = TopicShared.quaternionFromAxisAngle(axis, radians);
    const rotated = TopicShared.rotateVectorByQuaternion(vector, axis, radians);
    return { axis, vector, angle, quaternion, rotated };
  }

  function refreshPreview() {
    TopicShared.clearTimers(state);
    TopicShared.clearHistory(elements.historyList);
    elements.message.textContent = "";
    [elements.rotateXValue, elements.rotateYValue, elements.rotateZValue].forEach((output, index) => {
      const values = [elements.rotateX.value, elements.rotateY.value, elements.rotateZ.value];
      output.textContent = `${values[index]}°`;
    });
    try {
      const { axis, vector, angle, quaternion, rotated } = readState();
      elements.angleStatus.textContent = `${TopicShared.formatNumber(angle)}°`;
      elements.resultSummary.textContent = `回転後 = (${rotated.map((value) => TopicShared.formatNumber(value)).join(", ")})`;
      elements.equationDisplay.textContent = "q = (cos(θ/2), u sin(θ/2)), v' = q (0, v) q^-1";
      elements.formulaTitle.textContent = "クオータニオン回転";
      elements.formula.textContent = "回転軸 u と角度 θ からクオータニオン q を作り、純虚クオータニオン (0, v) を共役変換します。";
      TopicShared.renderTrack(elements.animationTrack, ["軸を正規化", "q を作る", "q p q^-1", "回転結果"], -1);
      TopicShared.drawSpaceDiagram(elements.vectorDiagram, {
        dimension: 3,
        rotation: rotation(),
        vectors: [
          { from: [0, 0, 0], to: TopicShared.scaleVector(axis, 4), className: "diagram-guide", label: "u" },
          { from: [0, 0, 0], to: vector, className: "diagram-cross", label: "v" },
          { from: [0, 0, 0], to: rotated, className: "diagram-result", label: "v'" },
        ],
        axisExtent: 8,
        tickStep: 5,
      });
      TopicShared.pushHistory(elements.historyList, "q", `q = (${quaternion.map((value) => TopicShared.formatNumber(value)).join(", ")})`);
    } catch (error) {
      elements.message.textContent = error.message;
      elements.resultSummary.textContent = "入力を確認してください。";
    }
  }

  function animate() {
    TopicShared.clearTimers(state);
    TopicShared.clearHistory(elements.historyList);
    try {
      const { axis, vector, angle, quaternion, rotated } = readState();
      const labels = ["軸を正規化", "q を作る", "q p q^-1", "回転結果"];
      const p = [0, vector[0], vector[1], vector[2]];
      const qInv = TopicShared.quaternionConjugate(quaternion);
      const steps = [
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 0);
          elements.formulaTitle.textContent = "軸の正規化";
          elements.formula.textContent = `u = (${axis.map((value) => TopicShared.formatNumber(value)).join(", ")})`;
          TopicShared.pushHistory(elements.historyList, "軸", "回転軸は長さ 1 にそろえます。");
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 1);
          elements.formulaTitle.textContent = "クオータニオン";
          elements.formula.textContent = `q = (${quaternion.map((value) => TopicShared.formatNumber(value)).join(", ")}), θ = ${TopicShared.formatNumber(angle)}°`;
          TopicShared.pushHistory(elements.historyList, "q", "cos(θ/2) と u sin(θ/2) で作ります。");
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 2);
          elements.formulaTitle.textContent = "共役変換";
          elements.formula.textContent = `p = (${p.map((value) => TopicShared.formatNumber(value)).join(", ")}), q^-1 = (${qInv.map((value) => TopicShared.formatNumber(value)).join(", ")})`;
          TopicShared.pushHistory(elements.historyList, "共役変換", "v を純虚クオータニオン p にして q p q^-1 を計算します。");
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 3);
          elements.formulaTitle.textContent = "回転後のベクトル";
          elements.formula.textContent = `v' = (${rotated.map((value) => TopicShared.formatNumber(value)).join(", ")})`;
          TopicShared.pushHistory(elements.historyList, "結果", "ジンバルロックを避けながら 3D 回転を表せます。");
        },
      ];
      steps.forEach((step, index) => state.timerIds.push(window.setTimeout(step, index * 900)));
    } catch (error) {
      elements.message.textContent = error.message;
    }
  }

  TopicShared.createVectorInputs(elements.axisInput, 3, "u", [0, 0, 1]);
  TopicShared.createVectorInputs(elements.vectorInput, 3, "v", [3, 1, 0]);
  TopicShared.attachLiveRefresh(document.body, refreshPreview);
  [elements.rotateX, elements.rotateY, elements.rotateZ].forEach((slider) => slider.addEventListener("input", refreshPreview));
  elements.randomize.addEventListener("click", () => {
    TopicShared.writeVector(elements.axisInput, [TopicShared.randomNonZero(), TopicShared.randomNonZero(), TopicShared.randomNonZero()]);
    TopicShared.writeVector(elements.vectorInput, [TopicShared.randomNonZero(), TopicShared.randomNonZero(), TopicShared.randomNonZero()]);
    elements.angle.value = String(TopicShared.randomInt(20, 160));
    refreshPreview();
  });
  elements.animate.addEventListener("click", animate);
  refreshPreview();
}

function initConicOrthogonalTransform() {
  const $ = (selector) => document.querySelector(selector);
  const svgElement = (name, attrs = {}, text = null) => {
    const element = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
    if (text !== null) element.textContent = text;
    return element;
  };
  const elements = {
    conicType: $("#conicType"),
    paramA: $("#paramA"),
    parameterBGroup: $("#parameterBGroup"),
    paramB: $("#paramB"),
    angle: $("#angle"),
    angleUnit: $("#angleUnit"),
    randomize: $("#randomize"),
    animate: $("#animate"),
    message: $("#message"),
    standardSummary: $("#standardSummary"),
    rotationSummary: $("#rotationSummary"),
    inverseSummary: $("#inverseSummary"),
    equationDisplay: $("#equationDisplay"),
    vectorDiagram: $("#vectorDiagram"),
    typeStatus: $("#typeStatus"),
    transformStatus: $("#transformStatus"),
    animationTrack: $("#animationTrack"),
    formulaTitle: $("#formulaTitle"),
    formula: $("#formula"),
    historyList: $("#historyList"),
  };
  const state = { timerIds: [] };

  function updateParameterVisibility() {
    elements.parameterBGroup.hidden = elements.conicType.value === "parabola";
  }

  function formatAngleSource() {
    const trimmed = String(elements.angle.value || "").trim() || "0";
    const normalized = trimmed.replace(/PI/g, "π").replace(/pi/g, "π");
    return elements.angleUnit.value === "rad" ? normalized : `${normalized}°`;
  }

  function readState() {
    const type = elements.conicType.value;
    const a = TopicShared.parseExpressionValue(elements.paramA.value);
    const b = type === "parabola" ? null : TopicShared.parseExpressionValue(elements.paramB.value);
    const angle = TopicShared.parseExpressionValue(elements.angle.value);
    if (!(a > 0)) throw new Error(type === "parabola" ? "p は正にしてください。" : "a は正にしてください。");
    if (type !== "parabola" && !(b > 0)) throw new Error("b は正にしてください。");
    const theta = elements.angleUnit.value === "rad" ? angle : (angle * Math.PI) / 180;
    return { type, a, b, angle, theta };
  }

  function rotatePoint(point, theta) {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    return [point[0] * c - point[1] * s, point[0] * s + point[1] * c];
  }

  function sampleStandardCurves(config) {
    const { type, a, b } = config;
    if (type === "ellipse") {
      const points = [];
      for (let i = 0; i <= 120; i += 1) {
        const t = (i / 120) * Math.PI * 2;
        points.push([a * Math.cos(t), b * Math.sin(t)]);
      }
      return [points];
    }
    if (type === "hyperbola") {
      const branches = [[], []];
      for (let i = -48; i <= 48; i += 1) {
        const t = i / 18;
        branches[0].push([a * Math.cosh(t), b * Math.sinh(t)]);
        branches[1].push([-a * Math.cosh(t), b * Math.sinh(t)]);
      }
      return branches;
    }
    const branch = [];
    for (let i = -60; i <= 60; i += 1) {
      const t = i / 10;
      branch.push([a * t * t, 2 * a * t]);
    }
    return [branch];
  }

  function transformedCurves(curves, theta) {
    return curves.map((curve) => curve.map((point) => rotatePoint(point, theta)));
  }

  function standardEquation(config) {
    if (config.type === "ellipse") return `u^2/${TopicShared.formatNumber(config.a ** 2)} + v^2/${TopicShared.formatNumber(config.b ** 2)} = 1`;
    if (config.type === "hyperbola") return `u^2/${TopicShared.formatNumber(config.a ** 2)} - v^2/${TopicShared.formatNumber(config.b ** 2)} = 1`;
    return `v^2 = 4·${TopicShared.formatNumber(config.a)}·u`;
  }

  function transformedEquation(config) {
    const angleLabel = formatAngleSource();
    const uExpr = `(x cos(${angleLabel}) + y sin(${angleLabel}))`;
    const vExpr = `(-x sin(${angleLabel}) + y cos(${angleLabel}))`;
    if (config.type === "ellipse") return `${uExpr}^2/${TopicShared.formatNumber(config.a ** 2)} + ${vExpr}^2/${TopicShared.formatNumber(config.b ** 2)} = 1`;
    if (config.type === "hyperbola") return `${uExpr}^2/${TopicShared.formatNumber(config.a ** 2)} - ${vExpr}^2/${TopicShared.formatNumber(config.b ** 2)} = 1`;
    return `${vExpr}^2 = 4·${TopicShared.formatNumber(config.a)}·${uExpr}`;
  }

  function matrixHtml(theta, inverse = false) {
    const angleLabel = formatAngleSource();
    const c = `cos(${angleLabel})`;
    const s = `sin(${angleLabel})`;
    const matrix = inverse
      ? [[c, s], [`-${s}`, c]]
      : [[c, `-${s}`], [s, c]];
    const columns = 2;
    return `<div class="math-matrix" style="grid-template-columns: repeat(${columns}, auto);">${matrix.flat().map((value) => `<span class="math-matrix-cell">${value}</span>`).join("")}</div>`;
  }

  function renderEquationDisplay(config) {
    elements.equationDisplay.innerHTML = `
      <div class="equation-group">
        <div class="equation-group-title">標準形</div>
        <div class="equation-line math-text">${standardEquation(config)}</div>
      </div>
      <div class="equation-group">
        <div class="equation-group-title">直交変換</div>
        <div class="equation-line">
          <span class="math-text">[x y]^T = </span>
          ${matrixHtml(config.theta, false)}
          <span class="math-text">[u v]^T</span>
        </div>
      </div>
      <div class="equation-group">
        <div class="equation-group-title">逆変換で戻す</div>
        <div class="equation-line">
          <span class="math-text">[u v]^T = </span>
          ${matrixHtml(config.theta, true)}
          <span class="math-text">[x y]^T</span>
        </div>
        <div class="equation-line math-text">${transformedEquation(config)}</div>
      </div>
    `;
  }

  function drawDiagram(config, stage = "preview") {
    const standardCurves = sampleStandardCurves(config);
    const transformed = transformedCurves(standardCurves, config.theta);
    const allPoints = [...standardCurves.flat(), ...transformed.flat(), [0, 0]];
    let minX = Math.min(...allPoints.map((p) => p[0]), -6);
    let maxX = Math.max(...allPoints.map((p) => p[0]), 6);
    let minY = Math.min(...allPoints.map((p) => p[1]), -6);
    let maxY = Math.max(...allPoints.map((p) => p[1]), 6);
    const padding = 42;
    const width = 720;
    const height = 360;
    const spanX = Math.max(maxX - minX, 4);
    const spanY = Math.max(maxY - minY, 4);
    const scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const extentX = (width / 2 - padding) / scale;
    const extentY = (height / 2 - padding) / scale;
    minX = centerX - extentX;
    maxX = centerX + extentX;
    minY = centerY - extentY;
    maxY = centerY + extentY;

    function toScreen(point) {
      return {
        x: padding + (point[0] - minX) * scale,
        y: height - padding - (point[1] - minY) * scale,
      };
    }

    function polyline(curve, className) {
      const points = curve.map((point) => {
        const screen = toScreen(point);
        return `${screen.x},${screen.y}`;
      }).join(" ");
      elements.vectorDiagram.append(svgElement("polyline", { points, class: className }));
    }

    elements.vectorDiagram.innerHTML = "";
    for (let x = Math.ceil(minX); x <= maxX; x += 1) {
      const from = toScreen([x, minY]);
      const to = toScreen([x, maxY]);
      elements.vectorDiagram.append(svgElement("line", { x1: from.x, y1: from.y, x2: to.x, y2: to.y, class: "diagram-grid" }));
    }
    for (let y = Math.ceil(minY); y <= maxY; y += 1) {
      const from = toScreen([minX, y]);
      const to = toScreen([maxX, y]);
      elements.vectorDiagram.append(svgElement("line", { x1: from.x, y1: from.y, x2: to.x, y2: to.y, class: "diagram-grid" }));
    }
    const xAxisFrom = toScreen([minX, 0]);
    const xAxisTo = toScreen([maxX, 0]);
    const yAxisFrom = toScreen([0, minY]);
    const yAxisTo = toScreen([0, maxY]);
    elements.vectorDiagram.append(svgElement("line", { x1: xAxisFrom.x, y1: xAxisFrom.y, x2: xAxisTo.x, y2: xAxisTo.y, class: "diagram-conic-axis" }));
    elements.vectorDiagram.append(svgElement("line", { x1: yAxisFrom.x, y1: yAxisFrom.y, x2: yAxisTo.x, y2: yAxisTo.y, class: "diagram-conic-axis" }));

    const standardAxisUFrom = toScreen(rotatePoint([minX, 0], config.theta));
    const standardAxisUTo = toScreen(rotatePoint([maxX, 0], config.theta));
    const standardAxisVFrom = toScreen(rotatePoint([0, minY], config.theta));
    const standardAxisVTo = toScreen(rotatePoint([0, maxY], config.theta));

    if (stage !== "standard") {
      elements.vectorDiagram.append(svgElement("line", { x1: standardAxisUFrom.x, y1: standardAxisUFrom.y, x2: standardAxisUTo.x, y2: standardAxisUTo.y, class: "diagram-conic-rotated-axis" }));
      elements.vectorDiagram.append(svgElement("line", { x1: standardAxisVFrom.x, y1: standardAxisVFrom.y, x2: standardAxisVTo.x, y2: standardAxisVTo.y, class: "diagram-conic-rotated-axis" }));
    }

    if (stage === "standard") {
      standardCurves.forEach((curve) => polyline(curve, "diagram-conic-standard"));
      return;
    }
    if (stage === "transformed") {
      transformed.forEach((curve) => polyline(curve, "diagram-conic-transformed"));
      return;
    }
    standardCurves.forEach((curve) => polyline(curve, "diagram-conic-standard"));
    transformed.forEach((curve) => polyline(curve, "diagram-conic-transformed"));
  }

  function refreshPreview() {
    TopicShared.clearTimers(state);
    TopicShared.clearHistory(elements.historyList);
    elements.message.textContent = "";
    updateParameterVisibility();
    try {
      const config = readState();
      const titles = { ellipse: "楕円", hyperbola: "双曲線", parabola: "放物線" };
      elements.typeStatus.textContent = titles[config.type];
      elements.transformStatus.textContent = "標準形 → 直交変換 → 逆変換";
      elements.standardSummary.textContent = standardEquation(config);
      elements.rotationSummary.textContent = `R(${formatAngleSource()})`;
      elements.inverseSummary.textContent = `R^-1 = R^T で標準形に戻せます。`;
      renderEquationDisplay(config);
      elements.formulaTitle.textContent = "標準形の公式";
      elements.formula.textContent = `${standardEquation(config)} を u-v 座標で見てから、回転行列で x-y 座標へ移します。`;
      TopicShared.renderTrack(elements.animationTrack, ["標準形", "直交変換", "変形後の式", "逆変換"], -1);
      drawDiagram(config, "preview");
    } catch (error) {
      elements.message.textContent = error.message;
    }
  }

  function animate() {
    TopicShared.clearTimers(state);
    TopicShared.clearHistory(elements.historyList);
    try {
      const config = readState();
      const labels = ["標準形", "直交変換", "変形後の式", "逆変換"];
      const steps = [
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 0);
          drawDiagram(config, "standard");
          elements.formulaTitle.textContent = "標準形";
          elements.formula.textContent = standardEquation(config);
          TopicShared.pushHistory(elements.historyList, "標準形", "まずは u-v 座標での標準形を確認します。");
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 1);
          drawDiagram(config, "preview");
          elements.formulaTitle.textContent = "直交変換";
          elements.formula.textContent = `[x y]^T = R [u v]^T, 角度 = ${formatAngleSource()}`;
          TopicShared.pushHistory(elements.historyList, "直交変換", "回転行列 R で座標軸ごと回します。");
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 2);
          drawDiagram(config, "transformed");
          elements.formulaTitle.textContent = "変形後の式";
          elements.formula.textContent = transformedEquation(config);
          TopicShared.pushHistory(elements.historyList, "変形後", "u, v を x, y で書き換えると交差項を持つ式になります。");
        },
        () => {
          TopicShared.renderTrack(elements.animationTrack, labels, 3);
          drawDiagram(config, "preview");
          elements.formulaTitle.textContent = "逆変換";
          elements.formula.textContent = `[u v]^T = R^T [x y]^T に戻すと ${standardEquation(config)} です。`;
          TopicShared.pushHistory(elements.historyList, "逆変換", "R^-1 = R^T なので、逆回転で標準形へ戻せます。");
        },
      ];
      steps.forEach((step, index) => state.timerIds.push(window.setTimeout(step, index * 1000)));
    } catch (error) {
      elements.message.textContent = error.message;
    }
  }

  TopicShared.attachLiveRefresh(document.body, refreshPreview);
  elements.conicType.addEventListener("change", () => {
    if (elements.conicType.value === "parabola") {
      elements.paramA.value = "2";
    } else {
      if (!elements.paramB.value) elements.paramB.value = "2";
    }
    refreshPreview();
  });
  elements.randomize.addEventListener("click", () => {
    const types = ["ellipse", "hyperbola", "parabola"];
    elements.conicType.value = types[TopicShared.randomInt(0, types.length - 1)];
    elements.paramA.value = String(TopicShared.randomInt(1, 4));
    elements.paramB.value = String(TopicShared.randomInt(1, 4));
    elements.angle.value = String(TopicShared.randomInt(15, 75));
    elements.angleUnit.value = "deg";
    refreshPreview();
  });
  elements.animate.addEventListener("click", animate);
  refreshPreview();
}

document.addEventListener("DOMContentLoaded", () => {
  const topic = document.body.dataset.topic;
  if (topic === "linear-independence") initLinearIndependence();
  if (topic === "basis-vectors") initBasisVectors();
  if (topic === "linear-map-matrix") initLinearMapMatrix();
  if (topic === "linear-shape-transform") initLinearShapeTransform();
  if (topic === "affine-transform") initAffineTransform();
  if (topic === "homogeneous-coordinates") initHomogeneousCoordinates();
  if (topic === "quaternion-vector") initQuaternionVector();
  if (topic === "conic-orthogonal-transform") initConicOrthogonalTransform();
});
