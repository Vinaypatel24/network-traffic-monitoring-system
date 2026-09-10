# 🚀 Complete Setup Guide — From Zero to Running

> **Audience**: You have never touched this project before. This guide walks you through
> every single click, download, and command — from a blank computer to seeing the
> dashboard in your browser.

---

## 📋 Table of Contents

1. [Prerequisites — What You'll Need](#-prerequisites--what-youll-need)
2. [Install Git](#step-1--install-git)
3. [Install Java 21 (JDK)](#step-2--install-java-21-jdk)
4. [Install Node.js](#step-3--install-nodejs)
5. [Install Npcap (Packet Capture Driver)](#step-4--install-npcap-packet-capture-driver)
6. [Create a Folder & Clone the Project](#step-5--create-a-folder--clone-the-project)
7. [Run the Backend (Spring Boot Server)](#step-6--run-the-backend-spring-boot-server)
8. [Run the Frontend (React Dashboard)](#step-7--run-the-frontend-react-dashboard)
9. [Open the App in Your Browser](#step-8--open-the-app-in-your-browser)
10. [Alternative: One-Click Launch](#-alternative-one-click-launch-quick-start)
11. [Alternative: Docker Deployment](#-alternative-docker-deployment)
12. [Troubleshooting](#-troubleshooting)

---

## 📦 Prerequisites — What You'll Need

Before we begin, here's a summary of everything this project needs:

| Software | What It Does | Download Link |
|:---|:---|:---|
| **Git** | Lets you download (clone) the project from GitHub | https://git-scm.com/downloads/win |
| **Java 21 (JDK)** | Runs the backend server | https://adoptium.net/ |
| **Node.js 20+** | Runs the frontend dashboard | https://nodejs.org/ |
| **Npcap** | Captures live network packets on Windows | https://npcap.com/#download |

> **💡 Tip:** If you already have any of these installed, you can skip that step. To check, open
> Command Prompt and type `git --version`, `java -version`, or `node -v`.

---

## Step 1 — 🔧 Install Git

Git is the tool that lets you download the project code from GitHub.

### 1.1 Download Git

1. Open your web browser (Chrome, Edge, Firefox, etc.)
2. Go to: **https://git-scm.com/downloads/win**
3. Click the **"Click here to download"** button — this downloads the installer (e.g., `Git-2.47.1-64-bit.exe`)
4. Wait for the download to finish (check the bottom of your browser or your `Downloads` folder)

### 1.2 Install Git

1. Go to your **Downloads** folder
2. **Double-click** the file `Git-2.47.1-64-bit.exe` (or whatever version you downloaded)
3. If Windows asks *"Do you want to allow this app to make changes?"* → Click **Yes**
4. The Git Setup wizard will open. Click through the screens:
   - **Select Components** → Leave defaults, click **Next**
   - **Default Editor** → Leave as "Use Vim" or change to "Use Notepad" if you prefer, click **Next**
   - **Adjusting PATH** → Select **"Git from the command line and also from 3rd-party software"** (this is usually the default), click **Next**
   - For all remaining screens → Just click **Next** to accept defaults
5. On the final screen, click **Install**
6. When it finishes, click **Finish**

### 1.3 Verify Git is Installed

1. Press `Windows Key + R` on your keyboard
2. Type `cmd` and press **Enter** — this opens Command Prompt
3. Type the following and press **Enter**:
   ```
   git --version
   ```
4. You should see something like: `git version 2.47.1.windows.1`
5. ✅ If you see a version number, Git is installed! You can close this window.

---

## Step 2 — ☕ Install Java 21 (JDK)

The backend server is built with Java. You need Java Development Kit (JDK) version 21.

### 2.1 Download Java 21

1. Open your browser and go to: **https://adoptium.net/**
2. You should see a big button saying **"Latest LTS Release"** — make sure it says **JDK 21** (or select version 21 from the dropdown)
3. Click the **download button** for **Windows x64** → `.msi` installer
4. Wait for the download to finish (e.g., `OpenJDK21U-jdk_x64_windows_hotspot_21.0.x.msi`)

### 2.2 Install Java 21

1. Go to your **Downloads** folder
2. **Double-click** the `.msi` file
3. If Windows asks *"Do you want to allow this app to make changes?"* → Click **Yes**
4. The installer wizard opens:
   - Click **Next**
   - **Custom Setup** → ⚠️ **IMPORTANT**: Click the icon next to **"Set JAVA_HOME variable"** and change it to **"Will be installed on local hard drive"**. This makes sure the system knows where Java is.
   - Click **Next**, then **Install**
5. When it finishes, click **Finish**

### 2.3 Verify Java is Installed

1. **Close all open Command Prompt windows** (important — so it picks up the new PATH)
2. Press `Windows Key + R`, type `cmd`, press **Enter**
3. Type:
   ```
   java -version
   ```
4. You should see something like:
   ```
   openjdk version "21.0.x" 2024-xx-xx LTS
   ```
5. ✅ If you see version 21, you're good!

---

## Step 3 — 🟢 Install Node.js

The frontend dashboard is built with React and needs Node.js to run.

### 3.1 Download Node.js

1. Open your browser and go to: **https://nodejs.org/**
2. Click the button that says **"LTS"** (Long Term Support) — this downloads the recommended version (20.x or newer)
3. Wait for the download to finish (e.g., `node-v20.x.x-x64.msi`)

### 3.2 Install Node.js

1. Go to your **Downloads** folder
2. **Double-click** the `.msi` file
3. If Windows asks *"Do you want to allow this app to make changes?"* → Click **Yes**
4. The installer wizard opens:
   - Click **Next**
   - Accept the license agreement → Click **Next**
   - **Destination Folder** → Leave default → Click **Next**
   - **Custom Setup** → Leave default → Click **Next**
   - **Tools for Native Modules** → ☐ You can leave this unchecked → Click **Next**
   - Click **Install**
5. When it finishes, click **Finish**

### 3.3 Verify Node.js is Installed

1. **Close all open Command Prompt windows**
2. Press `Windows Key + R`, type `cmd`, press **Enter**
3. Type these two commands one at a time:
   ```
   node -v
   ```
   Should show: `v20.x.x` (or higher)
   ```
   npm -v
   ```
   Should show: `10.x.x` (or higher)
4. ✅ Both worked? Node.js is ready!

---

## Step 4 — 📡 Install Npcap (Packet Capture Driver)

Npcap is a Windows driver that allows the application to capture live network traffic.

> **📝 Note:** This step is **required** for live packet capture. If you skip this, the app will still
> start (login, dashboard, and recorded data will work), but **live capture won't function**.

### 4.1 Download Npcap

1. Open your browser and go to: **https://npcap.com/#download**
2. Click the **"Npcap x.x.x installer"** link to download
3. Wait for the download (e.g., `npcap-1.80.exe`)

### 4.2 Install Npcap

1. Go to your **Downloads** folder
2. **Double-click** `npcap-1.80.exe`
3. If Windows asks *"Do you want to allow this app to make changes?"* → Click **Yes**
4. In the installer:
   - Click **I Agree** to accept the license
   - On the **Installation Options** screen:
     - ✅ Check **"Install Npcap in WinPcap API-compatible Mode"**
     - Leave other options as default
   - Click **Install**
5. When it finishes, click **Finish**

> **💡 Tip:** No verification command needed for Npcap — if the install completed without errors, you're set.

---

## Step 5 — 📁 Create a Folder & Clone the Project

Now you'll download the project source code from GitHub onto your computer.

### 5.1 Create a Folder on Your Desktop

1. Go to your **Desktop** (minimize all windows or press `Windows Key + D`)
2. **Right-click** on any empty space on the Desktop
3. In the menu that appears:
   - **Windows 11**: Click **"New"** → Click **"Folder"**
   - **Windows 10**: Hover over **"New"** → Click **"Folder"**
4. A new folder will appear with its name highlighted. Type:
   ```
   NetMonitor
   ```
5. Press **Enter** to confirm the folder name

### 5.2 Open Terminal in That Folder

1. **Double-click** the `NetMonitor` folder you just created to open it
2. You should see an empty folder in File Explorer
3. Now you need to open a terminal here. Choose one of these methods:

   **Method A — Address Bar (Easiest):**
   - Click on the **address bar** at the top of File Explorer (it shows something like `Desktop > NetMonitor`)
   - Type `cmd` and press **Enter**
   - A Command Prompt window will open, already inside your `NetMonitor` folder

   **Method B — Right-Click (Windows 11):**
   - **Right-click** on empty space inside the folder
   - Click **"Open in Terminal"**
   - Windows Terminal (PowerShell) will open inside the folder

   **Method C — Right-Click (Windows 10):**
   - Hold **Shift** on your keyboard
   - While holding Shift, **right-click** on empty space inside the folder
   - Click **"Open PowerShell window here"** or **"Open command window here"**

### 5.3 Clone the Project from GitHub

1. In the terminal window that just opened, type this command and press **Enter**:
   ```
   git clone https://github.com/Vinaypatel24/network-traffic-monitoring-system.git
   ```
2. You'll see output like:
   ```
   Cloning into 'network-traffic-monitoring-system'...
   remote: Enumerating objects: ...
   remote: Counting objects: 100% ...
   Receiving objects: 100% ...
   Resolving deltas: 100% ...
   ```
3. Wait for it to finish (this may take 30 seconds to a few minutes depending on your internet)
4. ✅ When you see the prompt again (e.g., `C:\Users\YourName\Desktop\NetMonitor>`), the clone is done!

### 5.4 Verify the Clone

1. In the same terminal, type:
   ```
   dir
   ```
2. You should see a folder named `network-traffic-monitoring-system`
3. Now enter the project folder:
   ```
   cd network-traffic-monitoring-system
   ```
4. Type `dir` again — you should see files like:
   - `README.md`
   - `docker-compose.yml`
   - `start.bat`
   - `network-monitor-backend` (folder)
   - `network-monitor-frontend` (folder)

5. ✅ The project is cloned and ready!

---

## Step 6 — ⚙️ Run the Backend (Spring Boot Server)

The backend is a Java Spring Boot application. It needs to run first because the frontend talks to it.

### 6.1 Open a Terminal in the Backend Folder

1. If you still have the terminal open from the previous step, type:
   ```
   cd network-monitor-backend
   ```
2. If you closed it, navigate to the backend folder:
   - Open File Explorer
   - Go to: `Desktop` → `NetMonitor` → `network-traffic-monitoring-system` → `network-monitor-backend`
   - Click the **address bar**, type `cmd`, and press **Enter**

### 6.2 Start the Backend Server

> **⚠️ IMPORTANT:** **You must run this as Administrator** for live packet capture to work.
> If you don't need live capture, running normally is fine.

**Option A — Using the included start script (Easiest):**

1. In File Explorer, navigate to the `network-monitor-backend` folder
2. Find the file **`start-backend.bat`**
3. **Right-click** on `start-backend.bat`
4. Click **"Run as administrator"**
   - On Windows 11: You may need to click **"Show more options"** first to see "Run as administrator"
5. If Windows asks *"Do you want to allow this app to make changes?"* → Click **Yes**
6. A black command prompt window will open and you'll see Maven downloading dependencies and then starting Spring Boot
7. Wait until you see a line like:
   ```
   Started NetworkMonitorApplication in X.XX seconds
   ```
8. ✅ The backend is running! **Do NOT close this window** — keep it open in the background.

**Option B — Using manual Maven command:**

1. Open Command Prompt **as Administrator**:
   - Press `Windows Key`, type `cmd`
   - **Right-click** on **"Command Prompt"** in the search results
   - Click **"Run as administrator"**
2. Navigate to the backend folder:
   ```
   cd C:\Users\YourName\Desktop\NetMonitor\network-traffic-monitoring-system\network-monitor-backend
   ```
   (Replace `YourName` with your actual Windows username)
3. Run the Maven command:
   ```
   apache-maven-3.9.8\bin\mvn.cmd spring-boot:run -Dspring-boot.run.profiles=dev -Dspring.profiles.active=dev
   ```
4. The first time you run this, Maven will download all project dependencies — this can take **5–15 minutes** depending on your internet speed. Don't worry, this is normal and only happens once.
5. Wait until you see:
   ```
   Started NetworkMonitorApplication in X.XX seconds
   ```
6. ✅ Backend is running on **http://localhost:8080**

> **📝 Note:** The backend bundles its own Maven installation (`apache-maven-3.9.8` folder inside the
> project), so you do NOT need to install Maven separately.

---

## Step 7 — 🎨 Run the Frontend (React Dashboard)

The frontend is a React app built with Vite. You'll run this in a **separate** terminal window.

### 7.1 Open a NEW Terminal in the Frontend Folder

> ⚠️ Keep the backend terminal running! Open a **new, separate** terminal window.

1. Open File Explorer
2. Navigate to: `Desktop` → `NetMonitor` → `network-traffic-monitoring-system` → `network-monitor-frontend`
3. Click the **address bar** at the top, type `cmd`, and press **Enter**

### 7.2 Install Frontend Dependencies

1. In the new terminal, type:
   ```
   npm install
   ```
2. Press **Enter**
3. npm will download and install all required packages. You'll see a progress bar and output like:
   ```
   added 230 packages in 25s
   ```
4. Wait for it to finish (1–3 minutes on first run)

### 7.3 Start the Frontend Dev Server

1. In the same terminal, type:
   ```
   npm run dev
   ```
2. Press **Enter**
3. You'll see output like:
   ```
     VITE v8.x.x  ready in XXX ms

     ➜  Local:   http://localhost:5173/
     ➜  Network: http://192.168.x.x:5173/
   ```
4. ✅ The frontend is running!

---

## Step 8 — 🌐 Open the App in Your Browser

### 8.1 Access the Dashboard

1. Open your web browser (Chrome, Edge, Firefox)
2. In the address bar, type:
   ```
   http://localhost:5173
   ```
3. Press **Enter**
4. You should see the **NetMonitor login page** with a dark glassmorphic design! 🎉

### 8.2 Log In

Use the default credentials:

| Field | Value |
|:---|:---|
| **Username** | `admin` |
| **Password** | `admin` |

1. Type `admin` in the **Username** field
2. Type `admin` in the **Password** field
3. Click the **Login** button
4. ✅ You should now see the **Network Monitoring Dashboard** with live charts and statistics!

### 8.3 What You Can Do Now

- 📊 **Dashboard** — See real-time packet statistics and traffic charts
- 📦 **Packets** — Browse captured network packets with deep inspection details
- 🛡️ **Alerts** — View threat detection alerts (port scans, traffic spikes, etc.)
- 🚫 **Blacklist** — Manage IP firewall rules

---

## ⚡ Alternative: One-Click Launch (Quick Start)

If you don't need the frontend dev server with hot-reload and just want to see the app:

1. Open File Explorer
2. Navigate to: `Desktop` → `NetMonitor` → `network-traffic-monitoring-system`
3. Find the file **`start.bat`**
4. **Right-click** on `start.bat`
5. Click **"Run as administrator"**
   - On Windows 11: Click **"Show more options"** first, then **"Run as administrator"**
6. If Windows asks *"Do you want to allow this app to make changes?"* → Click **Yes**
7. The script will:
   - Start the backend server
   - Wait for it to initialize
   - Automatically open `http://localhost:8080` in your browser
8. Log in with `admin` / `admin`

> **📝 Note:** With this method, the unified app runs entirely on port **8080** (backend serves both
> the API and a bundled frontend). You do NOT need to run `npm install` or `npm run dev`.
> However, you won't get hot-reload — any frontend code changes need a rebuild.

---

## 🐳 Alternative: Docker Deployment

If you have **Docker Desktop** installed, you can run everything in containers with one command.

### 11.1 Install Docker Desktop (if you don't have it)

1. Go to: **https://www.docker.com/products/docker-desktop/**
2. Download and install Docker Desktop for Windows
3. Restart your computer after installation
4. Open Docker Desktop and wait for it to say **"Docker Desktop is running"**

### 11.2 Run with Docker Compose

1. Open a terminal in the project root folder:
   - Navigate to `Desktop` → `NetMonitor` → `network-traffic-monitoring-system`
   - Click the **address bar**, type `cmd`, press **Enter**
2. Run:
   ```
   docker-compose up --build -d
   ```
3. Wait for all images to build and containers to start (first run may take 5–10 minutes)
4. Open your browser and go to: **http://localhost:5173**
5. Log in with `admin` / `admin`

> **⚠️ Warning:** Docker on Windows runs inside a lightweight VM. Live packet capture in Docker will
> capture the VM's network traffic, **not** your physical Windows machine's traffic.
> For real packet capture on Windows, use the native setup (Steps 6–8) instead.

---

## 🔧 Troubleshooting

### ❌ `git` is not recognized as a command

- **Cause**: Git was not added to your system PATH during installation.
- **Fix**: Uninstall Git and reinstall it. During installation, make sure you select **"Git from the command line and also from 3rd-party software"**.

### ❌ `java` is not recognized as a command

- **Cause**: Java was not added to your system PATH.
- **Fix**:
  1. Press `Windows Key`, search **"Environment Variables"**, click **"Edit the system environment variables"**
  2. Click **"Environment Variables..."** button
  3. Under **"System variables"**, find `Path` → Click **Edit**
  4. Click **"New"** and add: `C:\Program Files\Eclipse Adoptium\jdk-21.x.x-hotspot\bin` (adjust to match your installation)
  5. Click **OK** on all dialogs
  6. **Close and reopen** Command Prompt, then try `java -version` again

### ❌ `npm` is not recognized as a command

- **Cause**: Node.js was not added to PATH.
- **Fix**: Uninstall Node.js and reinstall from https://nodejs.org/. The installer should set the PATH automatically.

### ❌ Backend starts but live capture doesn't work

- **Cause**: Npcap is not installed, or you're not running as Administrator.
- **Fix**:
  1. Install Npcap from https://npcap.com/ (see Step 4)
  2. Make sure to **right-click → Run as administrator** when starting the backend

### ❌ Frontend shows "Network Error" or blank page

- **Cause**: The backend is not running, or it's still starting up.
- **Fix**: Make sure the backend terminal shows `Started NetworkMonitorApplication in X.XX seconds` before opening the frontend.

### ❌ Port 8080 is already in use

- **Cause**: Another application is using port 8080.
- **Fix**: Close the other application, or find and kill the process:
  ```
  netstat -ano | findstr :8080
  taskkill /PID <PID_NUMBER> /F
  ```

### ❌ Port 5173 is already in use

- **Cause**: Another Vite/Node dev server is running.
- **Fix**: Close the other terminal running Vite, or kill the process:
  ```
  netstat -ano | findstr :5173
  taskkill /PID <PID_NUMBER> /F
  ```

### ❌ Maven download is stuck or fails

- **Cause**: Network/firewall issues blocking Maven Central repository.
- **Fix**:
  1. Check your internet connection
  2. If you're behind a corporate firewall/proxy, you may need to configure Maven's proxy settings
  3. Try again — sometimes Maven Central has temporary slowdowns

### ❌ `npm install` shows vulnerability warnings

- **Cause**: This is normal and usually not a problem for development.
- **Fix**: These are warnings, not errors. The app will still work fine. You can ignore them.

---

## 📌 Quick Reference — Commands Cheat Sheet

| Action | Command | Where to Run |
|:---|:---|:---|
| Clone the project | `git clone https://github.com/Vinaypatel24/network-traffic-monitoring-system.git` | Any terminal |
| Enter project folder | `cd network-traffic-monitoring-system` | Same terminal |
| Start backend (script) | Right-click `start-backend.bat` → **Run as administrator** | File Explorer |
| Start backend (manual) | `apache-maven-3.9.8\bin\mvn.cmd spring-boot:run -Dspring-boot.run.profiles=dev` | `network-monitor-backend` folder |
| Install frontend deps | `npm install` | `network-monitor-frontend` folder |
| Start frontend | `npm run dev` | `network-monitor-frontend` folder |
| One-click launch | Right-click `start.bat` → **Run as administrator** | Project root folder |
| Docker launch | `docker-compose up --build -d` | Project root folder |
| Stop backend | Press `Ctrl + C` in the backend terminal | Backend terminal |
| Stop frontend | Press `Ctrl + C` in the frontend terminal | Frontend terminal |

---

## 🎯 Summary — The Minimum Steps

If you want the absolute shortest path to running the app:

1. ✅ Install **Git** → https://git-scm.com/downloads/win
2. ✅ Install **Java 21** → https://adoptium.net/
3. ✅ Install **Npcap** → https://npcap.com/
4. ✅ Create a folder → Right-click Desktop → New → Folder → name it `NetMonitor`
5. ✅ Open terminal in folder → Click address bar → type `cmd` → Enter
6. ✅ Clone → `git clone https://github.com/Vinaypatel24/network-traffic-monitoring-system.git`
7. ✅ Enter folder → `cd network-traffic-monitoring-system`
8. ✅ Launch → Right-click `start.bat` → **Run as administrator**
9. ✅ Open browser → `http://localhost:8080` → Login: `admin` / `admin`

**That's it! You're monitoring network traffic! 🎉**
