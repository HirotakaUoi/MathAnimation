const tableElements = {
  variableCount: document.querySelector("#variableCount"),
  formulaSelect: document.querySelector("#formulaSelect"),
  customFormulaInput: document.querySelector("#customFormulaInput"),
  customBooleanFormulaInput: document.querySelector("#customBooleanFormulaInput"),
  symbolButtons: document.querySelectorAll("[data-insert-symbol]"),
  booleanSymbolButtons: document.querySelectorAll("[data-insert-boolean-symbol]"),
  tableTitle: document.querySelector("#tableTitle"),
  tableSubtitle: document.querySelector("#tableSubtitle"),
  rowCountBadge: document.querySelector("#rowCountBadge"),
  tableStage: document.querySelector("#tableStage"),
  message: document.querySelector("#message"),
  xInput: document.querySelector("#xInput"),
  yInput: document.querySelector("#yInput"),
  zInput: document.querySelector("#zInput"),
  zInputGroup: document.querySelector("#zInputGroup"),
};

const propositionExamples = {
  2: [
    { label: "p ⋀ q", fn: ({ p, q }) => p && q },
    { label: "p ⋁ q", fn: ({ p, q }) => p || q },
    { label: "~p", fn: ({ p }) => !p },
    { label: "~(p ⋀ q)", fn: ({ p, q }) => !(p && q) },
    { label: "~p ⋁ q", fn: ({ p, q }) => !p || q },
    { label: "(p ⋁ q) ⋀ ~q", fn: ({ p, q }) => (p || q) && !q },
  ],
  3: [
    { label: "p ⋀ q ⋀ r", fn: ({ p, q, r }) => p && q && r },
    { label: "p ⋁ q ⋁ r", fn: ({ p, q, r }) => p || q || r },
    { label: "~p ⋀ q", fn: ({ p, q }) => !p && q },
    { label: "(p ⋀ q) ⋁ r", fn: ({ p, q, r }) => (p && q) || r },
    { label: "(p ⋁ q) ⋀ ~r", fn: ({ p, q, r }) => (p || q) && !r },
    { label: "~(p ⋁ q) ⋁ r", fn: ({ p, q, r }) => !(p || q) || r },
  ],
  4: [
    { label: "p ⋀ q ⋀ r ⋀ s", fn: ({ p, q, r, s }) => p && q && r && s },
    { label: "p ⋁ q ⋁ r ⋁ s", fn: ({ p, q, r, s }) => p || q || r || s },
    { label: "(p ⋀ q) ⋁ (r ⋀ s)", fn: ({ p, q, r, s }) => (p && q) || (r && s) },
    { label: "(p ⋁ q) ⋀ (r ⋁ s)", fn: ({ p, q, r, s }) => (p || q) && (r || s) },
    { label: "(~p ⋀ q ⋀ ~r) ⋁ s", fn: ({ p, q, r, s }) => (!p && q && !r) || s },
    { label: "~(p ⋀ q) ⋁ (r ⋀ ~s)", fn: ({ p, q, r, s }) => !(p && q) || (r && !s) },
  ],
};

const booleanExamples = {
  2: [
    { label: "xy", fn: ({ x, y }) => x && y },
    { label: "x+y", fn: ({ x, y }) => x || y },
    { label: "x'", fn: ({ x }) => !x },
    { label: "x'y + xy'", fn: ({ x, y }) => (!x && y) || (x && !y) },
    { label: "(x+y)'", fn: ({ x, y }) => !(x || y) },
    { label: "x + x'y", fn: ({ x, y }) => x || (!x && y) },
  ],
  3: [
    { label: "xyz", fn: ({ x, y, z }) => x && y && z },
    { label: "x+y+z", fn: ({ x, y, z }) => x || y || z },
    { label: "x'y+z", fn: ({ x, y, z }) => (!x && y) || z },
    { label: "xy+x'z", fn: ({ x, y, z }) => (x && y) || (!x && z) },
    { label: "(x+y)z'", fn: ({ x, y, z }) => (x || y) && !z },
    { label: "x'y + yz + xz'", fn: ({ x, y, z }) => (!x && y) || (y && z) || (x && !z) },
  ],
};

