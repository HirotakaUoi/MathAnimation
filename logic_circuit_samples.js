const sampleState = {
  selected: "flipflop",
  ffSet: 0,
  ffReset: 0,
  ffOutput: 0,
  halfAdder: { a: 0, b: 0 },
  adder: { a: 0, b: 0, cin: 0 },
  register: "0000",
  cycle: 0,
  storedSum: "0000",
  storedCarry: 0,
  sequenceIndex: 0,
  history: [],
};

const sampleSequence = [["0011", "0101"], ["1110", "0011"], ["0111", "1000"], ["1111", "1111"], ["0010", "0100"]];
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const sampleElements = {
  menuButtons: $$("[data-sample-target]"), panels: $$("[data-sample-panel]"),
  ffSet: $("#ffSet"), ffReset: $("#ffReset"), ffOutput: $("#ffOutput"), ffStage: $("#ffCircuitStage"),
  halfAdderOutput: $("#halfAdderOutput"), halfAdderBits: $$(".half-adder-bit"), halfAdderStage: $("#halfAdderCircuitStage"),
  adderOutput: $("#adderOutput"), adderBits: $$(".adder-bit"), adderStage: $("#adderCircuitStage"),
  registerInput: $("#registerInput"), registerClock: $("#registerClock"), registerOutput: $("#registerOutput"), registerStage: $("#registerCircuitStage"),
  inputA: $("#inputA"), inputB: $("#inputB"), decimalA: $("#decimalA"), decimalB: $("#decimalB"),
  sequenceMode: $("#sequenceMode"), clockButton: $("#clockButton"), resetSequential: $("#resetSequential"),
  sequentialMessage: $("#sequentialMessage"), cycleBadge: $("#cycleBadge"), sequentialStage: $("#sequentialCircuitStage"),
  bitAdderRows: $("#bitAdderRows"), clockHistory: $("#clockHistory"),
};

function sanitizeBits(value, width = 4) {
  return String(value || "").replace(/[^01]/g, "").slice(-width).padStart(width, "0");
}

function signalClass(value) { return value ? "is-true" : "is-false"; }
function wire(path, value, extra = "") { return `<path class="circuit-wire ${signalClass(value)} ${extra}" d="${path}" />`; }
function text(x, y, value, className = "sample-svg-label") { return `<text class="${className}" x="${x}" y="${y}">${value}</text>`; }

function ioNode(x, y, label, value, output = false) {
  return `<g class="circuit-node sample-io-node ${signalClass(value)}"><circle cx="${x}" cy="${y}" r="24"></circle>${text(x, y + 5, `${label}=${value}`)}</g>${output ? "" : ""}`;
}

function gate(type, x, y, value, label = type) {
  const cls = signalClass(value);
  const halfW = 48;
  const halfH = 30;
  if (type === "AND") {
    return `<g class="gate-node ${cls}"><path class="gate-shape ${cls}" d="M${x - halfW} ${y - halfH} L${x + 18} ${y - halfH} A${halfH} ${halfH} 0 0 1 ${x + 18} ${y + halfH} L${x - halfW} ${y + halfH} Z"></path>${text(x - 7, y - 2, label, "gate-main-label")}${text(x - 7, y + 17, `=${value}`, "gate-value-label")}</g>`;
  }
  const xorCurve = type === "XOR" ? `<path class="gate-extra-curve ${cls}" d="M${x - halfW - 10} ${y - halfH} C${x - 35} ${y - 10},${x - 35} ${y + 10},${x - halfW - 10} ${y + halfH}"></path>` : "";
  return `<g class="gate-node ${cls}">${xorCurve}<path class="gate-shape ${cls}" d="M${x - halfW} ${y - halfH} C${x - 30} ${y - 10},${x - 30} ${y + 10},${x - halfW} ${y + halfH} C${x - 5} ${y + halfH},${x + 26} ${y + 18},${x + halfW} ${y} C${x + 26} ${y - 18},${x - 5} ${y - halfH},${x - halfW} ${y - halfH} Z"></path>${text(x - 5, y - 2, label, "gate-main-label")}${text(x - 5, y + 17, `=${value}`, "gate-value-label")}</g>`;
}

