# Borongan RoadWatch Mobile Application

Cross-platform mobile application operated by everyday citizens for real-time reporting of road damages and monitoring maintenance progress in Borongan City, Eastern Samar.

## Study Objectives & Scope Satisfied
1. **Objective 1 & Scope 1**: Cross-platform mobile app operated by everyday citizens to capture and submit real-time reports with photos.
2. **Scope 2**: Uses built-in smartphone sensor hardware (Global Positioning System / GPS) to capture and verify latitude and longitude coordinates.
3. **Objective 3 & Scope 4**: Integrated automated data processing engine classifying damage severity (0–100 score).
4. **Objective 4**: Real-time 6-stage status tracking module (`submitted` → `under_review` → `verified` → `scheduled` → `in_progress` → `completed`).
5. **Objective 5**: Built-in 16-item IBM Computer Usability Satisfaction Questionnaire (CSUQ) for citizen end-user testing.
6. **Limitation 1 & 7**: Exclusively routine surface defects solely for Borongan City (GPS boundary validation & bridge failure exclusions).
7. **Limitation 2 & 6**: Stable-session upload protection and network status detection.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli` or via `npx expo`)
- Physical Android/iOS device with Expo Go, or an Android/iOS Emulator, or Web Browser

### Installation
```bash
cd mobile
npm install
```

### Running the App
- **Interactive Expo Menu**:
  ```bash
  npx expo start
  ```
- **Run on Android device/emulator**:
  ```bash
  npx expo start --android
  ```
- **Run on iOS simulator**:
  ```bash
  npx expo start --ios
  ```
- **Run in Web Browser**:
  ```bash
  npx expo start --web
  ```

---

## Application Structure
- `src/config/supabase.ts` - Shared Supabase cloud database & storage configuration.
- `src/services/classifier.ts` - Automated data processing algorithm calculating composite severity scores.
- `src/services/location.ts` - Smartphone GPS hardware sensor acquisition & Borongan bounding-box validation.
- `src/screens/HomeScreen.tsx` - Citizen landing dashboard with summary stats and quick report trigger.
- `src/screens/ReportDamageScreen.tsx` - Camera photo capture, GPS fix, damage classification, and stable upload.
- `src/screens/ReportDetailScreen.tsx` - Real-time status tracking module through the 6-stage repair workflow.
- `src/screens/MyReportsScreen.tsx` - Citizen's list of submitted reports with search and filter.
- `src/screens/CSUQScreen.tsx` - Standardized IBM CSUQ 16-item usability questionnaire.
- `src/screens/AuthScreen.tsx` - Citizen registration and authentication.
