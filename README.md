# Borongan Road Damage Reporting & Maintenance Management System

> **A GPS-Based Civic Infrastructure Monitoring and GIS Maintenance Dashboard for Borongan City, Eastern Samar.**

---

## 📁 Repository Structure

```text
pixel-perfect-main/
├── pixel-perfect-main/      # Web GIS Dashboard & Citizen Web Portal (React 19 + TanStack Start + Vite)
├── mobile/                  # Cross-Platform Citizen Mobile App (React Native + Expo)
├── package.json             # Root workspace script launcher
└── README.md
```

---

## 🚀 Quick Start Commands

You can run commands directly from the **root folder** or inside the individual project directories:

### 1. Web Application (GIS Dashboard & Citizen Portal)
```bash
# Start Web Development Server (at http://localhost:3000)
npm run dev

# Or from inside the web folder:
cd pixel-perfect-main
npm run dev
```

### 2. Build Web Application
```bash
npm run build
```

### 3. Mobile Application (React Native / Expo)
```bash
# Start Expo Metro Bundler
npm run mobile:start

# Or run directly on Android device/emulator:
npm run mobile:android
```

---

## 📱 Android APK Package

The standalone Android APK is pre-packaged and available for direct download at:
- **Local file**: `pixel-perfect-main/public/downloads/borongan-roadwatch.apk`
- **Web Download URL**: `http://localhost:3000/download` (or `http://localhost:3000/downloads/borongan-roadwatch.apk`)
- **QR Code**: Scan the QR code displayed on `http://localhost:3000/download` using any Android smartphone camera.

---

## 📋 Evaluation Portals (ISO 25010 & IBM CSUQ)

- **Expert Evaluation (ISO 25010)**: `http://localhost:3000/evaluation/iso25010`
- **Citizen Usability Testing (IBM CSUQ)**: `http://localhost:3000/evaluation/csuq`
- **Administrative Evaluation Analytics**: `http://localhost:3000/admin/evaluation`
