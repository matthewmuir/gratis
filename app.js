// Replace with your actual Supabase Function URL from your dashboard
const ENDPOINT_URL = "https://gcvzyfpkqaaybwtuezem.supabase.co/functions/v1/get-next-question";

// Read existing answers or start fresh in memory (cleared on tab close)
let answers = JSON.parse(sessionStorage.getItem("gratis_answers") || "{}");
let currentQuestionId = sessionStorage.getItem("gratis_current_id") || "issue_type";

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
  // Store answer locally in browser session
  answers[currentQuestionId] = selectedOption.value;
  
  // Save local state so user can resume on refresh
  sessionStorage.setItem("gratis_answers", JSON.stringify(answers));
  
  // Fetch next question based on current response
  fetchNextQuestion(currentQuestionId, answers);
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

  document.getElementById("question-text").innerText = data.text;
  const optionsDiv = document.getElementById("options-container");
  optionsDiv.innerHTML = "";

  data.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerText = opt.label;
    btn.onclick = () => handleAnswer(opt);
    optionsDiv.appendChild(btn);
  });
}

// Initialize on page load
fetchNextQuestion(currentQuestionId, answers);