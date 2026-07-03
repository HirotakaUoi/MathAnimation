const elements = {
  puzzleSelect: document.querySelector("#puzzleSelect"),
  generatePuzzle: document.querySelector("#generatePuzzle"),
  message: document.querySelector("#message"),
  puzzleTitle: document.querySelector("#puzzleTitle"),
  puzzleSubtitle: document.querySelector("#puzzleSubtitle"),
  answerBadge: document.querySelector("#answerBadge"),
  problemText: document.querySelector("#problemText"),
  logicText: document.querySelector("#logicText"),
  candidateTable: document.querySelector("#candidateTable"),
  answerText: document.querySelector("#answerText"),
};

const state = {
  puzzleIndex: 0,
  generatedPuzzle: null,
};

const GUARDS = ["A", "B", "C"];
const TRIBES = ["honest", "liar", "normal"];
const ROAD_SETS = [
  ["left", "right"],
  ["left", "center", "right"],
];
const GUARD_SCENARIOS = [
  {
    id: "with-normal",
    guards: ["A", "B", "C"],
    tribes: TRIBES,
    subtitle: "正直族・うそつき族・普通人族から天国の道を判定する",
    setup: "その前に、正直族・うそつき族・普通人族の3人の門番 A, B, C が1人ずつ立っている。",
    rule: "正直族は必ず真実を答え、うそつき族は必ず反対を答え、普通人族は真偽に関係なく「はい」「いいえ」のどちらも答えうる。",
    candidateCount: (roads) => 6 * roads.length,
    candidateLogic: (roads) => `候補は、A, B, C に正直族・うそつき族・普通人族を1つずつ割り当て、天国の道を${roads.map(roadLabel).join("/")}で分けた${6 * roads.length}通り。`,
    answerLogic: "正直族なら Q の真偽どおり、うそつき族なら Q と反対、普通人族なら「はい」「いいえ」のどちらも候補として残す。",
  },
  {
    id: "without-normal",
    guards: ["A", "B"],
    tribes: ["honest", "liar"],
    subtitle: "正直族とうそつき族だけから天国の道を判定する",
    setup: "その前に、正直族とうそつき族の2人の門番 A, B が1人ずつ立っている。",
    rule: "正直族は必ず真実を答え、うそつき族は必ず反対を答える。普通人族はいない。",
    candidateCount: (roads) => 2 * roads.length,
    candidateLogic: (roads) => `候補は、A, B に正直族とうそつき族を1人ずつ割り当て、天国の道を${roads.map(roadLabel).join("/")}で分けた${2 * roads.length}通り。`,
    answerLogic: "正直族なら Q の真偽どおり、うそつき族なら Q と反対に答える。",
  },
];

function noteTruth(value) {
  return value ? "真" : "偽";
}

function roomLabel(value) {
  if (value === "jewel") return "宝石";
  if (value === "tiger") return "虎";
  if (value === "empty") return "空室";
  return value;
}

function roomClass(value) {
  if (value === "宝石" || value === "Aタイプ" || value === "可") return "truth-true";
  if (value === "虎" || value === "Bタイプ" || value === "不可") return "truth-false";
  return "";
}

function createPuzzleOneRows() {
  return [
    { A: "jewel", B: "tiger" },
    { A: "tiger", B: "jewel" },
  ].map((row) => {
    const a = row.A === "jewel";
    const b = row.B === "jewel";
    const noteA = a && !b;
    const noteB = (a && !b) || (!a && b);
    const valid = noteA !== noteB;
    return {
      values: [roomLabel(row.A), roomLabel(row.B), noteTruth(noteA), noteTruth(noteB), valid ? "残す" : "除外"],
      valid,
    };
  });
}

function createPuzzleTwoRows() {
  return [
    { A: "jewel", B: "tiger", C: "tiger" },
    { A: "tiger", B: "jewel", C: "tiger" },
    { A: "tiger", B: "tiger", C: "jewel" },
  ].map((row) => {
    const a = row.A === "jewel";
    const b = row.B === "jewel";
    const noteA = !a;
    const noteB = b;
    const noteC = !b;
    const trueCount = [noteA, noteB, noteC].filter(Boolean).length;
    const valid = trueCount <= 1;
    return {
      values: [roomLabel(row.A), roomLabel(row.B), roomLabel(row.C), noteTruth(noteA), noteTruth(noteB), noteTruth(noteC), `${trueCount}個`, valid ? "残す" : "除外"],
      valid,
    };
  });
}

