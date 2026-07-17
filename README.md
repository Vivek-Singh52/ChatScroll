# ChatScroll 💬

> **Turn your exported WhatsApp chats into a beautiful, readable visual interface — and download them as high-quality PDF.**

![ChatScroll Banner](https://img.shields.io/badge/ChatScroll-WhatsApp%20Chat%20Visualizer-25d366?style=for-the-badge&logo=whatsapp&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-7c3aed?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel)

---

## ✨ Features

- 📂 **Upload any `.zip` or `.txt` WhatsApp export** — drag & drop or click to browse
- 📱 **True WhatsApp UI** — pixel-accurate chat bubbles, timestamps, sender colors
- 🌐 **All locales supported** — DD/MM/YYYY, MM/DD/YYYY, ISO, 12h/24h formats
- 📄 **High-quality PDF export** — crisp, print-ready PDF of your full conversation
- 🔒 **100% private** — everything runs in your browser, zero data sent to servers
- ⚡ **Any file size** — optimized batch renderer handles massive group chats
- 🎨 **Stunning UI** — animated dark glassmorphism design with dynamic background

---

## 🚀 Live Demo

> Coming soon after deployment on Vercel

---

## 🛠️ How to Use

1. Export your WhatsApp chat (Android: **⋮ → More → Export Chat** | iPhone: **Contact Name → Export Chat**)
2. Choose **"With Media"** (recommended for `.zip`) or **"Without Media"** (`.txt`)
3. Transfer the `.zip` or `.txt` file to your computer
4. Go to ChatScroll, drop your file, and instantly see your chat beautifully rendered
5. Hit **Download PDF** to save it

---

## 📦 Running Locally

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/chatscroll.git
cd chatscroll

# Install serve (optional, for local dev server)
npm install

# Run locally
npm run dev
# Opens on http://localhost:3000
```

Or simply open `index.html` directly in your browser — no build step needed!

---

## 🌍 Deploy to Vercel

This project is a pure static site — deploying takes under 2 minutes:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow the prompts — your site will be live at a .vercel.app URL
```

Or connect your GitHub repo to Vercel dashboard for automatic deployments on every push.

---

## 📁 Project Structure

```
chatscroll/
├── index.html      # The entire app (single file, no build needed)
├── vercel.json     # Vercel deployment config
├── package.json    # Project metadata & dev scripts
├── .gitignore      # Git ignore file
└── README.md       # This file
```

---

## 🔧 Tech Stack

| Technology | Usage |
|---|---|
| **HTML5** | Structure & layout |
| **Vanilla CSS** | Styling, animations, glassmorphism |
| **Vanilla JavaScript** | Parser, renderer, PDF logic |
| **html2pdf.js** | High-quality PDF generation |
| **Google Fonts** | Inter + Outfit typography |
| **Vercel** | Static hosting & CDN |

---

## 📄 Supported WhatsApp Export Formats

ChatScroll handles all known WhatsApp export timestamp formats:

| Format | Example |
|---|---|
| `DD/MM/YYYY, HH:MM` | `17/07/2026, 14:30 - Alice: Hello!` |
| `MM/DD/YYYY, HH:MM AM/PM` | `07/17/2026, 2:30 PM - Bob: Hey!` |
| `[DD/MM/YYYY, HH:MM:SS]` | `[17/07/2026, 14:30:45] Alice: Hi` |
| ISO `YYYY-MM-DD` | `2026-07-17, 14:30 - Alice: Hi` |

---

## 📜 License

MIT License — free to use, modify and distribute.

---

<p align="center">Made with 💚 by ChatScroll &nbsp;·&nbsp; Your data never leaves your browser</p>
