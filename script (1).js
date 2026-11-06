const pages = ["about", "learning", "valuable"];
const pageSections = {
  about: ["section-about", "section-education"],
  learning: ["section-learning", "section-formulas", "section-progress", "section-journal", "section-quiz"],
  valuable: ["section-valuable"],
};
const storageKey = "my-little-book-portfolio-v2";
const coverScreen = document.querySelector("#coverScreen");
const portfolio = document.querySelector("#portfolio");
const toast = document.querySelector("#toast");
const editToggle = document.querySelector("#editToggle");
const pageContents = pages.map((page) => document.querySelector(`[data-content="${page}"]`));
const photoInput = document.querySelector("#photoInput");
const aboutPhotoButton = document.querySelector(".about-photo-button");
let currentPage = 0;
let editing = false;
let toastTimer;
let openingTimer;
let scrollFrame;

function notify(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

function readSavedData() {
  try {
    const value = window.localStorage.getItem(storageKey);
    if (!value) return {};
    const data = JSON.parse(value);
    if (data && typeof data === "object" && !Array.isArray(data)) return data;
    notify("Data tersimpan tidak valid; isi awal tetap digunakan.");
  } catch (error) {
    console.error("Data portofolio tidak dapat dibaca.", error);
    notify("Penyimpanan browser tidak tersedia; perubahan tidak tersimpan.");
  }
  return {};
}

const data = readSavedData();

function saveData(key, value) {
  data[key] = value;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.error("Perubahan portofolio tidak dapat disimpan.", error);
    notify("Perubahan tampil, tetapi gagal disimpan di browser.");
  }
}

function bindEditable(element) {
  const key = element.dataset.editable;
  if (Object.hasOwn(data, key)) {
    const savedValue = key === "name" && element.closest("#aboutTitle") ? `${data[key]}.` : data[key];
    if (element.matches("input, textarea")) element.value = savedValue;
    else element.textContent = savedValue;
  }
  element.contentEditable = String(editing);
  element.spellcheck = editing;
  element.addEventListener("input", () => {
    const text = element.matches("input, textarea") ? element.value : element.textContent ?? "";
    document.querySelectorAll(`[data-editable="${key}"]`).forEach((other) => {
      if (other === element) return;
      if (other.matches("input, textarea")) other.value = text;
      else other.textContent = text;
    });
    saveData(key, text);
  });
}

document.querySelectorAll("[data-editable]").forEach(bindEditable);

function showCalculationResult(container, status, lines) {
  container.replaceChildren();
  container.classList.toggle("is-error", status === "error");
  if (status) {
    const badge = document.createElement("p");
    badge.className = `result-status${status === "success" ? " is-success" : ""}`;
    badge.textContent = status === "error" ? "INPUT TIDAK VALID" : "HASIL PERHITUNGAN";
    container.append(badge);
  }
  if (status === "error") {
    const message = document.createElement("p");
    message.className = "result-step";
    message.textContent = lines.join(" ");
    container.append(message);
    return;
  }
  const answer = document.createElement("p");
  answer.className = "result-answer";
  answer.textContent = lines[0];
  container.append(answer);

  const controls = document.createElement("div");
  controls.className = "calculation-controls";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "secondary-button";
  toggle.textContent = "SHOW CALCULATION";
  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = "secondary-button";
  copy.textContent = "COPY RESULT";
  const details = document.createElement("div");
  details.className = "calculation-details";
  details.hidden = true;
  lines.slice(1).forEach((line, index) => {
    const paragraph = document.createElement("p");
    paragraph.className = "result-step";
    paragraph.textContent = `Langkah ${index + 1}: ${line}`;
    details.append(paragraph);
  });
  toggle.addEventListener("click", () => {
    details.hidden = !details.hidden;
    toggle.textContent = details.hidden ? "SHOW CALCULATION" : "HIDE CALCULATION";
    if (!details.hidden) completeLearningItem("stepwise");
  });
  copy.addEventListener("click", () => copyText(lines.join("\n"), "Hasil perhitungan berhasil disalin."));
  controls.append(toggle, copy);
  container.append(controls, details);
}

function parseInteger(value) {
  const text = value.trim();
  if (!/^[+-]?\d+$/.test(text)) return null;
  try {
    return BigInt(text);
  } catch {
    return null;
  }
}

document.querySelector("#moduloForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const a = parseInteger(document.querySelector("#moduloA").value);
  const modulus = parseInteger(document.querySelector("#moduloM").value);
  const result = document.querySelector("#moduloResult");
  if (a === null || modulus === null || modulus <= 0n) {
    showCalculationResult(result, "error", ["Masukkan a sebagai bilangan bulat dan modulus m sebagai bilangan bulat positif."]);
    return;
  }
  const remainder = ((a % modulus) + modulus) % modulus;
  const quotient = (a - remainder) / modulus;
  showCalculationResult(result, "success", [
    `${a} mod ${modulus} = ${remainder}`,
    `${a} = (${quotient}) × ${modulus} + ${remainder}`,
    `Sisa pembagian yang berada pada rentang 0 sampai ${modulus - 1n} adalah ${remainder}.`,
  ]);
});

