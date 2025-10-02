/* global chrome, fetch */

// === CONFIG ===
// Set to true to call Gemini directly, false to use your backend
const USE_DIRECT_GEMINI = false;

// Backend root URL (do not include /generate/reply here)
const BACKEND_URL = "http://localhost:8080";

// Gemini API key (only used if USE_DIRECT_GEMINI = true)
const GEMINI_API_KEY = "AIzaSyC5_or1ldUOp2WGLnVDxBN6TJJR-rkq8pM";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type !== "fetchReplies") return;

  const { message, tone } = request;

  if (!message) {
    sendResponse({ error: "No message provided" });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  async function fetchReplies() {
    try {
      let data;

      if (USE_DIRECT_GEMINI) {
        // --- Direct Gemini call ---
        const prompt = `The user wrote: "${message}".\nGenerate 3 smart replies in a ${tone} tone.\nKeep them short, natural, and ready to send.`;
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeout);

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Gemini error ${res.status}: ${text}`);
        }

        const json = await res.json();
        if (json.candidates?.length > 0) {
          data = json.candidates.map((c) => c.content.parts[0].text);
        } else {
          data = ["No reply generated."];
        }
      } else {
        // --- Use backend server ---
        const res = await fetch(`${BACKEND_URL}/generate/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, tone }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Backend error ${res.status}: ${text}`);
        }

        const json = await res.json();
        if (!json.replies || !Array.isArray(json.replies)) {
          throw new Error("Invalid backend response format");
        }
        data = json.replies;
      }

      sendResponse({ replies: data });
    } catch (err) {
      clearTimeout(timeout);
      console.error("Fetch error:", err);
      const msg =
        err.name === "AbortError"
          ? "Request timed out"
          : err.message || "Unknown error";
      sendResponse({ error: msg });
    }
  }

  fetchReplies();

  return true; // keep async channel open
});
