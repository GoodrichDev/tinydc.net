
async function loadRackConfig() {
    try {
        const res = await fetch("rack-config.json", { cache: "no-cache" });
        if (!res.ok) throw new Error(`Inventory request failed (${res.status})`);
        const config = await res.json();
        validateRackConfig(config);
        return config;
    } catch (error) {
        console.error("Could not load rack inventory", error);
        document.getElementById("details-empty").textContent =
            "Rack inventory is unavailable. Please reload the page to try again.";
        return null;
    }
}

function validateRackConfig(config) {
    if (!config || !Number.isInteger(config.totalUnits) || config.totalUnits < 1 ||
        config.totalUnits > 100 || !Array.isArray(config.devices)) {
        throw new Error("Invalid rack configuration");
    }
    const ids = new Set();
    const occupied = new Set();
    for (const device of config.devices) {
        if (!device || typeof device.id !== "string" || !device.id || ids.has(device.id) ||
            !Number.isInteger(device.startU) || !Number.isInteger(device.heightU) ||
            device.startU < 1 || device.heightU < 1 ||
            device.startU + device.heightU - 1 > config.totalUnits) {
            throw new Error("Invalid device placement");
        }
        ids.add(device.id);
        for (let u = device.startU; u < device.startU + device.heightU; u++) {
            if (occupied.has(u)) throw new Error(`Overlapping devices at U${u}`);
            occupied.add(u);
        }
    }
}

function buildRack(config) {
    const rack = document.getElementById("rack");
    const devices = config.devices;
    const occupied = devices.reduce((sum, device) => sum + device.heightU, 0);

    document.getElementById("rack-title").textContent = config.rackName || "Server rack";
    document.getElementById("inventory-note").textContent = config.inventoryNote || "No inventory source provided.";
    document.getElementById("device-count").textContent = devices.length;
    document.getElementById("occupied-units").textContent = occupied;
    document.getElementById("total-units").textContent = config.totalUnits;
    document.getElementById("rack-capacity").textContent = `${config.totalUnits} U RACK`;
    rack.replaceChildren();
    rack.style.setProperty("--total-units", config.totalUnits);

    const occupiedUnits = new Set();
    for (const device of devices) {
        for (let u = device.startU; u < device.startU + device.heightU; u++) occupiedUnits.add(u);
    }
    for (let u = config.totalUnits; u >= 1; u--) {
        const row = config.totalUnits - u + 1;
        const label = document.createElement("span");
        label.className = "unit-label";
        label.textContent = String(u).padStart(2, "0");
        label.style.gridRow = String(row);
        label.setAttribute("aria-hidden", "true");
        rack.appendChild(label);
        if (!occupiedUnits.has(u)) {
            const empty = document.createElement("div");
            empty.className = "rack-empty";
            empty.style.gridRow = String(row);
            empty.setAttribute("aria-label", `U${u}, empty`);
            rack.appendChild(empty);
        }
    }

    // DOM order follows the visual top-to-bottom rack order for keyboard navigation.
    const orderedDevices = [...devices].sort((a, b) => b.startU - a.startU);
    for (const device of orderedDevices) {
        const topUnit = device.startU + device.heightU - 1;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "rack-device";
        button.dataset.deviceId = device.id;
        button.style.gridRow = `${config.totalUnits - topUnit + 1} / span ${device.heightU}`;
        button.setAttribute("aria-label", `${device.name || "Device"}, ${formatPosition(device)}, ${device.heightU} ${device.heightU === 1 ? "rack unit" : "rack units"}`);
        button.setAttribute("aria-pressed", "false");
        button.setAttribute("aria-controls", "details");

        const name = document.createElement("span");
        name.className = "device-label";
        name.textContent = device.name || "Device";
        if (device.heightU > 1) {
            const identifier = document.createElement("small");
            identifier.textContent = device.id;
            name.appendChild(identifier);
        }
        const height = document.createElement("span");
        height.className = "device-height";
        height.textContent = `${device.heightU}U`;
        button.append(name, height);
        button.addEventListener("click", () => {
            showDetails(device);
            if (window.matchMedia("(max-width: 760px)").matches) {
                const panel = document.getElementById("device-panel");
                panel.focus({ preventScroll: true });
                panel.scrollIntoView({ block: "start", behavior: "instant" });
            }
        });
        rack.appendChild(button);
    }

    if (orderedDevices.length) {
        showDetails(orderedDevices[0]);
    } else {
        document.getElementById("details").hidden = true;
        const empty = document.getElementById("details-empty");
        empty.hidden = false;
        empty.textContent = "No devices in this rack yet.";
    }
}

function formatPosition(device) {
    const bottom = String(device.startU).padStart(2, "0");
    const top = String(device.startU + device.heightU - 1).padStart(2, "0");
    return device.heightU === 1 ? `U${bottom}` : `U${bottom}–U${top}`;
}

function showDetails(device) {
    document.querySelectorAll(".rack-device").forEach(button => {
        const selected = button.dataset.deviceId === device.id;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
    });
    document.getElementById("details-empty").hidden = true;
    document.getElementById("details").hidden = false;
    document.getElementById("detail-id").textContent = device.id;
    document.getElementById("detail-name").textContent = device.name || "Device";
    document.getElementById("detail-units").textContent = `${device.heightU} ${device.heightU === 1 ? "rack unit" : "rack units"}`;
    document.getElementById("detail-position").textContent = formatPosition(device);
    document.getElementById("detail-online").textContent = "unavailable";

    for (const field of ["cpu", "ram", "storage", "nic"]) {
        const value = device[field];
        document.getElementById(`detail-${field}`).textContent = value === "N/A" ? "Not applicable" : value || "Not documented";
    }
    const services = document.getElementById("detail-services");
    services.replaceChildren();
    const names = Array.isArray(device.services) && device.services.length ? device.services : ["No services listed."];
    for (const name of names) {
        const item = document.createElement("li");
        item.textContent = name;
        services.appendChild(item);
    }
    document.getElementById("detail-notes").textContent = device.notes || "No notes added.";
}

document.addEventListener("DOMContentLoaded", async () => {
    const config = await loadRackConfig();
    if (config) buildRack(config);
});