function createPuzzleThreeRows() {
  const rows = [
    { A: "jewel", B: "tiger", C: "empty" },
    { A: "jewel", B: "empty", C: "tiger" },
    { A: "tiger", B: "jewel", C: "empty" },
    { A: "tiger", B: "empty", C: "jewel" },
    { A: "empty", B: "jewel", C: "tiger" },
    { A: "empty", B: "tiger", C: "jewel" },
  ];
  return rows.map((row) => {
    const noteA = row.C === "empty";
    const noteB = row.A === "tiger";
    const noteC = row.C === "empty";
    const noteByRoom = { A: noteA, B: noteB, C: noteC };
    const valid = ["A", "B", "C"].every((room) => {
      if (row[room] === "jewel") return noteByRoom[room];
      if (row[room] === "tiger") return !noteByRoom[room];
      return true;
    });
    return {
      values: [roomLabel(row.A), roomLabel(row.B), roomLabel(row.C), noteTruth(noteA), noteTruth(noteB), noteTruth(noteC), valid ? "残す" : "除外"],
      valid,
    };
  });
}

function createIslandRows() {
  const rows = [
    { X: "Aタイプ", Y: "Aタイプ" },
    { X: "Aタイプ", Y: "Bタイプ" },
    { X: "Bタイプ", Y: "Aタイプ" },
    { X: "Bタイプ", Y: "Bタイプ" },
  ];
  return rows.map((row) => {
    const xIsA = row.X === "Aタイプ";
    const questionTruth = row.Y === "Aタイプ";
    const canAsk = xIsA ? questionTruth : !questionTruth;
    return {
      values: [row.X, row.Y, noteTruth(questionTruth), canAsk ? "可" : "不可", canAsk ? "残す" : "除外"],
      valid: canAsk,
    };
  });
}

function tribeLabel(value) {
  if (value === "honest") return "正直族";
  if (value === "liar") return "うそつき族";
  if (value === "normal") return "普通人族";
  return value;
}

function roadLabel(value) {
  if (value === "left") return "左";
  if (value === "center") return "中央";
  return "右";
}

function answerLabel(value) {
  if (value === true) return "はい";
  if (value === false) return "いいえ";
  return "どちらも";
}

function createGuardCandidates(scenario, roads) {
  const candidates = [];
  function assignTribes(index, tribes) {
    if (index === scenario.guards.length) {
      if (new Set(Object.values(tribes)).size !== scenario.guards.length) return;
      roads.forEach((heavenRoad) => candidates.push({ tribes: { ...tribes }, heavenRoad }));
      return;
    }
    const guard = scenario.guards[index];
    scenario.tribes.forEach((tribe) => {
      assignTribes(index + 1, { ...tribes, [guard]: tribe });
    });
  }
  assignTribes(0, {});
  return candidates;
}

function createQuestionChoicesForGuard(guard, scenario, roads) {
  const others = scenario.guards.filter((item) => item !== guard);
  const questions = roads.flatMap((road) => [
    {
      text: `${roadLabel(road)}の道は天国の道ですか。`,
      logic: `Q(${guard})=${roadLabel(road)}が天国`,
      evaluate: (candidate) => candidate.heavenRoad === road,
    },
    {
      text: `あなたに『${roadLabel(road)}の道は天国の道ですか』と聞いたら、あなたは『はい』と答えますか。`,
      logic: `Q(${guard})=「${roadLabel(road)}が天国か」と聞かれたら${guard}が「はい」と答える`,
      forceTruthfulAnswer: true,
      evaluate: (candidate) => candidate.heavenRoad === road,
    },
  ]);
  questions.push(
    {
      text: "あなたは正直族ですか。",
      logic: `Q(${guard})=${guard}が正直族`,
      evaluate: (candidate) => candidate.tribes[guard] === "honest",
    },
  );
  if (scenario.tribes.includes("normal")) {
    questions.push({
      text: "あなたは普通人族ですか。",
      logic: `Q(${guard})=${guard}が普通人族`,
      evaluate: (candidate) => candidate.tribes[guard] === "normal",
    });
  }
  others.forEach((other) => {
    questions.push({
      text: `${other}は正直族ですか。`,
      logic: `Q(${guard})=${other}が正直族`,
      evaluate: (candidate) => candidate.tribes[other] === "honest",
    });
    questions.push({
      text: `${other}はうそつき族ですか。`,
      logic: `Q(${guard})=${other}がうそつき族`,
      evaluate: (candidate) => candidate.tribes[other] === "liar",
    });
    if (scenario.tribes.includes("normal")) {
      questions.push({
        text: `${other}は普通人族ですか。`,
        logic: `Q(${guard})=${other}が普通人族`,
        evaluate: (candidate) => candidate.tribes[other] === "normal",
      });
    }
  });
  return questions;
}