function notGate(x, y, input, label = "NOT") {
  const value = Number(!input);
  const cls = signalClass(value);
  return `<g class="not-gate ${cls}"><path class="not-gate-triangle ${cls}" d="M${x - 22} ${y - 22} L${x - 22} ${y + 22} L${x + 15} ${y} Z"></path><circle class="not-gate-bubble ${cls}" cx="${x + 22}" cy="${y}" r="6"></circle>${text(x - 5, y + 5, label, "sample-not-label")}</g>`;
}

function norGate(x, y, value, label = "NOR") {
  const cls = signalClass(value);
  return `<g class="gate-node ${cls}"><path class="gate-shape ${cls}" d="M${x - 48} ${y - 30} C${x - 30} ${y - 10},${x - 30} ${y + 10},${x - 48} ${y + 30} C${x - 5} ${y + 30},${x + 26} ${y + 18},${x + 48} ${y} C${x + 26} ${y - 18},${x - 5} ${y - 30},${x - 48} ${y - 30} Z"></path><circle class="gate-bubble ${cls}" cx="${x + 56}" cy="${y}" r="7"></circle>${text(x - 5, y - 2, label, "gate-main-label")}${text(x - 5, y + 17, `=${value}`, "gate-value-label")}</g>`;
}

function dffBlock(x, y, input, output, label) {
  return `<g class="sample-dff ${signalClass(output)}"><rect x="${x}" y="${y}" width="132" height="82" rx="7"></rect>${text(x + 14, y + 28, `D ${input}`, "sample-dff-pin")}${text(x + 116, y + 28, `${output} Q`, "sample-dff-pin")}${text(x + 66, y + 52, label, "sample-dff-label")}<path d="M${x} ${y + 60} l12 8 l-12 8" class="sample-clock-triangle"></path></g>`;
}

function renderFlipFlopCircuit() {
  const s = sampleState.ffSet;
  const r = sampleState.ffReset;
  const q = sampleState.ffOutput;
  const qBar = Number(!q);
  sampleElements.ffStage.innerHTML = `<svg class="logic-sample-circuit-svg sr-latch-svg" viewBox="0 0 960 340" role="img" aria-label="参照図に合わせたNOR型SRフリップフロップ">
    ${text(480, 28, "NOR型 SR フリップフロップ", "sample-layer-label")}
    <circle class="sample-circuit-terminal ${signalClass(r)}" cx="90" cy="100" r="5"></circle>
    <circle class="sample-circuit-terminal ${signalClass(s)}" cx="90" cy="260" r="5"></circle>
    ${text(68, 105, "R", "sample-terminal-label")}${text(68, 265, "S", "sample-terminal-label")}
    ${wire("M95 100 L382 100", r)}${wire("M95 260 L382 260", s)}
    ${norGate(430, 120, q)}${norGate(430, 240, qBar)}
    ${wire("M493 120 L865 120", q)}${wire("M493 240 L865 240", qBar)}
    <circle class="sample-circuit-terminal ${signalClass(q)}" cx="870" cy="120" r="5"></circle>
    <circle class="sample-circuit-terminal ${signalClass(qBar)}" cx="870" cy="240" r="5"></circle>
    ${text(895, 125, "Q", "sample-terminal-label")}${text(895, 245, "Q̅", "sample-terminal-label")}
    ${wire("M540 120 L540 150 L340 190 L340 220 L382 220", q, "feedback-wire")}
    ${wire("M540 240 L540 210 L340 170 L340 140 L382 140", qBar, "feedback-wire")}
    <circle class="sample-wire-junction ${signalClass(q)}" cx="540" cy="120" r="5"></circle>
    <circle class="sample-wire-junction ${signalClass(qBar)}" cx="540" cy="240" r="5"></circle>
  </svg>`;
}