document.querySelector("#congruenceForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const a = parseInteger(document.querySelector("#congruenceA").value);
  const b = parseInteger(document.querySelector("#congruenceB").value);
  const modulus = parseInteger(document.querySelector("#congruenceM").value);
  const result = document.querySelector("#congruenceResult");
  if (a === null || b === null || modulus === null || modulus <= 0n) {
    showCalculationResult(result, "error", ["a dan b harus bilangan bulat; modulus m harus bilangan bulat positif."]);
    return;
  }
  const difference = a - b;
  const remainder = ((difference % modulus) + modulus) % modulus;
  const congruent = remainder === 0n;
  const quotient = (difference - remainder) / modulus;
  showCalculationResult(result, "success", [
    `${a} ${congruent ? "≡" : "≢"} ${b} (mod ${modulus})`,
    `Selisih: ${a} - (${b}) = ${difference}`,
    `Uji keterbagian: ${difference} = (${quotient}) × ${modulus} + ${remainder}`,
    `Status: ${congruent ? "KONGRUEN" : "TIDAK KONGRUEN"}${congruent ? ` karena ${modulus} membagi ${difference}.` : ` karena sisa pembagian ${difference} oleh ${modulus} adalah ${remainder}.`}`,
  ]);
});

const numberBases = [
  { base: 2, label: "Biner" },
  { base: 10, label: "Desimal" },
  { base: 8, label: "Oktal" },
  { base: 16, label: "Heksadesimal" },
];

function parseBasedInteger(value, base) {
  const text = value.trim().toUpperCase();
  const match = /^([+-]?)([0-9A-F]+)$/.exec(text);
  if (!match) return null;
  const digits = match[2];
  const alphabet = "0123456789ABCDEF";
  let number = 0n;
  for (const digit of digits) {
    const valueOfDigit = alphabet.indexOf(digit);
    if (valueOfDigit < 0 || valueOfDigit >= base) return null;
    number = number * BigInt(base) + BigInt(valueOfDigit);
  }
  return match[1] === "-" ? -number : number;
}

document.querySelector("#numberSystemForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#numberValue").value;
  const base = Number(document.querySelector("#numberBase").value);
  const value = parseBasedInteger(input, base);
  const result = document.querySelector("#numberSystemResult");
  if (value === null) {
    showCalculationResult(result, "error", [`"${input.trim() || "—"}" bukan bilangan valid pada basis ${base}.`]);
    return;
  }
  const lines = numberBases.map(({ base: targetBase, label }) => {
    const converted = value.toString(targetBase).toUpperCase();
    return `${label} (basis ${targetBase}): ${converted}`;
  });
  const digits = input.trim().replace(/^[+-]/, "").toUpperCase().split("");
  const alphabet = "0123456789ABCDEF";
  const expansion = digits.map((digit, index) => {
    const power = digits.length - index - 1;
    return `${alphabet.indexOf(digit)} × ${base}^${power}`;
  }).join(" + ");
  const signedExpansion = value < 0n ? `−(${expansion})` : expansion;
  showCalculationResult(result, "success", [
    lines.join("\n"),
    `Ekspansi posisi: ${input.trim().toUpperCase()}₍${base}₎ = ${signedExpansion}`,
    `Nilai desimalnya ${value}; nilai yang sama ditulis dengan basis 2, 10, 8, dan 16.`,
    ...lines,
  ]);
});

function permutation(n, r) {
  let result = 1n;
  for (let factor = n - r + 1; factor <= n; factor += 1) result *= BigInt(factor);
  return result;
}

function combination(n, r) {
  const selected = Math.min(r, n - r);
  let result = 1n;
  for (let index = 1; index <= selected; index += 1) {
    result = (result * BigInt(n - selected + index)) / BigInt(index);
  }
  return result;
}

document.querySelector("#combinatoricsForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const n = Number(document.querySelector("#combinatoricsN").value);
  const r = Number(document.querySelector("#combinatoricsR").value);
  const result = document.querySelector("#combinatoricsResult");
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || n > 1000 || r < 0 || r > n) {
    showCalculationResult(result, "error", ["Gunakan bilangan bulat dengan 0 ≤ r ≤ n ≤ 1000."]);
    return;
  }
  const arrangements = permutation(n, r);
  const selections = combination(n, r);
  const permutationFactors = Array.from({ length: r }, (_, index) => n - index).join(" × ") || "1";
  const selectionCount = Math.min(r, n - r);
  const combinationFactors = Array.from({ length: selectionCount }, (_, index) =>
    `${n - selectionCount + index + 1}/${index + 1}`,
  ).join(" × ") || "1";
  showCalculationResult(result, "success", [
    `P(${n}, ${r}) = ${n}! / (${n} - ${r})! = ${arrangements}`,
    `Proses permutasi: ${permutationFactors} = ${arrangements}; urutan diperhatikan.`,
    `C(${n}, ${r}) = ${n}! / (${r}! × (${n} - ${r})!) = ${selections}`,
    `Proses kombinasi: ${combinationFactors} = ${selections}; urutan tidak diperhatikan.`,
  ]);
});

const learningItems = [
  { id: "modulo", label: "Modulo Calculator" },
  { id: "congruence", label: "Congruence Checker" },
  { id: "number-system", label: "Number System Calculator" },
  { id: "combinatorics", label: "Combinatorics Calculator" },
  { id: "stepwise", label: "Step-by-Step Calculation" },
  { id: "formulas", label: "Formula Library" },
  { id: "journal", label: "Learning Journal" },
  { id: "quiz", label: "Mathematics Challenge" },
];
const progressKey = "math-detective-learning-progress-v1";
const journalKey = "math-detective-learning-journal-v1";
const progressList = document.querySelector("#progressList");
const progressSummary = document.querySelector("#progressSummary");
const progressHistory = document.querySelector("#progressHistory");

