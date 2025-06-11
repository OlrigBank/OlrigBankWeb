let handyman = null;
let currentOverlay = null;
let lastEditedCard = null;
let unsavedCards = [];

// Data maps
let menuMap = {};
let childrenMap = {};
let offeringMap = {};

// Hold the schemas
let menuSchema = null;
let offeringSchema = null;

window.onload = async function() {
  // 1) Fetch data + schemas in parallel
  const [data, ms, os] = await Promise.all([
    fetch("/load").then(r => r.json()),
    fetch("/schemas/menu.schema.json").then(r => r.json()),
    fetch("/schemas/offering.schema.json").then(r => r.json())
  ]);
  menuSchema     = ms;
  offeringSchema = os;

  // 2) Set up the handyman drag icon
  handyman = document.getElementById("handyman");
  handyman.draggable = true;
  handyman.addEventListener("dragstart", e => {
    e.dataTransfer?.setData("text/plain", "");  // Chrome requires this
    handyman.dataset.dragging = "true";
  });
  handyman.addEventListener("dragend", () => delete handyman.dataset.dragging);

  // 3) Toolbar + home icon
  const toolbar = document.getElementById("toolbar");
  const homeIcon = document.createElement("span");
  homeIcon.id        = "home-icon";
  homeIcon.className = "home-icon";
  homeIcon.textContent = "🏠";
  homeIcon.draggable   = false;
  toolbar.appendChild(homeIcon);

  // 4) Build your menu/offering maps
  data.menus.forEach(m => {
    menuMap[m.menu] = m;
    const p = m.parent || null;
    (childrenMap[p] = childrenMap[p]||[]).push(m);
  });
  data.offerings.forEach(o => {
    (offeringMap[o.menu] = offeringMap[o.menu]||[]).push(o);
  });

  // 5) Render the tree
  const container = document.getElementById("tree-container");
  ;(childrenMap[null]||[]).forEach(m => container.appendChild(renderMenu(m)));

  // 6) Drop onto toolbar = save & close overlay → show Save/Revert
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

  // 7) Drop onto homeIcon = save but keep overlay open
  homeIcon.addEventListener("dragover", e => e.preventDefault());
  homeIcon.addEventListener("drop", e => {
    e.preventDefault();
    toolbar.insertBefore(handyman, homeIcon);
    if (currentOverlay && lastEditedCard) saveCurrentOverlay();
  });
};

//
// ——— Core rendering & overlay logic —————————————————————————————————————
//

// Recursively render a menu + its offerings + sub‐menus
function renderMenu(menu, level = 0) {
  const wrapper = document.createElement("div");
  wrapper.style.marginLeft = `${level * 20}px`;

  // menu card
  wrapper.appendChild(createCard("menu", menu));

  // its offerings
  (offeringMap[menu.menu]||[]).forEach(o =>
    wrapper.appendChild(createCard("offering", o))
  );

  // its child menus
  (childrenMap[menu.menu]||[]).forEach(child =>
    wrapper.appendChild(renderMenu(child, level+1))
  );

  return wrapper;
}

// Create a single card (menu or offering)
function createCard(type, data) {
  const card = document.createElement("div");
  card.className       = `card ${type}-card`;
  card.dataset.type    = type;

  // write every schema property into dataset (so new cards get all keys)
  const schema = type === "menu" ? menuSchema : offeringSchema;
  Object.keys(schema.properties).forEach(key => {
    // prefer any incoming data, else blank
    card.dataset[key] = data[key] ?? "";
  });

  updateCardDisplay(card);
  card.addEventListener("dragover", e => e.preventDefault());
  card.addEventListener("drop", () => showOverlay(card, data));

  return card;
}

