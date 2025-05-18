let handyman = null;
let currentOverlay = null;
let lastEditedCard = null;
let unsavedCards = [];

// Data maps for rendering
let menuMap = {};
let childrenMap = {};
let offeringMap = {};

window.onload = async function() {
  const res = await fetch("/load");
  const data = await res.json();

  // Set up handyman drag behavior
  handyman = document.getElementById("handyman");
  handyman.draggable = true;
  handyman.addEventListener("dragstart", e => {
    if (e.dataTransfer) e.dataTransfer.setData("text/plain", "");
    handyman.dataset.dragging = "true";
  });
  handyman.addEventListener("dragend", () => delete handyman.dataset.dragging);

  // Toolbar & Home icon
  const toolbar = document.getElementById("toolbar");
  const homeIcon = document.createElement("span");
  homeIcon.id = "home-icon";
  homeIcon.className = "home-icon";
  homeIcon.textContent = "🏠";
  homeIcon.draggable = false;
  toolbar.appendChild(homeIcon);

  // Build maps
  data.menus.forEach(menu => {
    menuMap[menu.menu] = menu;
    const parent = menu.parent || null;
    (childrenMap[parent] = childrenMap[parent] || []).push(menu);
  });
  data.offerings.forEach(off => {
    (offeringMap[off.menu] = offeringMap[off.menu] || []).push(off);
  });

  // Render tree
  const container = document.getElementById("tree-container");
  (childrenMap[null] || []).forEach(menu => container.appendChild(renderMenu(menu)));

  // Drop on toolbar: save & close overlay, show Save/Revert
  toolbar.addEventListener("dragover", e => e.preventDefault());
  toolbar.addEventListener("drop", e => {
    e.preventDefault();
    if (currentOverlay && lastEditedCard) {
      saveCurrentOverlay();
      removeOverlay();
      showSaveRevertButtons(toolbar);
    }
    toolbar.appendChild(handyman);
  });

  // Drop on homeIcon: save but keep overlay open
  homeIcon.addEventListener("dragover", e => e.preventDefault());
  homeIcon.addEventListener("drop", e => {
    e.preventDefault();
    toolbar.insertBefore(handyman, homeIcon);
    if (currentOverlay && lastEditedCard) saveCurrentOverlay();
  });
};

// Create a card element (menu or offering)
function createCard(type, data) {
  const card = document.createElement("div");
  card.className = `card ${type}-card`;
  card.dataset.type = type;

  // Apply all data fields into dataset
  Object.entries(data).forEach(([k, v]) => {
    if (k === "type") return;
    card.dataset[k] = v || "";
  });

  updateCardDisplay(card);

  // Make it a drop target and clickable to edit
  card.addEventListener("dragover", e => e.preventDefault());
  card.addEventListener("drop", () => showOverlay(card, { ...data, type }));
  return card;
}

// Recursive tree rendering
function renderMenu(menu, level = 0) {
  const wrapper = document.createElement("div");
  wrapper.style.marginLeft = `${level * 20}px`;
  wrapper.appendChild(createCard("menu", menu));
  (offeringMap[menu.menu] || []).forEach(off =>
    wrapper.appendChild(createCard("offering", off))
  );
  (childrenMap[menu.menu] || []).forEach(child =>
    wrapper.appendChild(renderMenu(child, level + 1))
  );
  return wrapper;
}