function setTableMessage(text = "") {
  tableElements.message.textContent = text;
}

function escapeTableHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function tf(value) {
  return value ? "T" : "F";
}

function bit(value) {
  return value ? "1" : "0";
}

function rowsForVariables(names) {
  const count = 2 ** names.length;
  return Array.from({ length: count }, (_, rowIndex) => {
    const values = {};
    names.forEach((name, nameIndex) => {
      values[name] = Boolean(rowIndex & (1 << (names.length - nameIndex - 1)));
    });
    return values;
  });
}

function populateFormulaSelect(examples) {
  const current = tableElements.formulaSelect.value;
  tableElements.formulaSelect.innerHTML = examples
    .map((example, index) => `<option value="${index}">${escapeTableHtml(example.label)}</option>`)
    .join("");
  if ([...tableElements.formulaSelect.options].some((option) => option.value === current)) {
    tableElements.formulaSelect.value = current;
  }
}

function tokenizePropositionFormula(source) {
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if ("pqrs".includes(char)) {
      tokens.push({ type: "variable", value: char });
      index += 1;
      continue;
    }
    if (char === "~") {
      tokens.push({ type: "not", value: char });
      index += 1;
      continue;
    }
    if (char === "⋀") {
      tokens.push({ type: "and", value: char });
      index += 1;
      continue;
    }
    if (char === "⋁") {
      tokens.push({ type: "or", value: char });
      index += 1;
      continue;
    }
    if (char === "(" || char === ")") {
      tokens.push({ type: char, value: char });
      index += 1;
      continue;
    }
    throw new Error(`使えない文字があります: ${char}`);
  }
  return tokens;
}

function parsePropositionFormula(source, allowedNames) {
  const tokens = tokenizePropositionFormula(source);
  let index = 0;

  function peek() {
    return tokens[index];
  }

  function consume(type) {
    if (peek()?.type !== type) return null;
    index += 1;
    return tokens[index - 1];
  }

  function parsePrimary() {
    const token = peek();
    if (!token) throw new Error("式が途中で終わっています。");
    if (consume("not")) {
      const operand = parsePrimary();
      return (values) => !operand(values);
    }
    if (token.type === "variable") {
      index += 1;
      if (!allowedNames.includes(token.value)) {
        throw new Error(`${token.value} は現在の変数数では使えません。`);
      }
      return (values) => values[token.value];
    }
    if (consume("(")) {
      const expression = parseOr();
      if (!consume(")")) throw new Error("閉じ括弧 ) が不足しています。");
      return expression;
    }
    throw new Error(`${token.value} の位置を確認してください。`);
  }

  function parseAnd() {
    let left = parsePrimary();
    while (consume("and")) {
      const previous = left;
      const right = parsePrimary();
      left = (values) => previous(values) && right(values);
    }
    return left;
  }

  function parseOr() {
    let left = parseAnd();
    while (consume("or")) {
      const previous = left;
      const right = parseAnd();
      left = (values) => previous(values) || right(values);
    }
    return left;
  }

  if (tokens.length === 0) throw new Error("論理式を入力してください。");
  const fn = parseOr();
  if (index < tokens.length) throw new Error(`${tokens[index].value} の前後を確認してください。`);
  return fn;
}

function tokenizeBooleanFormula(source) {
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if ("xyz".includes(char)) {
      tokens.push({ type: "variable", value: char });
      index += 1;
      continue;
    }
    if (char === "+") {
      tokens.push({ type: "or", value: char });
      index += 1;
      continue;
    }
    if (char === "'") {
      tokens.push({ type: "not", value: char });
      index += 1;
      continue;
    }
    if (char === "(" || char === ")") {
      tokens.push({ type: char, value: char });
      index += 1;
      continue;
    }
    throw new Error(`使えない文字があります: ${char}`);
  }
  return tokens;
}