function renderAdderCircuit() {
  const { a, b, cin } = sampleState.adder;
  const p = xorGate(a, b);
  const carry1 = Number(Boolean(a && b));
  const sum = xorGate(p, cin);
  const carry2 = Number(Boolean(p && cin));
  const cout = Number(Boolean(carry1 || carry2));
  sampleElements.adderStage.innerHTML = `<svg class="logic-sample-circuit-svg" viewBox="0 0 1120 460" role="img" aria-label="半加算器2個とORで構成した1ビット全加算器">
    ${text(560, 38, "半加算器を回路素子として組み合わせる", "sample-layer-label")}
    ${ioNode(55, 105, "A", a)}${ioNode(55, 205, "B", b)}${ioNode(55, 365, "Cin", cin)}
    ${wire("M79 105 C145 105 170 120 230 120", a)}${wire("M79 205 C145 205 170 180 230 180", b)}
    ${halfAdderModule(230, 80, "HA 1", p, carry1)}
    ${wire("M420 120 L570 120", p)}${wire("M79 365 C350 365 430 180 570 180", cin)}
    ${halfAdderModule(570, 80, "HA 2", sum, carry2)}
    ${wire("M760 120 L990 120", sum)}${ioNode(1025, 120, "S", sum, true)}
    ${wire("M420 180 C600 180 700 250 832 250", carry1)}${wire("M760 180 C795 180 810 290 832 290", carry2)}
    ${gate("OR", 880, 270, cout, "OR")}${wire("M928 270 L990 270", cout)}${ioNode(1025, 270, "Cout", cout, true)}
    ${text(495, 105, `P=${p}`, "sample-wire-label")}${text(635, 230, `C1=${carry1}`, "sample-wire-label")}${text(790, 205, `C2=${carry2}`, "sample-wire-label")}
  </svg>`;
}

function halfAdderModule(x, y, label, sum, carry) {
  return `<g class="sample-half-adder ${signalClass(sum || carry)}">
    <rect x="${x}" y="${y}" width="190" height="140" rx="10"></rect>
    ${text(x + 95, y + 42, label, "sample-half-adder-title")}
    ${text(x + 95, y + 68, "半加算器", "sample-half-adder-subtitle")}
    ${text(x + 18, y + 44, "A", "sample-half-adder-pin")}${text(x + 18, y + 104, "B", "sample-half-adder-pin")}
    ${text(x + 172, y + 44, `S=${sum}`, "sample-half-adder-pin")}${text(x + 172, y + 104, `C=${carry}`, "sample-half-adder-pin")}
  </g>`;
}

function renderHalfAdderCircuit() {
  const { a, b } = sampleState.halfAdder;
  const sum = xorGate(a, b);
  const carry = Number(Boolean(a && b));
  sampleElements.halfAdderStage.innerHTML = `<svg class="logic-sample-circuit-svg" viewBox="0 0 900 380" role="img" aria-label="XORとANDで構成した1ビット半加算器">
    ${text(450, 36, "1ビット半加算器", "sample-layer-label")}
    ${ioNode(70, 110, "A", a)}${ioNode(70, 270, "B", b)}
    ${wire("M94 110 C190 110 250 100 352 100", a)}
    ${wire("M94 270 C190 270 250 140 352 140", b)}
    ${wire("M94 110 C190 110 250 240 352 240", a)}
    ${wire("M94 270 C190 270 250 280 352 280", b)}
    ${gate("XOR", 400, 120, sum, "XOR")}${gate("AND", 400, 260, carry, "AND")}
    ${wire("M448 120 L760 120", sum)}${wire("M448 260 L760 260", carry)}
    ${ioNode(795, 120, "S", sum, true)}${ioNode(795, 260, "C", carry, true)}
    ${text(605, 102, `S=A⊕B=${sum}`, "sample-wire-label")}${text(605, 242, `C=A∧B=${carry}`, "sample-wire-label")}
  </svg>`;
}

function renderRegisterCircuit() {
  const input = sanitizeBits(sampleElements.registerInput.value);
  const output = sampleState.register;
  const rows = [0, 1, 2, 3].map((index) => {
    const bit = 3 - index;
    const y = 72 + index * 105;
    const d = Number(input[index]);
    const q = Number(output[index]);
    return `${ioNode(70, y + 41, `D${bit}`, d)}${wire(`M94 ${y + 41} L350 ${y + 41}`, d)}${dffBlock(350, y, d, q, `D-FF ${bit}`)}${wire(`M482 ${y + 41} L690 ${y + 41}`, q)}${ioNode(720, y + 41, `Q${bit}`, q, true)}${wire(`M320 520 L320 ${y + 68} L350 ${y + 68}`, 0, "clock-wire")}`;
  }).join("");
  sampleElements.registerStage.innerHTML = `<svg class="logic-sample-circuit-svg register-svg" viewBox="0 0 790 570" role="img" aria-label="共通クロックで接続した4ビットレジスタ">
    ${text(70, 35, "入力 D[3:0]", "sample-layer-label")}${text(416, 35, "4 × Dフリップフロップ", "sample-layer-label")}${text(720, 35, "出力 Q[3:0]", "sample-layer-label")}${rows}
    ${ioNode(105, 520, "CLK", 0)}${wire("M129 520 L620 520", 0, "clock-wire")}${text(475, 548, "全D-FFへ共通の立ち上がりクロック", "sample-wire-label")}
  </svg>`;
}