// Show the overlay for editing or adding
function showOverlay(card, data) {
  // If another overlay is open, save it first and remove it
  if (currentOverlay && lastEditedCard) {
    saveCurrentOverlay();
    removeOverlay();
  }

  // Track this card as the last one being edited
  lastEditedCard = card;

  // Store a snapshot of its original data for “Revert” (only once)
  if (!card._originalData) {
    card._originalData = { ...card.dataset };
  }

  // Determine whether this is a menu or an offering
  const cardType = card.dataset.type;                    // “menu” or “offering”
  const schema   = (cardType === "menu") ? menuSchema : offeringSchema;

  // Build the overlay container
  const overlay = document.createElement("div");
  overlay.className = "editor-overlay";

  // Create one input row per field defined in the schema
  Object.entries(schema.properties).forEach(([key, def]) => {
    const row = document.createElement("div");
    if (cardType === "offering" && key === "image") {
      // file-picker for image uploads
      row.innerHTML = `
        <label>${key}:</label>
        <input type="file" name="${key}" accept="image/*">
        <div class="preview">${card.dataset[key] ? `<img src="/static/images/${card.dataset[key]}" height="60">` : ""}</div>`;

      const fileInput = row.querySelector("input[type=file]");
      fileInput.addEventListener("change", async e => {
        const f = e.target.files[0];
        if (!f) return;
        const form = new FormData();
        form.append("file", f);
        const resp = await fetch("/upload", { method: "POST", body: form });
        const json = await resp.json();
        if (json.filename) {
          // strip extension for main‐app ID, but keep raw name for preview
         const raw = json.filename;
         const name = raw.replace(/\.[^/.]+$/, "");
         card.dataset.image = name;
         row.querySelector(".preview").innerHTML =
             `<img src="/static/images/${raw}" height="60">`;
        } else {
          alert("Upload error: " + (json.error||"unknown"));
        }
      });

    } else {
      const existing = card.dataset[key] ?? data[key] ?? "";
      row.innerHTML = `
        <label>
          ${key}${(schema.required||[]).includes(key) ? "*" : ""}:
          <input name="${key}" value="${existing}">
        </label>`;
    }

    overlay.appendChild(row);
  });

  // If this is a menu card, inject the “Add Offering” + “Add Sub-menu” buttons
  if (cardType === "menu") {
    const actions = document.createElement("div");
    actions.className = "overlay-actions";

    // — Add Offering Button —
    const addOfferingBtn = document.createElement("button");
    addOfferingBtn.textContent = "Add Offering";
    addOfferingBtn.addEventListener("click", () => {
      // Build an empty offering based on the offering schema
      const newOff = { type: "offering" };
      Object.keys(offeringSchema.properties).forEach(k => {
        newOff[k] = (k === "menu") ? card.dataset.menu : "";
      });
      const newCard = createCard("offering", newOff);
      newCard._isNew = true;
      card.parentNode.insertBefore(newCard, card.nextSibling);
      showOverlay(newCard, newOff);
    });
    actions.appendChild(addOfferingBtn);

    // — Add Sub-menu Button —
    const addSubmenuBtn = document.createElement("button");
    addSubmenuBtn.textContent = "Add Sub-menu";
    addSubmenuBtn.addEventListener("click", () => {
      // 1) Build the raw data object
      const newMenu = { type: "menu" };
      Object.keys(menuSchema.properties).forEach(k => {
        newMenu[k] = (k === "parent") ? card.dataset.menu : "";
      });

      // 2) Compute the new nesting level from the wrapper’s margin
      const wrapper    = card.parentNode;
      const baseIndent = parseInt(wrapper.style.marginLeft || '0', 10);
      const level      = baseIndent / 20 + 1;

      // 3) Render a full submenu block at that level
      const submenuWrapper = renderMenu(newMenu, level);

      // 4) Grab the actual <div class="menu-card"> inside it
      const submenuCard = submenuWrapper.querySelector('.menu-card');
      submenuCard._isNew = true;

      // 5) Insert the wrapped block and open its overlay
      wrapper.insertBefore(submenuWrapper, card.nextSibling);
      showOverlay(submenuCard, newMenu);
    });

    actions.appendChild(addSubmenuBtn);

    overlay.appendChild(actions);
  }

  // Make the overlay itself a drop target for the handyman
  overlay.addEventListener("dragover", e => e.preventDefault());
  overlay.addEventListener("drop", e => {
    e.preventDefault();
    overlay.appendChild(handyman);
  });

  // Finally, move the handyman into the overlay and attach it
  overlay.appendChild(handyman);
  card.appendChild(overlay);
  currentOverlay = overlay;
}


// save form → dataset + mark as unsaved
function saveCurrentOverlay() {
  currentOverlay.querySelectorAll("input").forEach(input => {
    if (input.type === "file") {
      // if the user picked a file, grab its real name
      if (input.files && input.files.length > 0) {
        const raw = input.files[0].name;
        const name = raw.replace(/\.[^/.]+$/, "");
        lastEditedCard.dataset[input.name] = name;
      }
    } else {
      // all other fields as before
      lastEditedCard.dataset[input.name] = input.value;
    }
  });

  // re‐render the card (so the preview icon shows)
  updateCardDisplay(lastEditedCard);

  // mark for saving
  if (!unsavedCards.includes(lastEditedCard)) {
    unsavedCards.push(lastEditedCard);
  }
}
// remove the overlay from the card
function removeOverlay() {
  currentOverlay.remove();
  currentOverlay = null;
}

// reflect dataset → visible card text
function updateCardDisplay(card) {
  if (card.dataset.type === "menu") {
    card.textContent = `${card.dataset.menu}: ${card.dataset.text}`;
  } else {
    card.textContent = card.dataset.text;
  }
}

// show Save All / Revert All in the toolbar
function showSaveRevertButtons(toolbar) {
  if (toolbar.querySelector("#save-btn")) return;

  const saveBtn = document.createElement("button");
  saveBtn.id = "save-btn";
  saveBtn.textContent = "Save All";
  saveBtn.onclick = async () => {
    const payload = unsavedCards.map(c => {
      const ds = c.dataset;
      return { type: ds.type, ...ds };
    });
    await fetch("/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changes: payload })
    }).catch(e => alert("Save failed: "+e));
    cleanupButtons(toolbar);
  };
  toolbar.appendChild(saveBtn);

  const revBtn = document.createElement("button");
  revBtn.id = "revert-btn";
  revBtn.textContent = "Revert All";
  revBtn.onclick = () => {
    unsavedCards.forEach(c => {
      if (c._isNew) {
        c.remove();
      } else {
        Object.entries(c._originalData).forEach(([k,v]) => {
          c.dataset[k] = v;
        });
        updateCardDisplay(c);
      }
    });
    cleanupButtons(toolbar);
  };
  toolbar.appendChild(revBtn);
}

// clear buttons & reset state
function cleanupButtons(toolbar) {
  ["#save-btn","#revert-btn"].forEach(sel => {
    const b = toolbar.querySelector(sel);
    if (b) b.remove();
  });
  unsavedCards = [];
}
