// --- Smart Reply Popup ---
function createSmartReplyPopup() {
  let existing = document.getElementById("smartReplyPopup");
  if (existing) return existing._ref;

  const popupEl = document.createElement("div");
  popupEl.id = "smartReplyPopup";
  popupEl.style.position = "fixed";
  popupEl.style.top = "50%";
  popupEl.style.left = "50%";
  popupEl.style.transform = "translate(-50%, -50%) scale(0.9)";
  popupEl.style.opacity = "0";
  popupEl.style.background = "linear-gradient(135deg, #7f00ff, #ff7f50)";
  popupEl.style.color = "#fff";
  popupEl.style.borderRadius = "10px";
  popupEl.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
  popupEl.style.padding = "12px";
  popupEl.style.zIndex = 9999;
  popupEl.style.minWidth = "240px";
  popupEl.style.maxWidth = "360px";
  popupEl.style.fontSize = "14px";
  popupEl.style.transition = "all 0.4s ease, transform 0.2s ease";

  // Toast
  const toast = document.createElement("div");
  toast.id = "smartReplyToast";
  toast.style.position = "absolute";
  toast.style.bottom = "8px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.background = "rgba(0,0,0,0.75)";
  toast.style.color = "#fff";
  toast.style.padding = "4px 10px";
  toast.style.borderRadius = "6px";
  toast.style.fontSize = "12px";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s ease";
  popupEl.appendChild(toast);

  // Title
  const title = document.createElement("div");
  title.textContent = "AI Smart Replies";
  title.style.fontWeight = "bold";
  title.style.marginBottom = "8px";
  title.style.fontSize = "15px";

  // Tone selector
  const toneSelect = document.createElement("select");
  toneSelect.id = "smartReplyTone";
  ["formal", "friendly", "brief", "humorous", "professional"].forEach(
    (tone) => {
      const option = document.createElement("option");
      option.value = tone;
      option.textContent = tone.charAt(0).toUpperCase() + tone.slice(1);
      toneSelect.appendChild(option);
    }
  );
  toneSelect.style.marginBottom = "10px";
  toneSelect.style.width = "100%";
  toneSelect.style.padding = "6px";
  toneSelect.style.border = "1px solid #ccc";
  toneSelect.style.borderRadius = "6px";

  // Suggestions list
  const list = document.createElement("ul");
  list.id = "smartReplyList";
  list.style.listStyle = "none";
  list.style.padding = 0;
  list.style.margin = 0;

  // Styles
  const style = document.createElement("style");
  style.textContent = `
    #smartReplyList li {
      background: rgba(255,255,255,0.2);
      color: #fff;
      padding: 6px 8px;
      border-radius: 6px;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      font-size: 13px;
      transition: background 0.2s ease;
    }
    #smartReplyList li:hover { background: rgba(255,255,255,0.35); }
    #smartReplyList button {
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    #smartReplyList button:hover { background: #1d4ed8; }
  `;
  document.head.appendChild(style);

  popupEl.appendChild(title);
  popupEl.appendChild(toneSelect);
  popupEl.appendChild(list);
  document.body.appendChild(popupEl);

  // --- Positioning ---
  function showNearElement(el) {
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const popupHeight = popupEl.offsetHeight || 150;
    const popupWidth = popupEl.offsetWidth || 300;
    const offset = 8;

    let top, transformY;

    // Flip above if no space below
    if (rect.bottom + offset + popupHeight > window.innerHeight) {
      top = rect.top - popupHeight - offset;
      if (top < 0) top = offset;
      transformY = "-100%"; // grow upwards
    } else {
      top = rect.bottom + offset;
      transformY = "0"; // grow downwards
    }

    let left = rect.left + rect.width / 2;
    if (left - popupWidth / 2 < 0) left = popupWidth / 2 + 8;
    if (left + popupWidth / 2 > window.innerWidth)
      left = window.innerWidth - popupWidth / 2 - 8;

    popupEl.style.top = `${top}px`;
    popupEl.style.left = `${left}px`;
    popupEl.style.transform = `translate(-50%, ${transformY}) scale(1)`;
    popupEl.style.opacity = "1";

    // Save last target for scroll reposition
    popupEl._lastTarget = el;
  }

  let follow = false;
  let followInterval;
  function startFollow(el) {
    stopFollow();
    follow = true;
    followInterval = setInterval(() => {
      if (follow) showNearElement(el);
    }, 50);
  }
  function stopFollow() {
    follow = false;
    if (followInterval) clearInterval(followInterval);
  }

  function hidePopup() {
    stopFollow();
    popupEl.style.opacity = "0";
    popupEl.style.transform = "translate(-50%, -50%) scale(0.9)";
    popupEl._lastTarget = null;
  }

  document.addEventListener("mousedown", (e) => {
    if (!popupEl.contains(e.target)) hidePopup();
  });

  function copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.textContent = "Copied to clipboard!";
        toast.style.opacity = "1";
        setTimeout(() => (toast.style.opacity = "0"), 1200);
      })
      .catch(() => {
        toast.textContent = "Copy failed!";
        toast.style.opacity = "1";
        setTimeout(() => (toast.style.opacity = "0"), 1200);
      });
  }

  return {
    popupEl,
    showNearElement,
    startFollow,
    stopFollow,
    hidePopup,
    list,
    toneSelect,
    copyToClipboard,
  };
}

// --- Content Script ---
(function () {
  const popup = (window.smartReplyPopup =
    window.smartReplyPopup || createSmartReplyPopup());

  function attachClickHandlers() {
    document.querySelectorAll(".clickable-text").forEach((el) => {
      el.addEventListener("click", async (e) => {
        const text = e.target.innerText.trim();
        if (!text) return;

        popup.showNearElement(e.target);
        popup.startFollow(e.target);

        try {
          chrome.runtime.sendMessage(
            {
              type: "fetchReplies",
              message: text,
              tone: popup.toneSelect.value,
            },
            (response) => {
              popup.list.innerHTML = "";
              if (!response) return;

              if (response.error) {
                const li = document.createElement("li");
                li.textContent = `❌ ${response.error}`;
                popup.list.appendChild(li);
                return;
              }

              response.replies.forEach((reply) => {
                const li = document.createElement("li");
                li.textContent = reply;

                const btn = document.createElement("button");
                btn.textContent = "Copy";
                btn.onclick = (ev) => {
                  ev.stopPropagation();
                  popup.copyToClipboard(reply);
                };

                li.onclick = () => {
                  const active = document.activeElement;
                  if (
                    active &&
                    (active.tagName === "TEXTAREA" ||
                      active.tagName === "INPUT")
                  ) {
                    active.value = reply;
                    active.dispatchEvent(new Event("input", { bubbles: true }));
                  }
                  popup.copyToClipboard(reply);
                };

                li.appendChild(btn);
                popup.list.appendChild(li);
              });
            }
          );
        } catch (err) {
          console.warn("Extension context might be invalidated:", err);
        }
      });
    });
  }

  attachClickHandlers();

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") popup.hidePopup();
  });

  // Reposition on scroll
  window.addEventListener("scroll", () => {
    if (popup.popupEl.style.opacity === "1" && popup.popupEl._lastTarget) {
      popup.showNearElement(popup.popupEl._lastTarget);
    }
  });
})();