function xorGate(a, b) { return Number(Boolean(a) !== Boolean(b)); }
function fullAdder(a, b, cin) {
  const propagate = xorGate(a, b);
  return { propagate, sum: xorGate(propagate, cin), carry: Number(Boolean((a && b) || (propagate && cin))) };
}

function calculateFourBit(aBits, bBits) {
  const a = Number.parseInt(aBits, 2); const b = Number.parseInt(bBits, 2);
  let carry = 0; const stages = []; const sumBits = [];
  for (let bit = 0; bit < 4; bit += 1) {
    const ai = (a >> bit) & 1; const bi = (b >> bit) & 1; const cin = carry; const result = fullAdder(ai, bi, cin);
    carry = result.carry; sumBits.unshift(String(result.sum)); stages.push({ bit, a: ai, b: bi, cin, sum: result.sum, carry });
  }
  return { a, b, sum: sumBits.join(""), carry, stages, total: a + b };
}

function currentCalculation() {
  const aBits = sanitizeBits(sampleElements.inputA.value); const bBits = sanitizeBits(sampleElements.inputB.value);
  return { aBits, bBits, ...calculateFourBit(aBits, bBits) };
}

function fullAdderBlock(x, stage) {
  const y = 155;
  return `<g class="sample-fa ${signalClass(stage.sum)}"><rect x="${x}" y="${y}" width="150" height="120" rx="12"></rect>${text(x + 75, y + 42, `FULL ADDER ${stage.bit}`, "sample-fa-title")}${text(x + 75, y + 68, "XOR / AND / OR", "sample-fa-subtitle")}${text(x + 75, y + 98, `S${stage.bit}=${stage.sum}`, "sample-fa-value")}</g>`;
}

function renderSequentialCircuit(result) {
  const ordered = [...result.stages];
  const xs = [150, 375, 600, 825];
  const adders = ordered.map((stage, index) => {
    const x = xs[index];
    return `${fullAdderBlock(x, stage)}${text(x + 28, 125, `A${stage.bit}=${stage.a}`, "sample-input-label")}${text(x + 120, 125, `B${stage.bit}=${stage.b}`, "sample-input-label")}${wire(`M${x + 28} 132 L${x + 28} 155`, stage.a)}${wire(`M${x + 120} 132 L${x + 120} 155`, stage.b)}${wire(`M${x + 75} 275 L${x + 75} 360`, stage.sum)}${text(x + 75, 340, `S${stage.bit}`, "sample-output-label")}`;
  }).join("");
  const carryWires = ordered.slice(0, 3).map((stage, index) => wire(`M${xs[index] + 150} 215 L${xs[index + 1]} 215`, stage.carry, "carry-wire")).join("");
  const carryLabels = ordered.slice(0, 3).map((stage, index) => text(xs[index] + 175, 203, `C${stage.bit + 1}=${stage.carry}`, "sample-carry-label")).join("");
  const finalCarry = result.carry;
  return `<svg class="logic-sample-circuit-svg sequential-svg" viewBox="0 0 1200 600" role="img" aria-label="4個の全加算器と5ビット出力レジスタを接続した連続加算器">
    ${text(555, 42, `入力 A=${result.aBits} / B=${result.bBits}`, "sample-layer-label")}${text(555, 78, "キャリー伝搬式 4ビット加算器", "sample-section-label")}
    ${ioNode(65, 215, "Cin", 0)}${wire("M89 215 L150 215", 0, "carry-wire")}${adders}${carryWires}${carryLabels}
    ${wire("M975 215 L1040 215 L1040 360", finalCarry, "carry-wire")}${text(1065, 245, `Cout=${finalCarry}`, "sample-carry-label")}
    <g class="sample-register-module ${signalClass(sampleState.storedCarry || Number.parseInt(sampleState.storedSum, 2))}">
      <rect x="145" y="360" width="900" height="135" rx="12"></rect>
      ${text(595, 395, "5-BIT OUTPUT REGISTER", "sample-register-module-title")}
      ${text(295, 442, `D = ${result.carry} ${result.sum}`, "sample-register-module-value")}
      ${text(595, 442, "CLK ↑ で一括保存", "sample-register-module-clock")}
      ${text(875, 442, `Q = ${sampleState.storedCarry} ${sampleState.storedSum}`, "sample-register-module-value")}
      <path d="M145 445 l14 9 l-14 9" class="sample-clock-triangle"></path>
    </g>
    ${ioNode(65, 455, "CLK", 0)}${wire("M89 455 L145 455", 0, "clock-wire")}
    ${wire(`M1045 427 L1135 427`, sampleState.storedCarry || Number.parseInt(sampleState.storedSum, 2))}${ioNode(1165, 427, "Q", Number(Boolean(sampleState.storedCarry || Number.parseInt(sampleState.storedSum, 2))), true)}
    ${text(595, 545, `保存値 = ${sampleState.storedCarry} ${sampleState.storedSum}（10進 ${Number.parseInt(`${sampleState.storedCarry}${sampleState.storedSum}`, 2)}）`, "sample-register-value")}
  </svg>`;
}

