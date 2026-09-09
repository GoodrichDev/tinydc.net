
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
    const rackEl = document.getElementById("rack");
    const rackTitle = document.getElementById("rack-title");

    rackTitle.textContent = config.rackName || "Server Rack";
    document.getElementById("inventory-note").textContent = config.inventoryNote || "";
    rackEl.innerHTML = "";

    const totalUnits = config.totalUnits || 42;
    const devices = config.devices || [];

    const slots = new Array(totalUnits).fill(null);

    devices.forEach(device => {
        const height = Number(device.heightU) || 1;
        const startU = Number(device.startU);

        if (!startU || startU < 1 || startU > totalUnits) {
            console.warn(`Invalid startU for device ${device.name}`);
            return;
        }

        const bottomIndex = startU - 1;
        const topIndex = bottomIndex + height - 1;

        if (topIndex >= totalUnits) {
            console.warn(`Device ${device.name} exceeds rack height`);
            return;
        }

        for (let i = 0; i < height; i++) {
            slots[bottomIndex + i] = device;
        }

        device._bottomUnit = startU;
        device._topUnit = startU + height - 1;
        device._height = height;
    });


    let lastDeviceId = null;
    let lastElement = null;

    for (let u = totalUnits; u >= 1; u--) {
        const slotIndex = u - 1;
        const device = slots[slotIndex];
        const btn = document.createElement(device ? "button" : "div");

        btn.classList.add("rack-unit");
        btn.dataset.unit = `U${u}`;

        const unitLabel = document.createElement("span");
        unitLabel.className = "unit-label";
        unitLabel.textContent = `U${u}`;
        btn.appendChild(unitLabel);

        if (device) {
            btn.type = "button";
            btn.dataset.deviceId = device.id;
            btn.setAttribute("aria-label", `${device.name}, U${u}`);
            btn.setAttribute("aria-pressed", "false");
            btn.classList.add("occupied");

            if (device.id !== lastDeviceId) {
                btn.classList.add("device-start");
                if (lastElement && lastDeviceId) {
                    lastElement.classList.add("device-end");
                }

                const deviceLabel = document.createElement("span");
                deviceLabel.className = "device-label";
                deviceLabel.textContent = device.name || "Device";
                btn.appendChild(deviceLabel);
            } else {
                // Continuation of same device
                btn.classList.add("continued");
            }

            btn.addEventListener("click", () => {
                showDetails(device);
            });

            lastDeviceId = device.id;
        } else {
            btn.classList.add("empty");

            if (lastElement && lastDeviceId) {
                lastElement.classList.add("device-end");
            }

            lastDeviceId = null;
        }

        rackEl.appendChild(btn);
        lastElement = btn;
    }

    if (lastElement && lastDeviceId) {
        lastElement.classList.add("device-end");
    }
}

function showDetails(device) {
    document.querySelectorAll(".rack-unit.occupied").forEach(button => {
        const selected = button.dataset.deviceId === device.id;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
    });
    const detailsEmpty = document.getElementById("details-empty");
    const details = document.getElementById("details");

    detailsEmpty.style.display = "none";
    details.classList.remove("hidden");

    document.getElementById("detail-name").textContent = device.name || "Device";
    document.getElementById("detail-units").textContent = `${device._height || device.heightU || 1} U`;
    document.getElementById("detail-position").textContent =
        `Top U${device._topUnit}, Bottom U${device._bottomUnit}`;

    const statusSpan = document.getElementById("detail-online");
    statusSpan.textContent = "Unavailable";
    statusSpan.className = "status-pill status-unknown";

    const cpuEl = document.getElementById("detail-cpu");
    const ramEl = document.getElementById("detail-ram");
    const storageEl = document.getElementById("detail-storage");
    const nicEl = document.getElementById("detail-nic");

    cpuEl.textContent = device.cpu || "Not set yet";
    ramEl.textContent = device.ram || "Not set yet";
    storageEl.textContent = device.storage || "Not set yet";
    nicEl.textContent = device.nic || "Not set yet";


    const servicesEl = document.getElementById("detail-services");
    servicesEl.innerHTML = "";

    if (Array.isArray(device.services) && device.services.length > 0) {
        device.services.forEach(serviceName => {
            const li = document.createElement("li");
            li.textContent = serviceName;
            servicesEl.appendChild(li);
        });
    } else {
        const li = document.createElement("li");
        li.textContent = "No services listed yet.";
        servicesEl.appendChild(li);
    }

    const notesEl = document.getElementById("detail-notes");
    notesEl.textContent = device.notes || "No notes added yet.";
}

document.addEventListener("DOMContentLoaded", async () => {
    const config = await loadRackConfig();
    if (!config) {
        return;
    }
    buildRack(config);
});