// Show the editor overlay for a given card
function showOverlay(card, data) {
  // If another overlay is open, save it first
  if (currentOverlay && lastEditedCard) {
    saveCurrentOverlay();
    removeOverlay();
  }

  lastEditedCard = card;
  // Store original data for revert (only if not already stored)
  if (!card._originalData) {
    card._originalData = { ...card.dataset };
  }

  const overlay = document.createElement("div");
  overlay.className = "editor-overlay";

  // Build input fields
  Object.entries(data).forEach(([k, v]) => {
    if (k === "type") return;
    const existing = card.dataset[k] || v || "";
    const field = document.createElement("div");
    field.innerHTML = `<label>${k}: <input name="${k}" value="${existing}"></label>`;
    overlay.appendChild(field);
  });

  // If editing a menu, add the “Add Offering” & “Add Sub-menu” buttons
  if (data.type === "menu") {
    const btnContainer = document.createElement("div");
    btnContainer.className = "overlay-actions";

    // Add Offering
    const addOfferingBtn = document.createElement("button");
    addOfferingBtn.textContent = "Add Offering";
    addOfferingBtn.addEventListener("click", () => {
      const newOff = { menu: data.menu, text: "", type: "offering" };
      const newCard = createCard("offering", newOff);
      newCard._isNew = true;            // mark as newly added
      card.parentNode.insertBefore(newCard, card.nextSibling);
      showOverlay(newCard, newOff);
    });
    btnContainer.appendChild(addOfferingBtn);

    // Add Sub-menu
    const addSubmenuBtn = document.createElement("button");
    addSubmenuBtn.textContent = "Add Sub-menu";
    addSubmenuBtn.addEventListener("click", () => {
      const newMenu = { menu: "", text: "", parent: data.menu, type: "menu" };
      const newCard = createCard("menu", newMenu);
      newCard._isNew = true;            // mark as newly added
      card.parentNode.insertBefore(newCard, card.nextSibling);
      showOverlay(newCard, newMenu);
    });
    btnContainer.appendChild(addSubmenuBtn);

    overlay.appendChild(btnContainer);
  }

  // Make the overlay a drop target for the handyman
  overlay.addEventListener("dragover", e => e.preventDefault());
  overlay.addEventListener("drop", e => {
    e.preventDefault();
    overlay.appendChild(handyman);
  });

  // Move the handyman into the overlay
  overlay.appendChild(handyman);
  card.appendChild(overlay);
  currentOverlay = overlay;
}

// Save inputs into the card’s dataset and mark for saving
function saveCurrentOverlay() {
  currentOverlay.querySelectorAll("input").forEach(input => {
    lastEditedCard.dataset[input.name] = input.value;
  });
  updateCardDisplay(lastEditedCard);
  if (!unsavedCards.includes(lastEditedCard)) {
    unsavedCards.push(lastEditedCard);
  }
}

// Remove the open overlay
function removeOverlay() {
  if (currentOverlay) {
    currentOverlay.remove();
    currentOverlay = null;
  }
}

// Update a card’s visible text from its dataset
function updateCardDisplay(card) {
  if (card.dataset.type === "menu") {
    card.textContent = `${card.dataset.menu}: ${card.dataset.text}`;
  } else {
    card.textContent = card.dataset.text;
  }
}

// Inject “Save All” & “Revert All” buttons into the toolbar
function showSaveRevertButtons(toolbar) {
  if (toolbar.querySelector("#save-btn")) return;

  const saveBtn = document.createElement("button");
  saveBtn.id = "save-btn";
  saveBtn.textContent = "Save All";
  saveBtn.onclick = async () => {
    const payload = unsavedCards.map(card => {
      const ds = card.dataset;
      return {
        type: ds.type,
        menu: ds.menu,
        text: ds.text,
        parent: ds.parent || null
      };
    });

    await fetch("/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changes: payload })
    }).catch(err => alert("Save failed: " + err));

    cleanupButtons(toolbar);
  };
  toolbar.appendChild(saveBtn);

  const revertBtn = document.createElement("button");
  revertBtn.id = "revert-btn";
  revertBtn.textContent = "Revert All";
  revertBtn.onclick = () => {
    unsavedCards.forEach(card => {
      if (card._isNew) {
        // remove newly added cards
        card.remove();
      } else {
        // restore existing cards from their original data
        Object.entries(card._originalData).forEach(([k, v]) => {
          card.dataset[k] = v;
        });
        updateCardDisplay(card);
      }
    });
    cleanupButtons(toolbar);
  };
  toolbar.appendChild(revertBtn);
}

// Remove buttons and clear state
function cleanupButtons(toolbar) {
  ["#save-btn", "#revert-btn"].forEach(sel => {
    const b = toolbar.querySelector(sel);
    if (b) b.remove();
  });
  unsavedCards = [];
}