function renderHistory() {
  sampleElements.clockHistory.innerHTML = sampleState.history.length ? sampleState.history.map((item) => `<li><span>#${item.cycle}</span><code>${item.a} + ${item.b}</code><strong>${item.carry} ${item.sum}</strong><small>${item.total}</small></li>`).join("") : '<li class="empty-history">まだ保存されていません。</li>';
}

function renderSequential() {
  const result = currentCalculation();
  sampleElements.inputA.value = result.aBits; sampleElements.inputB.value = result.bBits;
  sampleElements.decimalA.textContent = result.a; sampleElements.decimalB.textContent = result.b;
  sampleElements.cycleBadge.textContent = `cycle ${sampleState.cycle}`;
  sampleElements.sequentialStage.innerHTML = renderSequentialCircuit(result);
  sampleElements.bitAdderRows.innerHTML = [...result.stages].reverse().map((stage) => `<div class="bit-adder-row ${stage.carry ? "has-carry" : ""}"><strong>bit ${stage.bit}</strong><span>A=${stage.a}</span><span>B=${stage.b}</span><span>Cin=${stage.cin}</span><b>S=${stage.sum}</b><b>Cout=${stage.carry}</b></div>`).join("");
  renderHistory();
}

function updateFlipFlop() {
  sampleElements.ffSet.textContent = `S = ${sampleState.ffSet}`; sampleElements.ffSet.setAttribute("aria-pressed", String(Boolean(sampleState.ffSet))); sampleElements.ffSet.classList.toggle("is-on", Boolean(sampleState.ffSet));
  sampleElements.ffReset.textContent = `R = ${sampleState.ffReset}`; sampleElements.ffReset.setAttribute("aria-pressed", String(Boolean(sampleState.ffReset))); sampleElements.ffReset.classList.toggle("is-on", Boolean(sampleState.ffReset));
  sampleElements.ffOutput.textContent = `Q=${sampleState.ffOutput}`; sampleElements.ffOutput.className = signalClass(sampleState.ffOutput); renderFlipFlopCircuit();
}

function updateMiniAdder() {
  const result = fullAdder(sampleState.adder.a, sampleState.adder.b, sampleState.adder.cin);
  sampleElements.adderBits.forEach((button) => { const value = sampleState.adder[button.dataset.adderBit]; const label = button.dataset.adderBit === "cin" ? "Cin" : button.dataset.adderBit.toUpperCase(); button.textContent = `${label} = ${value}`; button.setAttribute("aria-pressed", String(Boolean(value))); button.classList.toggle("is-on", Boolean(value)); });
  sampleElements.adderOutput.textContent = `S=${result.sum} / Cout=${result.carry}`; sampleElements.adderOutput.className = signalClass(result.sum || result.carry); renderAdderCircuit();
}