function parseBooleanFormula(source, allowedNames) {
  const tokens = tokenizeBooleanFormula(source);
  let index = 0;

  function peek() {
    return tokens[index];
  }

  function consume(type) {
    if (peek()?.type !== type) return null;
    index += 1;
    return tokens[index - 1];
  }

  function startsProductTerm(token) {
    return token?.type === "variable" || token?.type === "(";
  }

  function parsePrimary() {
    const token = peek();
    if (!token) throw new Error("式が途中で終わっています。");
    if (token.type === "variable") {
      index += 1;
      if (!allowedNames.includes(token.value)) {
        throw new Error(`${token.value} は現在の変数数では使えません。`);
      }
      return (values) => values[token.value];
    }
    if (consume("(")) {
      const expression = parseSum();
      if (!consume(")")) throw new Error("閉じ括弧 ) が不足しています。");
      return expression;
    }
    throw new Error(`${token.value} の位置を確認してください。`);
  }

  function parsePostfix() {
    let operand = parsePrimary();
    while (consume("not")) {
      const previous = operand;
      operand = (values) => !previous(values);
    }
    return operand;
  }

  function parseProduct() {
    let left = parsePostfix();
    while (startsProductTerm(peek())) {
      const previous = left;
      const right = parsePostfix();
      left = (values) => previous(values) && right(values);
    }
    return left;
  }

  function parseSum() {
    let left = parseProduct();
    while (consume("or")) {
      const previous = left;
      const right = parseProduct();
      left = (values) => previous(values) || right(values);
    }
    return left;
  }

  if (tokens.length === 0) throw new Error("代数式を入力してください。");
  const fn = parseSum();
  if (index < tokens.length) throw new Error(`${tokens[index].value} の前後を確認してください。`);
  return fn;
}

