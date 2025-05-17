let handyman = null;
let currentOverlay = null;

window.onload = async function() {
    // Load initial data
    const res = await fetch("/load");
    const data = await res.json();

    // Initialize handyman draggable behavior
    handyman = document.getElementById("handyman");
    handyman.draggable = true;
    handyman.addEventListener("dragstart", e => {
        // Required for Chrome drag start
        if (e.dataTransfer) e.dataTransfer.setData("text/plain", "");
        handyman.dataset.dragging = "true";
    });
    handyman.addEventListener("dragend", () => delete handyman.dataset.dragging);

    // Toolbar and home icon setup
    const toolbar = document.getElementById("toolbar");
    const homeIcon = document.createElement("span");
    homeIcon.id = "home-icon";
    homeIcon.className = "home-icon";
    homeIcon.textContent = "🏠";
    homeIcon.draggable = false;
    toolbar.appendChild(homeIcon);

    // Toolbar drop: save & close editor, return handyman
    toolbar.addEventListener("dragover", e => e.preventDefault());
    toolbar.addEventListener("drop", e => {
        e.preventDefault();
        if (currentOverlay) {
            const card = currentOverlay.parentNode;
            const inputs = currentOverlay.querySelectorAll("input");
            inputs.forEach(input => {
                const key = input.name;
                card.dataset[key] = input.value;
            });
            // Update visible text
            if (card.dataset.type === 'menu' && card.dataset.menu && card.dataset.text) {
                card.textContent = `${card.dataset.menu}: ${card.dataset.text}`;
            } else if (card.dataset.text) {
                card.textContent = card.dataset.text;
            }
            currentOverlay.remove();
            currentOverlay = null;
        }
        toolbar.appendChild(handyman);
    });

    // Home icon drop: save & keep editor open, return handyman
    homeIcon.addEventListener("dragover", e => e.preventDefault());
    homeIcon.addEventListener("drop", e => {
        e.preventDefault();
        toolbar.insertBefore(handyman, homeIcon);
        if (currentOverlay) {
            const card = currentOverlay.parentNode;
            const inputs = currentOverlay.querySelectorAll("input");
            inputs.forEach(input => {
                const key = input.name;
                card.dataset[key] = input.value;
            });
            // Update visible text
            if (card.dataset.type === 'menu' && card.dataset.menu && card.dataset.text) {
                card.textContent = `${card.dataset.menu}: ${card.dataset.text}`;
            } else if (card.dataset.text) {
                card.textContent = card.dataset.text;
            }
            // Editor remains open
        }
    });

    // Build and render tree
    const container = document.getElementById("tree-container");
    const menuMap = {}, childrenMap = {}, offeringMap = {};

    data.menus.forEach(menu => {
        menuMap[menu.menu] = menu;
        const parent = menu.parent || null;
        (childrenMap[parent] = childrenMap[parent] || []).push(menu);
    });
    data.offerings.forEach(o => {
        (offeringMap[o.menu] = offeringMap[o.menu] || []).push(o);
    });

    function renderMenu(menu, level = 0) {
        const wrapper = document.createElement("div");
        wrapper.style.marginLeft = `${level * 20}px`;

        const menuCard = document.createElement("div");
        menuCard.className = "card menu-card";
        menuCard.textContent = menu.menu + ": " + (menu.text || "");
        menuCard.dataset.type = "menu";
        menuCard.addEventListener("dragover", e => e.preventDefault());
        menuCard.addEventListener("drop", () => showOverlay(menuCard, menu));
        wrapper.appendChild(menuCard);

        (offeringMap[menu.menu] || []).forEach(off => {
            const offerCard = document.createElement("div");
            offerCard.className = "card offering-card";
            offerCard.textContent = off.text;
            offerCard.dataset.type = "offering";
            offerCard.addEventListener("dragover", e => e.preventDefault());
            offerCard.addEventListener("drop", () => showOverlay(offerCard, off));
            wrapper.appendChild(offerCard);
        });

        (childrenMap[menu.menu] || []).forEach(child => {
            wrapper.appendChild(renderMenu(child, level + 1));
        });

        return wrapper;
    }

    (childrenMap[null] || []).forEach(m => container.appendChild(renderMenu(m)));
};

function showOverlay(card, data) {
    if (currentOverlay) currentOverlay.remove();

    const overlay = document.createElement("div");
    overlay.className = "editor-overlay";

    Object.keys(data).forEach(key => {
        if (key === "type") return;
        // Prefill from dataset if present, otherwise use data
        const value = card.dataset[key] || data[key] || "";
        const field = document.createElement("div");
        field.innerHTML = `<label>${key}: <input name="${key}" value="${value}"></label>`;
        overlay.appendChild(field);
    });

    overlay.addEventListener("dragover", e => e.preventDefault());
    overlay.addEventListener("drop", e => {
        e.preventDefault();
        overlay.appendChild(handyman);
    });

    overlay.appendChild(handyman);
    currentOverlay = overlay;
    card.appendChild(overlay);
}