function updateHalfAdder() {
  const result = { sum: xorGate(sampleState.halfAdder.a, sampleState.halfAdder.b), carry: Number(Boolean(sampleState.halfAdder.a && sampleState.halfAdder.b)) };
  sampleElements.halfAdderBits.forEach((button) => {
    const key = button.dataset.halfAdderBit;
    const value = sampleState.halfAdder[key];
    button.textContent = `${key.toUpperCase()} = ${value}`;
    button.setAttribute("aria-pressed", String(Boolean(value)));
    button.classList.toggle("is-on", Boolean(value));
  });
  sampleElements.halfAdderOutput.textContent = `S=${result.sum} / C=${result.carry}`;
  sampleElements.halfAdderOutput.className = signalClass(result.sum || result.carry);
  renderHalfAdderCircuit();
}

function selectSample(name) {
  sampleState.selected = name;
  sampleElements.menuButtons.forEach((button) => { const active = button.dataset.sampleTarget === name; button.classList.toggle("is-active", active); button.setAttribute("aria-selected", String(active)); });
  sampleElements.panels.forEach((panel) => { panel.hidden = panel.dataset.samplePanel !== name; });
}

function clockSequential() {
  const result = currentCalculation(); sampleState.cycle += 1; sampleState.storedSum = result.sum; sampleState.storedCarry = result.carry;
  sampleState.history.unshift({ cycle: sampleState.cycle, a: result.aBits, b: result.bBits, sum: result.sum, carry: result.carry, total: result.total }); sampleState.history = sampleState.history.slice(0, 8);
  sampleElements.sequentialMessage.textContent = `cycle ${sampleState.cycle}: ${result.aBits} + ${result.bBits} = ${result.carry} ${result.sum} を出力レジスタへ保存しました。`;
  if (sampleElements.sequenceMode.checked) { sampleState.sequenceIndex = (sampleState.sequenceIndex + 1) % sampleSequence.length; [sampleElements.inputA.value, sampleElements.inputB.value] = sampleSequence[sampleState.sequenceIndex]; }
  renderSequential();
}

sampleElements.menuButtons.forEach((button) => button.addEventListener("click", () => selectSample(button.dataset.sampleTarget)));
sampleElements.ffSet.addEventListener("click", () => { sampleState.ffSet = Number(!sampleState.ffSet); if (sampleState.ffSet) { sampleState.ffReset = 0; sampleState.ffOutput = 1; } updateFlipFlop(); });
sampleElements.ffReset.addEventListener("click", () => { sampleState.ffReset = Number(!sampleState.ffReset); if (sampleState.ffReset) { sampleState.ffSet = 0; sampleState.ffOutput = 0; } updateFlipFlop(); });
sampleElements.halfAdderBits.forEach((button) => button.addEventListener("click", () => { const key = button.dataset.halfAdderBit; sampleState.halfAdder[key] = Number(!sampleState.halfAdder[key]); updateHalfAdder(); }));
sampleElements.adderBits.forEach((button) => button.addEventListener("click", () => { const key = button.dataset.adderBit; sampleState.adder[key] = Number(!sampleState.adder[key]); updateMiniAdder(); }));
sampleElements.registerInput.addEventListener("input", () => { sampleElements.registerInput.value = sanitizeBits(sampleElements.registerInput.value); renderRegisterCircuit(); });
sampleElements.registerClock.addEventListener("click", () => { sampleState.register = sanitizeBits(sampleElements.registerInput.value); sampleElements.registerOutput.textContent = `Q=${sampleState.register}`; sampleElements.registerOutput.className = signalClass(Number.parseInt(sampleState.register, 2)); renderRegisterCircuit(); });
[sampleElements.inputA, sampleElements.inputB].forEach((input) => { input.addEventListener("input", () => { input.value = sanitizeBits(input.value); renderSequential(); }); input.addEventListener("focus", () => input.select()); });
sampleElements.clockButton.addEventListener("click", clockSequential);
sampleElements.resetSequential.addEventListener("click", () => { sampleState.cycle = 0; sampleState.storedSum = "0000"; sampleState.storedCarry = 0; sampleState.sequenceIndex = 0; sampleState.history = []; [sampleElements.inputA.value, sampleElements.inputB.value] = sampleSequence[0]; sampleElements.sequentialMessage.textContent = "リセットしました。次の CLK ↑ で入力を保存します。"; renderSequential(); });

updateFlipFlop(); updateHalfAdder(); updateMiniAdder(); renderRegisterCircuit(); renderSequential(); selectSample("flipflop");
