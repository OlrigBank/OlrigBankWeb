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

    const toolbar = document.getElementById("toolbar");
    // Add home icon
    const homeIcon = document.createElement("span");
    homeIcon.id = "home-icon";
    homeIcon.className = "home-icon";
    homeIcon.textContent = "🏠";
    homeIcon.draggable = false;
    toolbar.appendChild(homeIcon);

    // Build data maps
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

    // Toolbar drop: save and close overlay, show buttons
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

    // Home icon drop: save overlay but keep open
    homeIcon.addEventListener("dragover", e => e.preventDefault());
    homeIcon.addEventListener("drop", e => {
        e.preventDefault();
        toolbar.insertBefore(handyman, homeIcon);
        if (currentOverlay && lastEditedCard) saveCurrentOverlay();
    });
};

// Create a card element with dataset and handlers
function createCard(type, data) {
    const card = document.createElement("div");
    card.className = `card ${type}-card`;
    card.dataset.type = type;
    // Store initial data on dataset
    Object.entries(data).forEach(([k,v]) => { if(k!=='type') card.dataset[k] = v || ''; });
    updateCardDisplay(card);
    card.addEventListener("dragover", e => e.preventDefault());
    card.addEventListener("drop", () => showOverlay(card, data));
    return card;
}

// Recursive render
function renderMenu(menu, level=0) {
    const wrapper = document.createElement("div");
    wrapper.style.marginLeft = `${level*20}px`;
    // Menu card
    wrapper.appendChild(createCard('menu', menu));
    // Offerings
    (offeringMap[menu.menu]||[]).forEach(off => wrapper.appendChild(createCard('offering', off)));
    // Children
    (childrenMap[menu.menu]||[]).forEach(child => wrapper.appendChild(renderMenu(child, level+1)));
    return wrapper;
}

// Show editor overlay
function showOverlay(card, data) {
    // Save any open overlay
    if (currentOverlay && lastEditedCard) {
        saveCurrentOverlay();
        removeOverlay();
    }
    lastEditedCard = card;
    // Keep original data on card for revert if first change
    if (!card._originalData) card._originalData = { ...card.dataset };

    const overlay = document.createElement("div");
    overlay.className = "editor-overlay";
    Object.entries(data).forEach(([k,v]) => {
        if(k==='type') return;
        const val = card.dataset[k]||v||'';
        const div = document.createElement("div");
        div.innerHTML = `<label>${k}: <input name="${k}" value="${val}"></label>`;
        overlay.appendChild(div);
    });
    overlay.addEventListener("dragover", e=>e.preventDefault());
    overlay.addEventListener("drop", e=>{e.preventDefault(); overlay.appendChild(handyman)});

    overlay.appendChild(handyman);
    currentOverlay = overlay;
    card.appendChild(overlay);
}

// Save overlay inputs into dataset and track card
function saveCurrentOverlay() {
    currentOverlay.querySelectorAll("input").forEach(input => {
        lastEditedCard.dataset[input.name] = input.value;
    });
    updateCardDisplay(lastEditedCard);
    // Track unsaved changed cards
    if (!unsavedCards.includes(lastEditedCard)) unsavedCards.push(lastEditedCard);
}

// Remove overlay
function removeOverlay() {
    currentOverlay.remove();
    currentOverlay = null;
}

// Update card display
function updateCardDisplay(card) {
    if(card.dataset.type==='menu') card.textContent = `${card.dataset.menu}: ${card.dataset.text}`;
    else card.textContent = card.dataset.text;
}

// Show Save and Revert buttons for all changed cards
function showSaveRevertButtons(toolbar) {
    if (toolbar.querySelector('#save-btn')) return;
    const saveBtn = document.createElement('button');
    saveBtn.id='save-btn'; saveBtn.textContent='Save All';
    saveBtn.onclick = () => {
        // TODO: Persist unsaved changes
        console.log('Saved all:', unsavedCards.map(c => c.dataset));
        cleanupButtons(toolbar);
    };
    const revertBtn = document.createElement('button');
    revertBtn.id='revert-btn'; revertBtn.textContent='Revert All';
    revertBtn.onclick = () => {
        // Revert each card to its original data
        unsavedCards.forEach(card => {
            const orig = card._originalData || {};
            Object.entries(orig).forEach(([k,v]) => card.dataset[k] = v);
            updateCardDisplay(card);
        });
        cleanupButtons(toolbar);
    };
    toolbar.append(saveBtn, revertBtn);
}

// Remove Save/Revert buttons and reset state
function cleanupButtons(toolbar) {
    ['#save-btn','#revert-btn'].forEach(sel=>{
        const b=toolbar.querySelector(sel); if(b) b.remove();
    });
    unsavedCards = [];
}
