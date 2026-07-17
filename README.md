# 💬 ChatScroll

> **A sleek, privacy-focused web application that instantly transforms raw WhatsApp chat exports into a beautiful, fully functional visual interface.**

![ChatScroll Hero](./screenshot.png)

ChatScroll is a blazing-fast, 100% private WhatsApp chat visualizer. Upload your exported `.txt` or `.zip` chats to instantly render them in a pixel-perfect WhatsApp UI, complete with multi-language support, dark mode, and seamless PDF exporting. Because it processes everything locally in the browser, your personal chat data never touches a server.

---

## ✨ Features

- 🔒 **100% Private:** Everything runs locally in your browser. No data is ever sent to any server.
- 🎨 **True WhatsApp UI:** Pixel-accurate recreation of WhatsApp's interface, complete with correct bubble colors, timestamps, sender names, and dynamic flowing background effects.
- ⚡ **Blazing Fast:** Optimized batch rendering processes massive group chats instantly without freezing your browser.
- 📄 **High-Quality PDF Export:** Export any conversation as a crisp, sharp PDF document—perfect for record-keeping, sharing, or archiving.
- 🌐 **Global Multi-Language Support:** Instantly switch the interface between English, Hindi, Spanish, French, Arabic, Portuguese, and Simplified Chinese. Handles exports from any country (supports DD/MM/YYYY, MM/DD/YYYY, and various time formats).
- 🌙 **Dark/Light Mode:** Beautifully crafted themes that are easy on the eyes.
- 📦 **Any File Size:** No arbitrary size limits. Process chats with tens of thousands of messages effortlessly.

## 🚀 Getting Started

Since ChatScroll is entirely client-side, getting started is incredibly simple:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/chatscroll.git
   ```
2. **Open the app:**
   Simply double-click `index.html` to open it in your favorite web browser.
   *(Alternatively, serve it via any static file server like Live Server or Python's `http.server`)*

## 📱 How to Use

1. **Export from WhatsApp:**
   - Open any individual or group chat on WhatsApp.
   - Tap the menu / contact name → **More** → **Export Chat**.
   - Choose either **"Attach Media"** (exports a `.zip`) or **"Without Media"** (exports a `.txt`).
2. **Visualize:**
   - Drag and drop your exported file into ChatScroll.
   - Instantly see your chat rendered beautifully.
3. **Download:**
   - Click "Download PDF" to save a high-quality copy of your chat.

## 🛠️ Technology Stack

- **Core:** HTML5, Vanilla JavaScript, CSS3
- **PDF Generation:** [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/)
- **Zip Parsing:** [JSZip](https://stuk.github.io/jszip/)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check the [issues page](https://github.com/yourusername/chatscroll/issues) if you want to contribute.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
*Made with 💚 by Vivify Labs.*
