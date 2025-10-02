// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const generateBtn = document.getElementById("generate");
  const inputText = document.getElementById("inputText");
  const toneSelect = document.getElementById("tone");
  const suggestionsList = document.getElementById("suggestions");

  // Backend API URL
  const API_URL = "http://localhost:8080/generate/reply";

  // Helper function: Copy text to clipboard
  function copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => alert("Copied to clipboard!"))
      .catch((err) => console.error("Failed to copy:", err));
  }

  // Handle generate button click
  generateBtn.addEventListener("click", async () => {
    const message = inputText.value.trim();
    const tone = toneSelect.value;

    if (!message) {
      alert("Please enter a message or topic.");
      return;
    }

    // Clear old suggestions
    suggestionsList.innerHTML = "<li>Loading suggestions...</li>";

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, tone }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();

      // Clear loading state
      suggestionsList.innerHTML = "";

      if (data.replies && data.replies.length > 0) {
        data.replies.forEach((reply) => {
          const li = document.createElement("li");
          li.className = "suggestion-item";
          li.innerHTML = `
            <p>${reply}</p>
            <button class="copyBtn">Copy</button>
          `;

          // Copy functionality
          li.querySelector(".copyBtn").addEventListener("click", () => {
            copyToClipboard(reply);
          });

          suggestionsList.appendChild(li);
        });
      } else {
        suggestionsList.innerHTML = "<li>No suggestions received.</li>";
      }
    } catch (error) {
      console.error("Error fetching AI reply:", error);
      suggestionsList.innerHTML =
        "<li>Error generating reply. Check console for details.</li>";
    }
  });
});