function readLocalRecords(key, fallback, isValid) {
  try {
    const saved = window.localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    if (isValid(parsed)) return parsed;
    console.error(`Data lokal ${key} memiliki format yang tidak valid.`);
    notify("Data lokal tidak valid dan tidak dapat dimuat.");
  } catch (error) {
    console.error(`Data lokal ${key} tidak dapat dibaca.`, error);
    notify("Penyimpanan lokal tidak tersedia.");
  }
  return fallback;
}

function writeLocalRecords(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Data lokal ${key} tidak dapat disimpan.`, error);
    notify("Perubahan tampil, tetapi gagal disimpan di browser.");
    return false;
  }
}

const progress = readLocalRecords(progressKey, { statuses: {}, history: [] }, (value) =>
  value && typeof value === "object" && !Array.isArray(value)
  && value.statuses && typeof value.statuses === "object"
  && Array.isArray(value.history),
);
const validProgressStatuses = new Set(["NOT STARTED", "IN PROGRESS", "COMPLETED"]);

function renderProgress() {
  const completed = learningItems.filter((item) => progress.statuses[item.id] === "COMPLETED").length;
  const percentage = Math.round((completed / learningItems.length) * 100);
  progressSummary.replaceChildren();
  const summaryText = document.createElement("p");
  summaryText.textContent = `${completed} dari ${learningItems.length} materi selesai · ${learningItems.length - completed} belum selesai`;
  const percentageText = document.createElement("strong");
  percentageText.textContent = `${percentage}%`;
  const progressBar = document.createElement("progress");
  progressBar.max = learningItems.length;
  progressBar.value = completed;
  progressBar.setAttribute("aria-label", `Progress belajar ${percentage}%`);
  progressSummary.append(summaryText, percentageText, progressBar);

  progressList.replaceChildren();
  learningItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = "progress-row";
    const label = document.createElement("label");
    label.textContent = item.label;
    const select = document.createElement("select");
    select.setAttribute("aria-label", `Status ${item.label}`);
    ["NOT STARTED", "IN PROGRESS", "COMPLETED"].forEach((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      select.append(option);
    });
    select.value = validProgressStatuses.has(progress.statuses[item.id])
      ? progress.statuses[item.id]
      : "NOT STARTED";
    select.addEventListener("change", () => setLearningStatus(item.id, select.value));
    row.append(label, select);
    progressList.append(row);
  });

  progressHistory.replaceChildren();
  const completedHistory = progress.history.filter((record) =>
    record && typeof record.label === "string" && typeof record.date === "string",
  );
  if (!completedHistory.length) {
    const empty = document.createElement("li");
    empty.textContent = "Belum ada materi yang diselesaikan.";
    progressHistory.append(empty);
  } else {
    completedHistory.slice().reverse().forEach((record) => {
      const entry = document.createElement("li");
      entry.textContent = `${record.label} · ${new Date(record.date).toLocaleString("id-ID")}`;
      progressHistory.append(entry);
    });
  }
}

function setLearningStatus(id, status) {
  if (!learningItems.some((item) => item.id === id) || !validProgressStatuses.has(status)) return;
  const previous = progress.statuses[id] || "NOT STARTED";
  progress.statuses[id] = status;
  if (status === "COMPLETED" && previous !== "COMPLETED") {
    const item = learningItems.find((candidate) => candidate.id === id);
    progress.history.push({ label: item.label, date: new Date().toISOString() });
  }
  writeLocalRecords(progressKey, progress);
  renderProgress();
}

function completeLearningItem(id) {
  setLearningStatus(id, "COMPLETED");
}

function copyText(text, successMessage) {
  if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
    notify("Fitur salin tidak tersedia pada konteks browser ini.");
    return;
  }
  navigator.clipboard.writeText(text).then(
    () => notify(successMessage),
    (error) => {
      console.error("Teks tidak dapat disalin.", error);
      notify("Gagal menyalin teks. Periksa izin clipboard browser.");
    },
  );
}

document.querySelectorAll(".calculator-form").forEach((form) => {
  form.addEventListener("submit", () => {
    window.setTimeout(() => {
      if (!form.closest(".calculator-card").querySelector(".calculator-result").classList.contains("is-error")) {
        completeLearningItem(form.id.replace("Form", "").replace("numberSystem", "number-system"));
      }
    }, 0);
  });
});

const formulaSearch = document.querySelector("#formulaSearch");
const formulaCategory = document.querySelector("#formulaCategory");
const formulaCards = [...document.querySelectorAll(".formula-card")];
function filterFormulas() {
  const query = formulaSearch.value.trim().toLocaleLowerCase("id");
  let visibleCount = 0;
  formulaCards.forEach((card) => {
    const matchesText = card.textContent.toLocaleLowerCase("id").includes(query);
    const matchesCategory = formulaCategory.value === "all" || card.dataset.category === formulaCategory.value;
    card.hidden = !matchesText || !matchesCategory;
    if (!card.hidden) visibleCount += 1;
  });
  document.querySelector("#formulaEmpty").hidden = visibleCount > 0;
}
formulaSearch.addEventListener("input", filterFormulas);
formulaCategory.addEventListener("change", filterFormulas);
let viewedFormulaIds = new Set();
formulaCards.forEach((card, index) => {
  card.querySelector("[data-formula-details]").addEventListener("click", (event) => {
    const detail = card.querySelector(".formula-detail");
    detail.hidden = !detail.hidden;
    event.currentTarget.textContent = detail.hidden ? "VIEW DETAILS" : "HIDE DETAILS";
    if (!detail.hidden) viewedFormulaIds.add(index);
    if (viewedFormulaIds.size === formulaCards.length) completeLearningItem("formulas");
  });
});
document.querySelectorAll("[data-copy-text]").forEach((button) => {
  button.addEventListener("click", () => copyText(button.dataset.copyText, "Rumus berhasil disalin."));
});
document.querySelector("#resetProgress").addEventListener("click", () => {
  if (!window.confirm("Hapus seluruh status dan riwayat progress belajar?")) return;
  progress.statuses = {};
  progress.history = [];
  writeLocalRecords(progressKey, progress);
  renderProgress();
});
renderProgress();

const journalForm = document.querySelector("#journalForm");
const journalEntries = readLocalRecords(journalKey, [], (value) =>
  Array.isArray(value) && value.every((entry) => entry && typeof entry.id === "string"
    && typeof entry.title === "string" && typeof entry.date === "string"),
);
const journalFields = {
  date: document.querySelector("#journalDate"),
  title: document.querySelector("#journalTitleInput"),
  learned: document.querySelector("#journalLearned"),
  understood: document.querySelector("#journalUnderstood"),
  difficulty: document.querySelector("#journalDifficulty"),
  solution: document.querySelector("#journalSolution"),
  conclusion: document.querySelector("#journalConclusion"),
};
const journalList = document.querySelector("#journalList");
const journalEmpty = document.querySelector("#journalEmpty");
document.querySelector("#journalDate").value = new Date().toISOString().slice(0, 10);

function renderJournal() {
  const query = document.querySelector("#journalSearch").value.trim().toLocaleLowerCase("id");
  const filtered = journalEntries.filter((entry) => Object.values(entry).join(" ").toLocaleLowerCase("id").includes(query));
  journalList.replaceChildren();
  filtered.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "journal-card";
    const title = document.createElement("h3");
    title.textContent = entry.title;
    const date = document.createElement("time");
    date.dateTime = entry.date;
    date.textContent = new Date(`${entry.date}T00:00:00`).toLocaleDateString("id-ID", { dateStyle: "long" });
    const learned = document.createElement("p");
    learned.textContent = entry.learned;
    const detail = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "VIEW NOTE";
    detail.append(summary);
    [["Sudah dipahami", entry.understood], ["Kesulitan", entry.difficulty],
      ["Cara mengatasi", entry.solution], ["Kesimpulan", entry.conclusion]].forEach(([label, value]) => {
      if (!value) return;
      const paragraph = document.createElement("p");
      paragraph.textContent = `${label}: ${value}`;
      detail.append(paragraph);
    });
    const actions = document.createElement("div");
    actions.className = "form-actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "secondary-button";
    edit.textContent = "EDIT NOTE";
    edit.addEventListener("click", () => populateJournalForm(entry));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "secondary-button";
    remove.textContent = "DELETE NOTE";
    remove.addEventListener("click", () => {
      if (!window.confirm(`Hapus catatan "${entry.title}"?`)) return;
      const index = journalEntries.findIndex((candidate) => candidate.id === entry.id);
      if (index >= 0) journalEntries.splice(index, 1);
      writeLocalRecords(journalKey, journalEntries);
      renderJournal();
    });
    actions.append(edit, remove);
    card.append(title, date, learned, detail, actions);
    journalList.append(card);
  });
  journalEmpty.hidden = filtered.length > 0;
  if (!journalEntries.length) journalEmpty.textContent = "Belum ada catatan. Tambahkan jurnal pembelajaranmu sendiri.";
  else if (!filtered.length) journalEmpty.textContent = "Tidak ada catatan yang cocok dengan pencarian.";
}

function populateJournalForm(entry) {
  document.querySelector("#journalId").value = entry.id;
  Object.entries(journalFields).forEach(([key, field]) => { field.value = entry[key] || ""; });
  journalForm.hidden = false;
  document.querySelector("#journalTitleInput").focus();
  journalForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

document.querySelector("#newJournalNote").addEventListener("click", () => {
  journalForm.reset();
  document.querySelector("#journalId").value = "";
  document.querySelector("#journalDate").value = new Date().toISOString().slice(0, 10);
  journalForm.hidden = false;
  document.querySelector("#journalTitleInput").focus();
});
document.querySelector("#cancelJournal").addEventListener("click", () => {
  journalForm.hidden = true;
  journalForm.reset();
});
document.querySelector("#journalSearch").addEventListener("input", renderJournal);
journalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = document.querySelector("#journalId").value || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const entry = { id, ...Object.fromEntries(Object.entries(journalFields).map(([key, field]) => [key, field.value.trim()])) };
  const existingIndex = journalEntries.findIndex((candidate) => candidate.id === id);
  if (existingIndex < 0) journalEntries.unshift(entry);
  else journalEntries[existingIndex] = entry;
  if (writeLocalRecords(journalKey, journalEntries)) {
    journalForm.hidden = true;
    journalForm.reset();
    renderJournal();
    completeLearningItem("journal");
    notify("Catatan jurnal tersimpan di browser ini.");
  }
});
renderJournal();

const quizQuestions = [
  { topic: "Aritmetika Modular", level: 1, prompt: "Berapakah 17 mod 5?", options: ["1", "2", "3", "5"], answer: 1, explanation: "17 = 3 × 5 + 2, jadi sisanya 2." },
  { topic: "Aritmetika Modular", level: 1, prompt: "Berapakah −7 mod 5 dengan sisa nonnegatif?", options: ["−2", "2", "3", "−3"], answer: 2, explanation: "−7 = (−2) × 5 + 3, sehingga sisanya 3." },
  { topic: "Aritmetika Modular", level: 1, prompt: "Berapakah 26 mod 7?", options: ["2", "3", "5", "6"], answer: 2, explanation: "26 = 3 × 7 + 5." },
  { topic: "Kongruensi", level: 1, prompt: "Apakah 17 ≡ 2 (mod 5)?", options: ["Ya, karena 17 − 2 habis dibagi 5", "Tidak, karena 17 lebih besar", "Ya, karena 17 + 2 = 19", "Tidak dapat ditentukan"], answer: 0, explanation: "17 − 2 = 15 = 3 × 5, jadi kongruen." },
  { topic: "Sistem Bilangan", level: 1, prompt: "Nilai desimal dari 1010₂ adalah…", options: ["8", "10", "12", "1010"], answer: 1, explanation: "1×2³ + 0×2² + 1×2¹ + 0×2⁰ = 10." },
  { topic: "Kongruensi", level: 2, prompt: "Apakah 14 ≡ 5 (mod 3)?", options: ["Tidak, sisanya berbeda", "Ya, karena 14 − 5 = 9 habis dibagi 3", "Ya, karena 14 + 5 = 19", "Tidak, karena 3 bukan prima"], answer: 1, explanation: "14 − 5 = 9 dan 3 membagi 9." },
  { topic: "Kongruensi", level: 2, prompt: "Manakah yang kongruen dengan 8 modulo 5?", options: ["1", "2", "3", "5"], answer: 2, explanation: "8 mod 5 = 3, jadi 8 ≡ 3 (mod 5)." },
  { topic: "Sistem Bilangan", level: 2, prompt: "Berapakah nilai desimal 2F₁₆?", options: ["31", "45", "47", "52"], answer: 2, explanation: "2×16 + 15 = 47." },
  { topic: "Aritmetika Modular", level: 2, prompt: "Berapakah 100 mod 9?", options: ["0", "1", "8", "9"], answer: 1, explanation: "100 = 11×9 + 1." },
  { topic: "Sistem Bilangan", level: 3, prompt: "Representasi biner dari 25₁₀ adalah…", options: ["10101₂", "11001₂", "11100₂", "10011₂"], answer: 1, explanation: "25 = 16 + 8 + 1, yaitu 11001₂." },
  { topic: "Sistem Bilangan", level: 3, prompt: "Nilai desimal dari 17₈ adalah…", options: ["13", "14", "15", "17"], answer: 2, explanation: "1×8 + 7 = 15." },
  { topic: "Permutasi", level: 3, prompt: "Berapakah P(5,2)?", options: ["10", "15", "20", "25"], answer: 2, explanation: "P(5,2) = 5×4 = 20; urutan diperhatikan." },
  { topic: "Permutasi", level: 3, prompt: "Berapakah P(4,3)?", options: ["12", "18", "24", "64"], answer: 2, explanation: "P(4,3) = 4×3×2 = 24." },
  { topic: "Kombinasi", level: 3, prompt: "Berapakah C(5,2)?", options: ["5", "10", "20", "25"], answer: 1, explanation: "C(5,2) = 5!/(2!×3!) = 10; urutan tidak diperhatikan." },
  { topic: "Kombinasi", level: 3, prompt: "Berapakah C(6,0)?", options: ["0", "1", "6", "Tidak terdefinisi"], answer: 1, explanation: "C(n,0) = 1: ada satu cara memilih tidak ada objek." },
];
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;
let quizFinished = false;
let quizResponses = [];
const quizQuestion = document.querySelector("#quizQuestion");
const quizSummary = document.querySelector("#quizSummary");
const nextQuestion = document.querySelector("#nextQuestion");

function renderQuizQuestion() {
  quizAnswered = false;
  nextQuestion.disabled = true;
  nextQuestion.textContent = "NEXT QUESTION";
  const question = quizQuestions[quizIndex];
  quizQuestion.replaceChildren();
  const counter = document.createElement("p");
  counter.className = "quiz-counter";
  counter.textContent = `CLUE ${String(quizIndex + 1).padStart(2, "0")} / ${quizQuestions.length} · ${question.topic.toUpperCase()} · LEVEL ${question.level}`;
  const prompt = document.createElement("h3");
  prompt.textContent = question.prompt;
  const options = document.createElement("div");
  options.className = "quiz-options";
  question.options.forEach((text, index) => {
    const label = document.createElement("label");
    label.className = "quiz-option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "quiz-answer";
    input.value = String(index);
    input.addEventListener("change", () => submitQuizAnswer(index));
    label.append(input, document.createTextNode(text));
    options.append(label);
  });
  const feedback = document.createElement("div");
  feedback.className = "quiz-feedback";
  feedback.id = "quizFeedback";
  feedback.setAttribute("aria-live", "polite");
  quizQuestion.append(counter, prompt, options, feedback);
  quizSummary.hidden = true;
}

function submitQuizAnswer(selectedIndex) {
  if (quizAnswered) return;
  quizAnswered = true;
  const question = quizQuestions[quizIndex];
  quizResponses[quizIndex] = selectedIndex;
  const correct = selectedIndex === question.answer;
  if (correct) quizScore += 1;
  quizQuestion.querySelectorAll(".quiz-option").forEach((option, index) => {
    option.classList.toggle("is-correct", index === question.answer);
    option.classList.toggle("is-wrong", index === selectedIndex && !correct);
    option.querySelector("input").disabled = true;
  });
  const feedback = document.querySelector("#quizFeedback");
  feedback.className = `quiz-feedback ${correct ? "is-correct" : "is-wrong"}`;
  feedback.textContent = `${correct ? "BENAR" : "BELUM TEPAT"} · ${question.explanation}`;
  nextQuestion.disabled = false;
  nextQuestion.textContent = quizIndex === quizQuestions.length - 1 ? "VIEW FINAL REPORT" : "NEXT QUESTION";
}

function finishQuiz() {
  quizFinished = true;
  const incorrect = quizQuestions.length - quizScore;
  const rank = quizScore >= 13
    ? "LEVEL 3 — MASTER MATHEMATICIAN"
    : quizScore >= 9 ? "LEVEL 2 — JUNIOR ANALYST" : "LEVEL 1 — BEGINNER DETECTIVE";
  const evaluation = quizScore >= 13
    ? "Analisis sangat kuat. Kamu berhasil menghubungkan konsep-konsep utama."
    : quizScore >= 9 ? "Dasar konsep sudah terbentuk. Tinjau kembali petunjuk yang belum tepat."
      : "Terus berlatih dan gunakan arsip rumus untuk memperkuat pemahaman.";
  quizQuestion.hidden = true;
  nextQuestion.disabled = true;
  quizSummary.replaceChildren();
  const heading = document.createElement("h3");
  heading.textContent = "FINAL CHALLENGE REPORT";
  const score = document.createElement("p");
  score.className = "quiz-score";
  score.textContent = `${quizScore} / ${quizQuestions.length} · ${Math.round((quizScore / quizQuestions.length) * 100)}%`;
  const stats = document.createElement("p");
  stats.textContent = `Total soal: ${quizQuestions.length} · Benar: ${quizScore} · Salah: ${incorrect}`;
  const level = document.createElement("strong");
  level.textContent = rank;
  const message = document.createElement("p");
  message.textContent = evaluation;
  const review = document.createElement("div");
  review.className = "quiz-review";
  quizQuestions.forEach((question, index) => {
    const entry = document.createElement("p");
    const chosen = quizResponses[index];
    entry.textContent = `${index + 1}. ${question.prompt} ${chosen === question.answer ? "BENAR" : "BELUM TEPAT"} — Jawabanmu: ${question.options[chosen]}; jawaban benar: ${question.options[question.answer]}. ${question.explanation}`;
    review.append(entry);
  });
  quizSummary.append(heading, score, stats, level, message, review);
  quizSummary.hidden = false;
  completeLearningItem("quiz");
}

nextQuestion.addEventListener("click", () => {
  if (!quizAnswered || quizFinished) return;
  if (quizIndex === quizQuestions.length - 1) {
    finishQuiz();
    return;
  }
  quizIndex += 1;
  renderQuizQuestion();
});
document.querySelector("#restartQuiz").addEventListener("click", () => {
  quizIndex = 0;
  quizScore = 0;
  quizFinished = false;
  quizResponses = [];
  quizQuestion.hidden = false;
  renderQuizQuestion();
});
renderQuizQuestion();

function setEditing(enabled) {
  editing = enabled;
  portfolio.classList.toggle("is-editing", enabled);
  editToggle.setAttribute("aria-pressed", String(enabled));
  document.querySelector("#editLabel").textContent = enabled ? "SELESAI EDIT" : "EDIT ISI";
  document.querySelector("#editHint").textContent = enabled
    ? "Klik teks bertanda untuk mengubahnya; perubahan tersimpan otomatis."
    : "Perubahan tersimpan otomatis di browser ini.";
  document.querySelectorAll("[data-editable]").forEach((element) => {
    element.contentEditable = String(enabled);
    element.spellcheck = enabled;
  });
  aboutPhotoButton.hidden = !enabled;
  photoInput.disabled = !enabled;
  document.querySelectorAll(".experience-upload").forEach((label) => { label.hidden = !enabled; });
  document.querySelectorAll("[data-experience-photo]").forEach((input) => { input.disabled = !enabled; });
  if (!enabled) notify("Selesai mengedit. Perubahan tersimpan di browser ini.");
  else notify("Mode edit aktif. Ubah teks atau pilih foto yang ingin diganti.");
}

function showPage(index) {
  currentPage = Math.max(0, Math.min(index, pages.length - 1));
  const selected = pages[currentPage];
  const visibleSectionIds = new Set(pageSections[selected]);
  document.querySelectorAll(".page-content").forEach((section) => {
    section.hidden = !visibleSectionIds.has(section.id);
  });
  document.querySelector("#caseBoard").hidden = true;
  document.querySelector("#book").hidden = false;
  document.querySelector("#book").classList.remove("gift-opening");
  void document.querySelector("#book").offsetWidth;
  document.querySelector("#book").classList.add("gift-opening");
  window.setTimeout(() => document.querySelector("#book").classList.remove("gift-opening"), 720);
  updatePageNavigation();
  document.querySelector("#pageNumber").textContent =
    `${String(currentPage + 1).padStart(2, "0")} / 03`;
  if (!portfolio.hidden) {
    document.querySelector("#book").scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }
}

function updatePageNavigation() {
  document.querySelector("#pageNumber").textContent =
    `${String(currentPage + 1).padStart(2, "0")} / 03`;
}

function updatePageFromScroll() {
  if (portfolio.hidden) return;
  const activationPoint = 170;
  let visibleIndex = 0;
  pageContents.forEach((section, index) => {
    if (!section.hidden && section.getBoundingClientRect().top <= activationPoint) visibleIndex = index;
  });
  if (visibleIndex === currentPage) return;
  currentPage = visibleIndex;
  updatePageNavigation();
}

document.querySelectorAll("[data-case-page]").forEach((card) => {
  card.addEventListener("click", () => {
    if (card.classList.contains("gift-opening")) return;
    card.classList.add("gift-opening");
    window.setTimeout(() => {
      card.classList.remove("gift-opening");
      showPage(pages.indexOf(card.dataset.casePage));
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 360);
  });
});
document.querySelector("#backToBoard").addEventListener("click", () => {
  const book = document.querySelector("#book");
  book.classList.add("gift-closing");
  window.setTimeout(() => {
    book.hidden = true;
    book.classList.remove("gift-closing", "gift-opening");
    document.querySelector("#caseBoard").hidden = false;
    document.querySelector(`[data-case-page="${pages[currentPage]}"]`).focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 300);
});

window.addEventListener("scroll", () => {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = 0;
    updatePageFromScroll();
  });
}, { passive: true });

document.querySelector("#openBook").addEventListener("click", () => {
  const caseFolder = document.querySelector("#caseFolder");
  const openButton = document.querySelector("#openBook");
  if (caseFolder.classList.contains("is-opening")) return;
  openButton.disabled = true;
  coverScreen.classList.add("is-opening");
  caseFolder.classList.add("is-opening");
  const finishOpening = () => {
    window.clearTimeout(openingTimer);
    portfolio.hidden = false;
    coverScreen.hidden = true;
    document.querySelector("#caseBoard").hidden = false;
    document.querySelector("#book").hidden = true;
    window.scrollTo({ top: 0, behavior: "auto" });
    document.querySelector('[data-case-page="about"]').focus({ preventScroll: true });
    openButton.disabled = false;
  };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  openingTimer = window.setTimeout(finishOpening, reducedMotion ? 50 : 850);
});
document.querySelector("#backToCover").addEventListener("click", () => {
  if (editing) setEditing(false);
  portfolio.hidden = true;
  document.querySelector("#caseBoard").hidden = true;
  document.querySelector("#book").hidden = true;
  coverScreen.hidden = false;
  coverScreen.classList.remove("is-opening");
  document.querySelector("#caseFolder").classList.remove("is-opening");
  window.scrollTo({
    top: 0,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
  });
  document.querySelector("#openBook").focus({ preventScroll: true });
});
editToggle.addEventListener("click", () => {
  setEditing(!editing);
});

const profileImage = document.querySelector("#profileImage");
const profilePlaceholder = document.querySelector("#profilePlaceholder");
const aboutProfileImage = document.querySelector("#aboutProfileImage");
const aboutProfilePlaceholder = document.querySelector("#aboutProfilePlaceholder");

function showProfilePhoto(source) {
  profileImage.src = source;
  profileImage.hidden = false;
  profilePlaceholder.hidden = true;
  aboutProfileImage.src = source;
  aboutProfileImage.hidden = false;
  aboutProfilePlaceholder.hidden = true;
}

if (typeof data["profile-photo"] === "string" && data["profile-photo"].startsWith("data:image/")) {
  showProfilePhoto(data["profile-photo"]);
}

function showExperiencePhoto(id, source) {
  const image = document.querySelector(`[data-experience-image="${id}"]`);
  if (!image || !source.startsWith("data:image/")) return;
  image.src = source;
  image.hidden = false;
  image.closest(".evidence-photo").querySelector(".photo-placeholder").hidden = true;
}

function bindExperiencePhoto(input) {
  input.disabled = !editing;
  input.closest(".experience-upload").hidden = !editing;
  input.addEventListener("change", () => {
    const [file] = input.files;
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify("Pilih file gambar untuk bukti pengalaman.");
      input.value = "";
      return;
    }
    const image = new Image();
    image.addEventListener("load", () => {
      const ratio = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const context = canvas.getContext("2d");
      if (!context) {
        notify("Browser tidak dapat memproses gambar ini.");
        URL.revokeObjectURL(image.src);
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const photo = canvas.toDataURL("image/jpeg", 0.78);
      showExperiencePhoto(input.dataset.experiencePhoto, photo);
      saveData(`experience-photo-${input.dataset.experiencePhoto}`, photo);
      notify("Foto bukti pengalaman tersimpan di browser ini.");
      URL.revokeObjectURL(image.src);
    });
    image.addEventListener("error", () => {
      notify("Foto tidak dapat dibuka. Coba gambar lain.");
      URL.revokeObjectURL(image.src);
    });
    image.src = URL.createObjectURL(file);
  });
}

const experienceChoices = document.querySelector(".experience-choices");
const experienceRecords = document.querySelector("#section-valuable");
const addExperienceButton = document.querySelector("#addExperience");

function selectExperience(selected) {
  document.querySelectorAll("[data-experience-choice]").forEach((choice) => {
    const active = choice.dataset.experienceChoice === selected;
    choice.classList.toggle("active", active);
    choice.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll("[data-experience-record]").forEach((record) => {
    record.hidden = record.dataset.experienceRecord !== selected;
  });
}

function createExperience(index) {
  const choice = document.createElement("button");
  choice.type = "button";
  choice.className = "experience-choice";
  choice.dataset.experienceChoice = String(index);
  choice.setAttribute("aria-pressed", "false");
  choice.dataset.editable = `experience-choice-${index}`;
  choice.textContent = `PILIHAN ${String(index).padStart(2, "0")} · CERITA BARU`;
  bindEditable(choice);
  experienceChoices.insertBefore(choice, addExperienceButton);

  const record = document.createElement("div");
  record.className = "experience-record";
  record.dataset.experienceRecord = String(index);
  record.hidden = true;

  const titleLabel = document.createElement("label");
  titleLabel.className = "experience-title";
  titleLabel.append("JUDUL PENGALAMAN ");
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.dataset.editable = `experience-title-${index}`;
  titleInput.value = `Pengalaman ${index}`;
  titleLabel.append(titleInput);
  bindEditable(titleInput);
  record.append(titleLabel);

  const photos = document.createElement("div");
  photos.className = "evidence-photos";
  for (let slot = 1; slot <= 3; slot += 1) {
    const figure = document.createElement("figure");
    figure.className = "evidence-photo";

    const image = document.createElement("img");
    image.dataset.experienceImage = `${index}-${slot}`;
    image.alt = `Foto bukti pengalaman ${index}, foto ${slot}`;
    image.hidden = true;
    figure.append(image);

    const placeholder = document.createElement("span");
    placeholder.className = "photo-placeholder";
    placeholder.append("FOTO BUKTI", document.createElement("br"), String(slot).padStart(2, "0"));
    figure.append(placeholder);

    const upload = document.createElement("label");
    upload.className = "experience-upload";
    upload.hidden = !editing;
    upload.append("UNGGAH FOTO");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.dataset.experiencePhoto = `${index}-${slot}`;
    input.hidden = true;
    upload.append(input);
    figure.append(upload);
    photos.append(figure);
    bindExperiencePhoto(input);
  }
  record.append(photos);

  const caption = document.createElement("p");
  caption.className = "photo-caption";
  caption.dataset.editable = `experience-caption-${index}`;
  caption.textContent = "Tambahkan cerita dan dokumentasi pengalamanmu sendiri.";
  bindEditable(caption);
  record.append(caption);
  experienceRecords.insertBefore(record, document.querySelector(".reflection-list"));
}

const savedExperienceCount = Number(data["experience-count"]);
let experienceCount = Number.isSafeInteger(savedExperienceCount) && savedExperienceCount >= 3
  ? savedExperienceCount
  : 3;
for (let index = 4; index <= experienceCount; index += 1) createExperience(index);

document.querySelectorAll("[data-experience-image]").forEach((image) => {
  const source = data[`experience-photo-${image.dataset.experienceImage}`];
  if (typeof source === "string") showExperiencePhoto(image.dataset.experienceImage, source);
});

document.querySelectorAll("[data-experience-photo]").forEach(bindExperiencePhoto);

experienceChoices.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const choice = event.target.closest("[data-experience-choice]");
  if (choice && experienceChoices.contains(choice)) {
    selectExperience(choice.dataset.experienceChoice);
  }
  if (event.target.closest("#addExperience")) {
    experienceCount += 1;
    createExperience(experienceCount);
    saveData("experience-count", experienceCount);
    selectExperience(String(experienceCount));
    notify("Pengalaman baru ditambahkan. Aktifkan EDIT ISI untuk mengubah judul, cerita, dan foto.");
  }
});

photoInput.addEventListener("change", () => {
  const [file] = photoInput.files;
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    notify("Pilih file gambar untuk foto profil.");
    photoInput.value = "";
    return;
  }
  const image = new Image();
  image.addEventListener("load", () => {
    const ratio = Math.min(1, 600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const context = canvas.getContext("2d");
    if (!context) {
      notify("Browser tidak dapat memproses gambar ini.");
      URL.revokeObjectURL(image.src);
      return;
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const photo = canvas.toDataURL("image/jpeg", 0.82);
    showProfilePhoto(photo);
    saveData("profile-photo", photo);
    notify("Foto profil berhasil diperbarui.");
    URL.revokeObjectURL(image.src);
  });
  image.addEventListener("error", () => {
    notify("Foto tidak dapat dibuka. Coba gambar lain.");
    URL.revokeObjectURL(image.src);
  });
  image.src = URL.createObjectURL(file);
});

document.querySelectorAll(".page-content").forEach((section) => { section.hidden = true; });

const book = document.querySelector("#book");
const canTilt = window.matchMedia("(hover: hover) and (pointer: fine)");
if (canTilt.matches) {
  book.addEventListener("pointermove", (event) => {
    const bounds = book.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return;
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    book.style.setProperty("--tilt-x", `${-y * 2}deg`);
    book.style.setProperty("--tilt-y", `${x * 2}deg`);
    book.classList.add("is-tilting");
  });
  book.addEventListener("pointerleave", () => book.classList.remove("is-tilting"));
}