function possibleAnswer(candidate, guard, question) {
  const truth = question.evaluate(candidate);
  if (question.forceTruthfulAnswer && candidate.tribes[guard] !== "normal") return [truth];
  if (candidate.tribes[guard] === "honest") return [truth];
  if (candidate.tribes[guard] === "liar") return [!truth];
  return [true, false];
}

function generateObservedAnswers(hiddenCandidate, questions) {
  return Object.fromEntries(Object.keys(questions).map((guard) => {
    const possible = possibleAnswer(hiddenCandidate, guard, questions[guard]);
    return [guard, possible[Math.floor(Math.random() * possible.length)]];
  }));
}

function matchesObservedAnswers(candidate, questions, observedAnswers, guards) {
  return guards.every((guard) => (
    possibleAnswer(candidate, guard, questions[guard]).includes(observedAnswers[guard])
  ));
}

function createGeneratedRows(questions, observedAnswers, scenario, roads) {
  return () => createGuardCandidates(scenario, roads).map((candidate) => {
    const answerDisplays = scenario.guards.map((guard) => {
      const possible = possibleAnswer(candidate, guard, questions[guard]);
      return possible.length === 2 ? "どちらも" : answerLabel(possible[0]);
    });
    const valid = matchesObservedAnswers(candidate, questions, observedAnswers, scenario.guards);
    return {
      values: [
        `${roadLabel(candidate.heavenRoad)}の道`,
        ...scenario.guards.map((guard) => tribeLabel(candidate.tribes[guard])),
        ...answerDisplays,
        valid ? "残す" : "除外",
      ],
      valid,
    };
  });
}