function renderPropositionalTable() {
  const variableCount = Number(tableElements.variableCount.value);
  const names = ["p", "q", "r", "s"].slice(0, variableCount);
  const examples = propositionExamples[variableCount];
  populateFormulaSelect(examples);
  const selectedExample = examples[Number(tableElements.formulaSelect.value) || 0];
  const customFormula = tableElements.customFormulaInput?.value.trim() || "";
  const label = customFormula || selectedExample.label;
  let evaluate = selectedExample.fn;
  if (customFormula) {
    try {
      evaluate = parsePropositionFormula(customFormula, names);
    } catch (error) {
      tableElements.tableTitle.textContent = customFormula;
      tableElements.rowCountBadge.textContent = "-";
      tableElements.tableStage.innerHTML = "";
      setTableMessage(error.message);
      return;
    }
  }
  const rows = rowsForVariables(names);
  const body = rows.map((values) => {
    const result = evaluate(values);
    const cells = names.map((name) => `<td>${tf(values[name])}</td>`).join("");
    return `<tr>${cells}<td class="${result ? "truth-true" : "truth-false"}">${tf(result)}</td></tr>`;
  }).join("");

  tableElements.tableTitle.textContent = label;
  tableElements.rowCountBadge.textContent = `${rows.length} 行`;
  tableElements.tableStage.innerHTML = `
    <div class="logic-table-wrap">
      <table class="logic-table wide-logic-table">
        <thead>
          <tr>${names.map((name) => `<th>${name}</th>`).join("")}<th>${escapeTableHtml(label)}</th></tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
  setTableMessage("");
}

function normalizeFourBitInput(input) {
  const normalized = input.value.replace(/[^01]/g, "").slice(0, 4);
  input.value = normalized;
  return normalized.padEnd(4, "0");
}

function renderBooleanTable() {
  const variableCount = Number(tableElements.variableCount.value);
  const names = ["x", "y", "z"].slice(0, variableCount);
  const examples = booleanExamples[variableCount];
  tableElements.zInputGroup.hidden = variableCount < 3;
  populateFormulaSelect(examples);
  const selectedExample = examples[Number(tableElements.formulaSelect.value) || 0];
  const customFormula = tableElements.customBooleanFormulaInput?.value.trim() || "";
  const label = customFormula || selectedExample.label;
  let evaluate = selectedExample.fn;
  if (customFormula) {
    try {
      evaluate = parseBooleanFormula(customFormula, names);
    } catch (error) {
      tableElements.tableTitle.textContent = customFormula;
      tableElements.rowCountBadge.textContent = "-";
      tableElements.tableStage.innerHTML = "";
      setTableMessage(error.message);
      return;
    }
  }
  const inputs = {
    x: normalizeFourBitInput(tableElements.xInput),
    y: normalizeFourBitInput(tableElements.yInput),
    z: normalizeFourBitInput(tableElements.zInput),
  };
  const rows = Array.from({ length: 4 }, (_, index) => {
    const values = {};
    names.forEach((name) => {
      values[name] = inputs[name][index] === "1";
    });
    return { index, values, result: evaluate(values) };
  });
  const resultText = rows.map((row) => bit(row.result)).join("");
  const body = rows.map((row) => {
    const cells = names.map((name) => `<td>${bit(row.values[name])}</td>`).join("");
    return `<tr><th>${row.index + 1}</th>${cells}<td class="${row.result ? "truth-true" : "truth-false"}">${bit(row.result)}</td></tr>`;
  }).join("");
  const truthRows = rowsForVariables(names);
  const truthBody = truthRows.map((values) => {
    const result = evaluate(values);
    const cells = names.map((name) => `<td>${bit(values[name])}</td>`).join("");
    return `<tr>${cells}<td class="${result ? "truth-true" : "truth-false"}">${bit(result)}</td></tr>`;
  }).join("");
  const truthHeader = names.map((name) => `<th>${name.toUpperCase()}</th>`).join("");

  tableElements.tableTitle.textContent = `${label} = ${resultText}`;
  tableElements.rowCountBadge.textContent = "4 桁";
  tableElements.tableStage.innerHTML = `
    <div class="boolean-result-strip">
      ${names.map((name) => `<span>${name}=${inputs[name]}</span>`).join("")}
      <strong>${escapeTableHtml(label)}=${resultText}</strong>
    </div>
    <div class="logic-table-wrap">
      <table class="logic-table wide-logic-table">
        <thead>
          <tr><th>桁</th>${names.map((name) => `<th>${name}</th>`).join("")}<th>${escapeTableHtml(label)}</th></tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    <section class="truth-output-section" aria-label="各入力値に対する出力値表">
      <h3>各入力値に対する出力値表</h3>
      <div class="logic-table-wrap">
        <table class="logic-table wide-logic-table">
          <thead>
            <tr>${truthHeader}<th>${escapeTableHtml(label)}</th></tr>
          </thead>
          <tbody>${truthBody}</tbody>
        </table>
      </div>
    </section>
  `;
  setTableMessage("");
}

function insertSymbolIntoCustomFormula(symbol) {
  const input = tableElements.customFormulaInput;
  if (!input) return;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.value = `${input.value.slice(0, start)}${symbol}${input.value.slice(end)}`;
  const nextPosition = start + symbol.length;
  input.focus();
  input.setSelectionRange(nextPosition, nextPosition);
  renderPropositionalTable();
}

function insertSymbolIntoCustomBooleanFormula(symbol) {
  const input = tableElements.customBooleanFormulaInput;
  if (!input) return;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.value = `${input.value.slice(0, start)}${symbol}${input.value.slice(end)}`;
  const nextPosition = start + symbol.length;
  input.focus();
  input.setSelectionRange(nextPosition, nextPosition);
  renderBooleanTable();
}

function initializeTablePage() {
  if (!tableElements.variableCount || !tableElements.formulaSelect || !tableElements.tableStage) return;
  const page = document.body.dataset.tablePage;
  const render = page === "boolean-algebra" ? renderBooleanTable : renderPropositionalTable;
  tableElements.variableCount.addEventListener("change", render);
  tableElements.formulaSelect.addEventListener("change", render);
  if (tableElements.customFormulaInput) tableElements.customFormulaInput.addEventListener("input", render);
  tableElements.symbolButtons.forEach((button) => {
    button.addEventListener("click", () => insertSymbolIntoCustomFormula(button.dataset.insertSymbol));
  });
  if (tableElements.customBooleanFormulaInput) {
    tableElements.customBooleanFormulaInput.addEventListener("input", render);
  }
  tableElements.booleanSymbolButtons.forEach((button) => {
    button.addEventListener("click", () => insertSymbolIntoCustomBooleanFormula(button.dataset.insertBooleanSymbol));
  });
  [tableElements.xInput, tableElements.yInput, tableElements.zInput].forEach((input) => {
    if (input) input.addEventListener("input", render);
  });
  render();
}

initializeTablePage();
