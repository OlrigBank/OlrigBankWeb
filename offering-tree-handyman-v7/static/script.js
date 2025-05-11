let handyman = null;
let currentOverlay = null;

window.onload = async function() {
    const res = await fetch("/load");
    const data = await res.json();

    handyman = document.getElementById("handyman");
    handyman.addEventListener("dragstart", () => handyman.dataset.dragging = "true");
    // Allow dragging end to clear dragging state
    handyman.addEventListener('dragend', () => delete handyman.dataset.dragging);

    // Toolbar drop target: return handyman home and close overlay, saving updates
    
const toolbar = document.getElementById('toolbar');
// Add static non-draggable home icon next to handyman
const homeIcon = document.createElement('span');
homeIcon.id = 'home-icon';
homeIcon.className = 'home-icon';
homeIcon.textContent = '🏠';
homeIcon.draggable = false;
toolbar.appendChild(homeIcon);

    toolbar.addEventListener('dragover', e => e.preventDefault());
    toolbar.addEventListener('drop', e => {
        e.preventDefault();
        if (currentOverlay) {
            // Collect form data and update underlying card
            const card = currentOverlay.parentNode;
            const inputs = currentOverlay.querySelectorAll('input');
            const updated = {};
            inputs.forEach(input => {
                const label = input.parentNode.textContent;
                const key = label.split(':')[0];
                updated[key] = input.value;
            });
            if (card.dataset.type === 'menu') {
                card.textContent = updated.menu + ': ' + updated.text;
            } else {
                card.textContent = updated.text;
            }
            currentOverlay.remove();
            currentOverlay = null;
        }
        toolbar.appendChild(handyman);
    });
    

    const container = document.getElementById("tree-container");

    const menuMap = {};
    const childrenMap = {};
    for (const menu of data.menus) {
        menuMap[menu.menu] = menu;
        const parent = menu.parent || null;
        if (!childrenMap[parent]) childrenMap[parent] = [];
        childrenMap[parent].push(menu);
    }

    const offeringMap = {};
    for (const o of data.offerings) {
        if (!offeringMap[o.menu]) offeringMap[o.menu] = [];
        offeringMap[o.menu].push(o);
    }

    function renderMenu(menu, level = 0) {
        const wrapper = document.createElement("div");
        wrapper.style.marginLeft = (level * 20) + "px";

        const menuCard = document.createElement("div");
        menuCard.className = "card menu-card";
        menuCard.textContent = menu.menu + ": " + (menu.text || "");
        menuCard.dataset.type = "menu";
        menuCard.addEventListener("dragover", e => e.preventDefault());
        menuCard.addEventListener("drop", () => showOverlay(menuCard, { ...menu, type: "menu" }));

        wrapper.appendChild(menuCard);

        if (offeringMap[menu.menu]) {
            for (const o of offeringMap[menu.menu]) {
                const offerCard = document.createElement("div");
                offerCard.className = "card offering-card";
                offerCard.textContent = o.text;
                offerCard.dataset.type = "offering";
                offerCard.addEventListener("dragover", e => e.preventDefault());
                offerCard.addEventListener("drop", () => showOverlay(offerCard, { ...o, type: "offering" }));
                wrapper.appendChild(offerCard);
            }
        }

        if (childrenMap[menu.menu]) {
            for (const child of childrenMap[menu.menu]) {
                wrapper.appendChild(renderMenu(child, level + 1));
            }
        }

        return wrapper;
    }

    for (const menu of childrenMap[null] || []) {
        container.appendChild(renderMenu(menu));
    }
};

function showOverlay(card, data) {
    console.log("👨‍🔧 Handyman dropped on card:", data);
    if (currentOverlay) {
        currentOverlay.remove();
    }

    const overlay = document.createElement("div");
    overlay.className = "editor-overlay";


    for (const key in data) {
        if (key === "type") continue;
        const field = document.createElement("div");
        field.innerHTML = `<label>${key}: <input value="${data[key]}"></label>`;
        overlay.appendChild(field);
    }

    card.appendChild(overlay);

        // Make overlay a drop target to accept handyman icon
        overlay.addEventListener('dragover', e => e.preventDefault());
        overlay.addEventListener('drop', e => {
            e.preventDefault();
            overlay.appendChild(handyman);
        });
        // Move handyman into this overlay when opened
        overlay.appendChild(handyman);
    
    currentOverlay = overlay;
}