function sampleOne(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function buildGeneratedPuzzleCandidate(target) {
  for (let attempt = 0; attempt < 900; attempt += 1) {
    const scenario = sampleOne(GUARD_SCENARIOS);
    const roads = sampleOne(ROAD_SETS);
    const candidates = createGuardCandidates(scenario, roads);
    const hiddenCandidate = sampleOne(candidates);
    const questions = Object.fromEntries(scenario.guards.map((guard) => [
      guard,
      sampleOne(createQuestionChoicesForGuard(guard, scenario, roads)),
    ]));
    const observedAnswers = generateObservedAnswers(hiddenCandidate, questions);
    const validRows = createGeneratedRows(questions, observedAnswers, scenario, roads)()
      .filter((row) => row.valid);
    const possibleRoads = new Set(validRows.map((row) => row.values[0]));
    if (validRows.length === 0) continue;

    const answerRoads = [...possibleRoads];
    const isDecidable = answerRoads.length === 1;
    if (target === "decidable" && !isDecidable) continue;
    if (target === "ambiguous" && isDecidable) continue;
    const answerText = isDecidable ? answerRoads[0] : "判定不能";
    return {
      title: "自動生成",
      subtitle: `${scenario.guards.length}人の門番、${scenario.subtitle}`,
      badge: isDecidable ? `答え: ${answerText}` : "判定不能",
      headers: ["天国の道", ...scenario.guards, ...scenario.guards.map((guard) => `${guard}の返答`), "判定"],
      rows: createGeneratedRows(questions, observedAnswers, scenario, roads),
      problem: [
        `目の前に${roads.length}つの分かれ道（${roads.map((road) => `${roadLabel(road)}の道`).join("・")}）があり、1つだけが天国の道である。`,
        scenario.setup,
        scenario.rule,
        "あなたは門番それぞれに1回だけ、はい/いいえで答えられる質問をした。",
        ...scenario.guards.map((guard) => `${guard}への質問: 「${questions[guard].text}」 ${guard}の返答: 「${answerLabel(observedAnswers[guard])}」。`),
        `天国の道は${roads.map(roadLabel).join("・")}のどれか。`,
      ],
      logic: [
        scenario.candidateLogic(roads),
        ...scenario.guards.map((guard) => questions[guard].logic),
        scenario.answerLogic,
        `${scenario.guards.length}人の返答すべてと一致する候補だけを残し、残った候補の天国の道を比べる。`,
      ],
      answer: isDecidable
        ? `候補表で残る行では、天国の道がすべて${answerText}になる。したがって、${answerText}を選ぶ。`
        : `候補表で残る行の天国の道が ${answerRoads.join("、")} に分かれる。したがって、この質問と返答だけでは天国の道を判定できない。`,
    };
  }
  return null;
}

function buildGeneratedPuzzle() {
  const target = Math.random() < 0.15 ? "ambiguous" : "decidable";
  return buildGeneratedPuzzleCandidate(target)
    || buildGeneratedPuzzleCandidate("decidable")
    || buildGeneratedPuzzleCandidate("any");
}

const PUZZLES = [
  {
    title: "囚人のジレンマ？ その1",
    subtitle: "2つの扉、注意書きのうち一方だけが真",
    badge: "答え: B",
    headers: ["A", "B", "Aの注意書き", "Bの注意書き", "判定"],
    rows: createPuzzleOneRows,
    problem: [
      "扉 A と B のどちらかに宝石、もう一方に虎がいる。",
      "Aの注意書き: この部屋に宝石が、もう一つの部屋に虎がいる。",
      "Bの注意書き: 二部屋のどちらかに宝石が、どちらかに虎がいる。",
      "注意書きはちょうど一方だけが真である。どちらを選ぶか。",
    ],
    logic: [
      "A: Aに宝石がある、B: Bに宝石がある、と置く。",
      "Aの注意書きは A ∧ ~B。",
      "Bの注意書きは (A ∧ ~B) ∨ (~A ∧ B)。",
      "条件は (Aの注意書き) xor (Bの注意書き)。",
    ],
    answer: "Aが宝石なら両方の注意書きが真になり、条件に合わない。Bが宝石ならAの注意書きだけが偽、Bの注意書きだけが真になるので、Bを選ぶ。",
  },
  {
    title: "囚人のジレンマ？ その2",
    subtitle: "3つの扉、真の注意書きは高々1つ",
    badge: "答え: A",
    headers: ["A", "B", "C", "P(A)", "P(B)", "P(C)", "真の数", "判定"],
    rows: createPuzzleTwoRows,
    problem: [
      "扉 A, B, C のどれか1つに宝石があり、残り2つには虎がいる。",
      "Aの注意書き: この部屋に虎がいる。",
      "Bの注意書き: この部屋に宝石がある。",
      "Cの注意書き: Bの部屋に虎がいる。",
      "真の注意書きは0個または1個だけである。どの扉を選ぶか。",
    ],
    logic: [
      "A, B, C をそれぞれ「その扉に宝石がある」という命題にする。",
      "P(A)=~A、P(B)=B、P(C)=~B。",
      "候補は A, B, C のどれか1つだけが真である3通り。",
      "条件は P(A), P(B), P(C) の真の数が1以下であること。",
    ],
    answer: "Aに宝石があるときだけ、真の注意書きが1個になる。BまたはCに宝石があると真の注意書きが2個になってしまうので、Aを選ぶ。",
  },
  {
    title: "囚人のジレンマ？ その3",
    subtitle: "宝石・虎・空室と注意書きの真偽",
    badge: "答え: A",
    headers: ["A", "B", "C", "P(A)", "P(B)", "P(C)", "判定"],
    rows: createPuzzleThreeRows,
    problem: [
      "扉 A, B, C には宝石、虎、空室が1つずつ入っている。",
      "Aの注意書き: Cの部屋は空室。",
      "Bの注意書き: Aの部屋には虎がいる。",
      "Cの注意書き: この部屋は空室。",
      "宝石の部屋の注意書きは真、虎の部屋の注意書きは偽、空室の注意書きは真偽不問である。",
    ],
    logic: [
      "P(A)=(C=空室)、P(B)=(A=虎)、P(C)=(C=空室)。",
      "宝石の部屋 x では x=宝石 => P(x)。",
      "虎の部屋 x では x=虎 => ~P(x)。",
      "空室では制約を置かない。6通りの配置をすべて調べる。",
    ],
    answer: "Cが宝石なら P(C) は偽になり矛盾する。Cが虎なら P(A) が偽なので A は宝石になれず、残りの条件も矛盾する。Cが空室なら P(A) は真、A=宝石、B=虎 が条件をすべて満たすため、Aを選ぶ。",
  },
  {
    title: "質問者の島",
    subtitle: "質問できるかどうかを命題の真偽で判定する",
    badge: "XとYは同型",
    headers: ["X", "Y", "質問の正解", "Xは質問できるか", "判定"],
    rows: createIslandRows,
    problem: [
      "島の住人は Aタイプか Bタイプのどちらかである。",
      "Aタイプは、正解が YES である質問しかしない。",
      "Bタイプは、正解が NO である質問しかしない。",
      "XがYに『YはAタイプですか』と質問した。この発話から何が分かるか。",
    ],
    logic: [
      "命題 Q を『YはAタイプである』と置く。",
      "XがAタイプなら、Xは Q が真のときだけ質問できる。",
      "XがBタイプなら、Xは Q が偽のときだけ質問できる。",
      "したがって、Xが質問できる条件は (X=A ∧ Q) ∨ (X=B ∧ ~Q)。",
    ],
    answer: "残る候補は X=A, Y=A と X=B, Y=B の2通り。つまり、この質問ができたなら XとYは同じタイプだと分かる。",
  },
];

function setMessage(text = "") {
  elements.message.textContent = text;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function renderList(container, items) {
  container.innerHTML = `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderTable(puzzle) {
  const rows = puzzle.rows();
  const headerHtml = puzzle.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const bodyHtml = rows.map((row) => {
    const cells = row.values.map((value) => {
      const className = roomClass(value);
      return `<td${className ? ` class="${className}"` : ""}>${escapeHtml(value)}</td>`;
    }).join("");
    return `<tr class="${row.valid ? "is-valid" : "is-invalid"}">${cells}</tr>`;
  }).join("");
  elements.candidateTable.innerHTML = `<table class="logic-table wide-logic-table logic-puzzle-table"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
}

function renderPuzzle() {
  const puzzle = state.generatedPuzzle || PUZZLES[state.puzzleIndex];
  elements.puzzleTitle.textContent = puzzle.title;
  elements.puzzleSubtitle.textContent = puzzle.subtitle;
  elements.answerBadge.textContent = puzzle.badge;
  renderList(elements.problemText, puzzle.problem);
  renderList(elements.logicText, puzzle.logic);
  renderTable(puzzle);
  elements.answerText.textContent = puzzle.answer;
  setMessage("問題を命題に置き換え、候補表で条件を満たす行だけを残します。");
}

function renderPuzzleOptions() {
  elements.puzzleSelect.innerHTML = PUZZLES.map((puzzle, index) => (
    `<option value="${index}">${escapeHtml(puzzle.title)}</option>`
  )).join("");
  elements.puzzleSelect.value = String(state.puzzleIndex);
}

function addGeneratedPuzzle() {
  const generatedPuzzle = buildGeneratedPuzzle();
  if (!generatedPuzzle) {
    elements.puzzleSelect.value = String(state.puzzleIndex);
    setMessage("一意に解ける問題を生成できませんでした。もう一度試してください。");
    return;
  }
  state.generatedPuzzle = generatedPuzzle;
  renderPuzzle();
  setMessage("一意に解けるサンプル問題を自動生成しました。");
}

function initialize() {
  renderPuzzleOptions();

  elements.puzzleSelect.addEventListener("change", () => {
    state.puzzleIndex = Number(elements.puzzleSelect.value);
    state.generatedPuzzle = null;
    renderPuzzle();
  });

  elements.generatePuzzle.addEventListener("click", () => {
    addGeneratedPuzzle();
  });

  renderPuzzle();
}

initialize();
