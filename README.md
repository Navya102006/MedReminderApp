# 💊 MedReminderApp

A **cross-platform medication reminder application** built with **React Native (Expo)** and a **Flask** backend. It allows patients to scan or manually add prescriptions, receive timed medicine reminders, and alert caretakers when doses are missed.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📷 Scan Prescription | Upload or capture a prescription image; OCR auto-detects medicine names |
| 💊 Manual Entry | Add medicines manually with name, dosage, frequency, and duration |
| 🔔 Smart Reminders | Push notifications scheduled at the right time(s) each day |
| 📊 Adherence Dashboard | Track taken, missed, and remaining doses with a % adherence score |
| 🚨 Caretaker Alerts | Sends email to caretaker when a dose is postponed/skipped 3 times |
| 🌐 Cross-Platform | Runs on Android, iOS, and Web |

---

## 📋 Prerequisites

Install these tools before getting started.

### ✅ Required on All Platforms

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18 or later | https://nodejs.org |
| Python | 3.10 or later | https://python.org |
| Expo Go (mobile) | Latest | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779) |

### 🪟 Windows — Extra Step: Tesseract OCR

Tesseract is required for reading prescription images.

1. Download the installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Run the installer — use the **default install path**: `C:\Program Files\Tesseract-OCR\`
3. During installation, check **"Add Tesseract to PATH"**
4. Verify: open Command Prompt and run:
   ```cmd
   tesseract --version
   ```

### 🐧 Linux — Extra Step: Tesseract OCR

```bash
# Ubuntu / Debian
sudo apt update && sudo apt install tesseract-ocr -y

# Fedora / RHEL
sudo dnf install tesseract -y

# Verify
tesseract --version
```

---

## 🚀 Setup & Installation

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-username/MedReminderApp.git
cd MedReminderApp
```

### Step 2 — Install Frontend Dependencies

```bash
npm install
```

### Step 3 — Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
cd ..
```

> **Note:** On Linux, you may need to use `pip3` instead of `pip`.

---

## ▶️ Running the App

You need to run **two servers** at the same time — the Flask backend and the Expo frontend. Open two separate terminal windows.

### Terminal 1 — Start the Flask Backend

```bash
# Windows
cd backend
python app.py

# Linux / macOS
cd backend
python3 app.py
```

You should see:
```
Loaded 307 medicines.
* Running on http://0.0.0.0:5000
```

### Terminal 2 — Start the Expo Frontend

```bash
npx expo start --lan
```

A **QR code** will appear in the terminal.

---

## 📱 Opening the App

| Platform | How to open |
|----------|-------------|
| **Android** | Open **Expo Go** → tap "Scan QR Code" → scan the QR from terminal |
| **iOS** | Open the **Camera app** → point at QR code → tap the notification |
| **Web Browser** | Press `w` in the Expo terminal, or visit http://localhost:8081 |

> ⚠️ **Important:** Your phone and computer must be on the **same Wi-Fi network** to use Expo Go.

---

## 📧 Setting Up Email Alerts (Optional)

When a patient skips a medicine 3 times, the app emails the caretaker. To enable this:

1. Create a `.env` file inside the `backend/` folder:

   ```bash
   # backend/.env
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

2. For Gmail, generate an **App Password** (not your regular password):
   - Go to https://myaccount.google.com/security
   - Enable **2-Step Verification**
   - Go to **App Passwords** → generate one for "Mail"

> If no credentials are provided, the alert is simulated locally (no email is sent) and the app still works normally.

---

## 🗂️ Project Structure

```
MedReminderApp/
├── app/                        # Expo Router screens
│   ├── index.js                # Welcome / landing screen
│   ├── _layout.js              # Root navigation layout
│   ├── adherence-dashboard.js  # Adherence stats screen
│   ├── auth/
│   │   ├── login.js            # Login screen
│   │   └── register.js         # Registration screen
│   └── (tabs)/
│       ├── home.js             # Daily reminders screen
│       ├── upload.js           # Prescription scan & entry
│       └── medicine-list.js    # All saved prescriptions
├── backend/
│   ├── app.py                  # Flask API (OCR + email alerts)
│   ├── medicines.csv           # Medicine name database (307 entries)
│   ├── requirements.txt        # Python dependencies
│   └── uploads/                # Uploaded images (gitignored)
├── constants/
│   └── api.js                  # Dynamic backend URL (works on any network)
├── context/
│   └── MedicineContext.js      # Global state (prescriptions, logs)
└── utils/
    └── ReminderEngine.js       # Notification scheduling & speech
```

---

## 🔧 Troubleshooting

### Blank white screen on web
Run this command, then restart Expo:
```bash
npx expo install react-native-web react-dom @expo/metro-runtime
npx expo start --lan
```

### "Tesseract not found" error
- **Windows:** Reinstall Tesseract and ensure "Add to PATH" is checked, then restart your terminal.
- **Linux:** Run `sudo apt install tesseract-ocr` and verify with `tesseract --version`.

### App can't connect to the backend
- Make sure the **Flask backend is running** (`python backend/app.py`)
- Make sure your phone and computer are on the **same Wi-Fi network**
- The app auto-detects the server IP — no manual configuration needed

### Notifications not working
- Push notifications only work on **Android and iOS** (not web)
- Make sure you granted notification permissions when prompted on first launch

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native + Expo Router |
| State | React Context + AsyncStorage |
| Notifications | Expo Notifications |
| Backend | Python Flask |
| OCR | Tesseract via pytesseract |
| Image Processing | Pillow |
| Email | Python smtplib |

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
