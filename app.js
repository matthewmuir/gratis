const ENDPOINT_URL = "https://gcvzyfpkqaaybwtuezem.supabase.co/functions/v1/get-next-question";

// Load stored session state or initialize empty structures
let answers = JSON.parse(sessionStorage.getItem("gratis_answers") || "{}");
let currentQuestionId = sessionStorage.getItem("gratis_current_id") || "issue_type";
let historyStack = JSON.parse(sessionStorage.getItem("gratis_history") || "[]");

async function fetchNextQuestion(questionId, answersData) {
  try {
    const response = await fetch(ENDPOINT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentQuestionId: questionId,
        answers: answersData
      })
    });

    const data = await response.json();
    renderUI(data);
  } catch (error) {
    console.error("Error fetching question:", error);
    document.getElementById("question-text").innerText = "An error occurred loading the question.";
  }
}

function handleAnswer(selectedOption) {
  // 1. Record current question in history stack before advancing
  if (!historyStack.includes(currentQuestionId)) {
    historyStack.push(currentQuestionId);
  }

  // 2. Save answer locally
  answers[currentQuestionId] = selectedOption.value;

  // 3. Persist state to sessionStorage
  saveState();

  // 4. Fetch next step
  fetchNextQuestion(currentQuestionId, answers);
}

// --- UPDATED BACK BUTTON HANDLER ---
function handleBack() {
  if (historyStack.length === 0) return;

  // 1. Delete the current question's answer (excluding the answer given on this page)
  delete answers[currentQuestionId];

  // 2. Pop the previous question ID off the stack
  const previousQuestionId = historyStack.pop();

  // 3. Set current question back to previous ID
  currentQuestionId = previousQuestionId;

  // 4. Persist updated state and re-fetch the previous question
  saveState();
  fetchNextQuestion(currentQuestionId, answers);
}

// --- UPDATED START OVER HANDLER ---
function handleStartOver() {
  // 1. Completely wipe all in-memory answers, history, and state
  answers = {};
  historyStack = [];
  currentQuestionId = "issue_type";

  // 2. Clear all local browser storage completely
  sessionStorage.clear();

  // 3. Reset UI view back to initial question container
  document.getElementById("question-container").classList.remove("hidden");
  document.getElementById("summary-container").classList.add("hidden");

  // 4. Re-fetch initial start question with an empty state
  fetchNextQuestion("issue_type", {});
}

function saveState() {
  sessionStorage.setItem("gratis_answers", JSON.stringify(answers));
  sessionStorage.setItem("gratis_current_id", currentQuestionId);
  sessionStorage.setItem("gratis_history", JSON.stringify(historyStack));
}

function renderUI(data) {
  if (data.isEnd) {
    document.getElementById("question-container").classList.add("hidden");
    document.getElementById("summary-container").classList.remove("hidden");
    document.getElementById("summary-text").innerText = JSON.stringify(answers, null, 2);
    return;
  }

  currentQuestionId = data.id;
  sessionStorage.setItem("gratis_current_id", currentQuestionId);

  document.getElementById("question-text").innerText = data.text || "No question text provided.";
  
  // Show/hide Back button depending on history length
  const backBtn = document.getElementById("back-btn");
  if (historyStack.length > 0) {
    backBtn.classList.remove("hidden");
  } else {
    backBtn.classList.add("hidden");
  }

  const optionsDiv = document.getElementById("options-container");
  optionsDiv.innerHTML = "";

  // Handle choice selection buttons
  if (data.type === "choice" && Array.isArray(data.options)) {
    data.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.innerText = opt.label;
      btn.onclick = () => handleAnswer(opt);
      optionsDiv.appendChild(btn);
    });

  // Handle free text or numerical input
  } else if (data.type === "text" || data.type === "number") {
    const input = document.createElement("input");
    input.type = data.type === "number" ? "number" : "text";
    input.id = "free-text-input";
    input.placeholder = "Type your answer here...";
    input.style.cssText = "width: 100%; padding: 12px; margin: 12px 0; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; font-size: 16px;";

    // Pre-fill existing answer if user navigated back to this question
    if (answers[currentQuestionId]) {
      input.value = answers[currentQuestionId];
    }

    const submitBtn = document.createElement("button");
    submitBtn.className = "option-btn";
    submitBtn.innerText = "Next";
    submitBtn.onclick = () => {
      const val = input.value.trim();
      if (val !== "") {
        handleAnswer({ value: val, summary_text: val });
      }
    };

    optionsDiv.appendChild(input);
    optionsDiv.appendChild(submitBtn);
  }
}

// Initial invocation on load
fetchNextQuestion(currentQuestionId, answers);