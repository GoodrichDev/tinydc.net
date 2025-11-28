# tinyDC — Mini Datacenter Rack Visualizer

tinyDC is a lightweight, static, client-side web application that visually represents your homelab or datacenter racks.  
It loads a JSON configuration file and dynamically renders:

- Rack units (U positions)
- Devices with configurable height and starting U positions
- Hardware details (CPU, RAM, storage, NIC, notes, etc.)
- Service listings for each device

No backend is required — everything runs directly in the browser. (At the moment, this may change with status monitoring)

---

## 🎯 Features

- **Dynamic Rack Rendering**
    - Supports arbitrary rack sizes (e.g., 8U, 16U, 42U)
    - Devices can occupy multiple rack units
    - Devices can start at any U position (gaps supported)

- **Interactive Device Details**
    - CPU, RAM, storage, and NIC specs
    - Services list
    - Notes + supplemental info

- **Clean, modern UI**
    - Dark mode
    - Automatically highlights selected device
    - Scroll-friendly viewport

- **Pure Static Hosting**
    - Works on NGINX, GitHub Pages, Cloudflare Pages, Apache, or any static host

- **Webhook Deploy Support**
    - Automatically updates when you push to your GitHub repository
    - No manual pulling needed once configured

---

# 📁 Project Structure
```
/var/www/tinydc.net
├── index.html
├── styles.css
├── script.js
└── rack-config.json
```

---

# ⚙️ JSON Device Configuration

tinyDC loads device information from `rack-config.json`.

### Example:

```json
{
  "rackName": "Homelab Rack",
  "totalUnits": 16,
  "devices": [
    {
      "id": "server-1",
      "name": "Dell R720",
      "startU": 2,
      "heightU": 2,
      "cpu": "2 x Intel Xeon E5-2670",
      "ram": "128 GB DDR3",
      "storage": "8 x 2 TB HDD (RAID 10)",
      "nic": "4 x 1 Gbps",
      "services": ["Proxmox", "VMs", "Monitoring"],
      "notes": "Main hypervisor node."
    }
  ]
}

