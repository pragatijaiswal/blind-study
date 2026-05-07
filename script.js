// ============================
// SUPABASE CONFIG
// ============================

const SUPABASE_URL = 'https://uyxeucbukctlchvltzad.supabase.co/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5eGV1Y2J1a2N0bGNodmx0emFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDYyNzAsImV4cCI6MjA5MzcyMjI3MH0.2bnkjCWoyRRpw0pohCVUR-J3sM08frYBwMUUw-DkOeQ';

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ============================
// GLOBALS
// ============================

let responses = [];

const participantId = crypto.randomUUID();

// ============================
// LOAD CONFIG
// ============================

fetch('config.json')
  .then(response => {
    if (!response.ok) throw new Error("Failed to load config.json");
    return response.json();
  })
  .then(data => {
    buildStudy(data.subjects);
  })
  .catch(err => {
    console.error(err);
    document.getElementById("status").innerText = "Error loading configuration.";
  });

// ============================
// BUILD STUDY
// ============================
function buildStudy(subjects) {

  const container = document.getElementById("study-container");

  subjects.forEach(subject => {

    const subjectName = subject.name;

    // clone + shuffle methods (blind poll)
    const methods = [...subject.methods];
    shuffleArray(methods);

    const block = document.createElement("div");
    block.className = "subject-block";

    const title = document.createElement("h2");
    title.innerText = subjectName;
    block.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "image-grid";

    // =========================
    // GT IMAGE (reference only)
    // =========================
    const gtCard = document.createElement("div");
    gtCard.className = "image-card";

    const gtImg = document.createElement("img");
    gtImg.src = `images/${subject.gt}`;
    gtImg.alt = "GT";

    const gtLabel = document.createElement("h3");
    gtLabel.innerText = "Reference";

    gtCard.appendChild(gtLabel);
    gtCard.appendChild(gtImg);

    grid.appendChild(gtCard);

    // =========================
    // METHOD OPTIONS (blind)
    // =========================
    methods.forEach((method, index) => {

      const optionLetter = String.fromCharCode(65 + index);

      const card = document.createElement("div");
      card.className = "image-card";

      const img = document.createElement("img");
      img.src = `images/${method.file}`;
      img.alt = method.name;

      const label = document.createElement("h3");
      label.innerText = `Option ${optionLetter}`;

      const button = document.createElement("button");
      button.innerText = "Select";

      button.addEventListener("click", () => {

        // remove previous selection
        grid.querySelectorAll(".image-card").forEach(c => {
          c.classList.remove("selected");
        });

        card.classList.add("selected");

        saveResponse({
          subject: subjectName,
          selected_option: optionLetter,
          method: method.name
        });
      });

      card.appendChild(label);
      card.appendChild(img);
      card.appendChild(button);

      grid.appendChild(card);
    });

    block.appendChild(grid);
    container.appendChild(block);
  });
}

// ============================
// SAVE LOCAL RESPONSE
// ============================

function saveResponse(entry) {
  // correctly filter by subject_name
  responses = responses.filter(r => r.subject_name !== entry.subject);
  responses.push({
    participant_id: participantId,
    subject_name: entry.subject,
    selected_option: entry.selected_option,
    actual_method: entry.method
  });
  console.log("Response saved:", entry);
}

// ============================
// SHUFFLE
// ============================

function shuffleArray(array) {

  for (let i = array.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ============================
// SUBMIT TO SUPABASE
// ============================

const submitBtn = document.getElementById('submit-btn');

submitBtn.addEventListener('click', async () => {

  const status = document.getElementById('status');

  if (responses.length === 0) {
    status.innerText = 'No responses selected.';
    return;
  }

  // Backup download function
  const downloadResults = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(responses, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `study_results_${participantId}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (!supabaseClient) {
    status.innerText = 'Supabase not configured. Downloading results locally...';
    downloadResults();
    status.innerText = 'Results downloaded locally.';
    return;
  }

  status.innerText = 'Submitting...';

  try {
    const { error } = await supabaseClient
      .from('responses')
      .insert(responses);

    if (error) throw error;

    status.innerText = 'Responses submitted successfully!';
    submitBtn.disabled = true;

  } catch (error) {
    console.error(error);
    status.innerText = 'Submission failed. Downloading results locally as fallback...';
    downloadResults();
  }
});