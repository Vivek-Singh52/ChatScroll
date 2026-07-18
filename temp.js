
// --- THEME TOGGLE ---
const themeToggleBtn = document.getElementById('themeToggleBtn');
function setTheme(isLight) {
  if (isLight) {
    document.documentElement.setAttribute('data-theme', 'light');
    if (themeToggleBtn) themeToggleBtn.textContent = '☀️';
    localStorage.setItem('chatscroll-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (themeToggleBtn) themeToggleBtn.textContent = '🌙';
    localStorage.setItem('chatscroll-theme', 'dark');
  }
}
function toggleTheme() {
  const isLight = document.documentElement.getAttribute('data-theme') !== 'light';
  setTheme(isLight);
}

// Init theme on load
const savedTheme = localStorage.getItem('chatscroll-theme');
if (savedTheme === 'light') {
  setTheme(true);
} else if (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
  setTheme(true);
}
// --------------------

// --- i18n / MULTI-LANGUAGE ---
let currentLang = localStorage.getItem('chatscroll-lang') || 'en';

function t(key) {
  if (typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang][key]) {
    return translations[currentLang][key];
  }
  return (typeof translations !== 'undefined' && translations['en'][key]) ? translations['en'][key] : key;
}

function changeLanguage(lang) {
  if (typeof translations === 'undefined' || !translations[lang]) return;
  currentLang = lang;
  localStorage.setItem('chatscroll-lang', lang);
  
  // Update DOM elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) {
      el.innerHTML = translations[lang][key];
    }
  });

  const sel = document.getElementById('lang-select');
  if (sel) sel.value = lang;
}
// Init on load
document.addEventListener('DOMContentLoaded', () => {
  if (typeof translations !== 'undefined') {
    changeLanguage(currentLang);
  }
  if (typeof DbTracker !== 'undefined') {
    DbTracker.init().then(() => {
      DbTracker.incrementStat('uses');
    });
  }
});

/* ═══════════════════════════ STATE ══════════════════════════════════ */
let parsedMessages = [];
let chatName       = 'WhatsApp Chat';
let myName         = null;
const senderColors = {};
const colorPalette = [0,1,2,3,4,5,6,7];
let colorIdx       = 0;
let mediaUrls      = {};

/* ═══════════════════════════ UTILITIES ═══════════════════════════════ */
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  const icons = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };
  document.getElementById('toast-icon').textContent = icons[type] || 'ℹ️';
  document.getElementById('toast-msg').textContent  = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 4000);
}

function updateProgress(pct) {
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('progress-pct').textContent  = pct + '%';
}

window.addEventListener('scroll', () => {
  document.getElementById('scroll-top-btn').classList.toggle('visible', window.scrollY > 400);
});

/* ═══════════════════════════ DRAG & DROP ═════════════════════════════ */
const dropZone = document.getElementById('drop-zone');

dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
});

// Programmatic click removed to fix mobile browser blocking issue

document.getElementById('file-input').addEventListener('change', e => {
  if (e.target.files[0]) processFile(e.target.files[0]);
});

/* ═══════════════════════════ FILE PROCESSING ═════════════════════════ */
function processFile(file) {
  if (!file.name.toLowerCase().endsWith('.txt') && !file.name.toLowerCase().endsWith('.zip') && file.type && !file.type.startsWith('text') && !file.type.includes('zip')) {
    showToast('Please upload a .txt or .zip file (WhatsApp export).', 'error');
    return;
  }

  const sizeMB = (file.size / 1048576).toFixed(2);
  document.getElementById('progress-filename').textContent = `${file.name} (${sizeMB} MB)`;
  document.getElementById('progress-wrap').classList.add('visible');
  updateProgress(5);

  // Reset state
  parsedMessages = [];
  Object.keys(senderColors).forEach(k => delete senderColors[k]);
  colorIdx = 0;
  // Cleanup old object URLs
  Object.values(mediaUrls).forEach(url => URL.revokeObjectURL(url));
  mediaUrls = {};

  if (file.name.toLowerCase().endsWith('.zip')) {
    processZipFile(file);
  } else {
    processTextFile(file);
  }
}

async function processZipFile(file) {
  try {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    
    updateProgress(40);
    
    let txtFile = null;
    let txtFilename = '';
    
    // Find text file and media files
    for (const [filename, zipEntry] of Object.entries(contents.files)) {
      if (zipEntry.dir) continue;
      
      const lowerName = filename.toLowerCase();
      if (lowerName.endsWith('.txt')) {
        txtFile = zipEntry;
        txtFilename = filename;
      } else {
        // Read media as blob
        const blob = await zipEntry.async("blob");
        let mimeType = 'application/octet-stream';
        if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (lowerName.endsWith('.png')) mimeType = 'image/png';
        else if (lowerName.endsWith('.webp')) mimeType = 'image/webp';
        else if (lowerName.endsWith('.mp4')) mimeType = 'video/mp4';
        else if (lowerName.endsWith('.opus') || lowerName.endsWith('.ogg')) mimeType = 'audio/ogg';
        else if (lowerName.endsWith('.mp3')) mimeType = 'audio/mpeg';
        else if (lowerName.endsWith('.m4a')) mimeType = 'audio/mp4';
        else if (lowerName.endsWith('.pdf')) mimeType = 'application/pdf';
        
        const typedBlob = new Blob([blob], { type: mimeType });
        mediaUrls[filename] = URL.createObjectURL(typedBlob);
      }
    }
    
    updateProgress(80);
    
    if (!txtFile) {
      throw new Error(t('toastNoTxt'));
    }
    
    const textContent = await txtFile.async("string");
    chatName = file.name.replace(/\.zip$/i, '')
      .replace(/^WhatsApp Chat with /i, '')
      .replace(/^WhatsApp Chat - /i, '')
      .trim() || 'WhatsApp Chat';
    
    finishProcessingText(textContent, file.name);
    
  } catch (err) {
    console.error(err);
    updateProgress(0);
    document.getElementById('progress-wrap').classList.remove('visible');
    showToast(t('toastZipError') + ' ' + err.message, 'error');
  }
}

function processTextFile(file) {
  const reader = new FileReader();
  reader.onprogress = e => {
    if (e.lengthComputable) {
      updateProgress(Math.round((e.loaded / e.total) * 80) + 10);
    }
  };
  reader.onload = e => {
    chatName = file.name.replace(/_chat\.txt$/i,'').replace(/\.txt$/i,'')
      .replace(/^WhatsApp Chat with /i, '')
      .replace(/^WhatsApp Chat - /i, '')
      .trim() || 'WhatsApp Chat';
    finishProcessingText(e.target.result, file.name);
  };
  reader.onerror = () => {
    showToast(t('toastFileError'), 'error');
    updateProgress(0);
  };
  reader.readAsText(file, 'UTF-8');
}

function finishProcessingText(text, filename) {
    updateProgress(92);
    try {
      parsedMessages = parseWhatsAppChat(text);
      if (parsedMessages.length === 0) {
        throw new Error(t('toastNoMsgs'));
      }
      // Infer "me"
      const senders = [...new Set(parsedMessages.filter(m => m.sender).map(m => m.sender))];
      if (senders.length === 2 && senders.includes(chatName)) {
        myName = senders.find(s => s !== chatName);
      } else {
        myName = senders[senders.length - 1] || null;
      }
      viewAsUser = myName || 'system';

      populateViewAsDropdown(senders);
      populateFilterSenders(senders);
      updateSidebarStats();
      
      if (typeof DbTracker !== 'undefined') {
        DbTracker.incrementStat('uploads');
      }
      
      updateProgress(100);
      setTimeout(() => applyFilters(), 300);
    } catch(err) {
      console.error(err);
      updateProgress(0);
      document.getElementById('progress-wrap').classList.remove('visible');
      showToast(t('toastParseError'), 'error');
    }
}

/* ═══════════════════════════ PARSER ══════════════════════════════════ */
function parseWhatsAppChat(text) {
  const messages = [];
  // Normalize CRLF
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Matches both bracketed and non-bracketed WhatsApp export formats:
  // [DD/MM/YYYY, HH:MM:SS] Sender: msg
  // DD/MM/YYYY, HH:MM - Sender: msg
  // Also handles unicode LTR/RTL marks
  const MSG_RE = /^[\u200e\u200f\u202a-\u202e]*[\[‎]?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})[,،]\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[aApP][mM])?)[\]،]?\s*[-–]\s*(.+?):\s([\s\S]*)$/;
  const SYS_RE = /^[\u200e\u200f\u202a-\u202e]*[\[‎]?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})[,،]\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[aApP][mM])?)[\]،]?\s*[-–]\s*([\s\S]+)$/;
  const BRACKET_MSG_RE = /^[\u200e\u200f]*\[(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[aApP][mM])?)\]\s*(.+?):\s([\s\S]*)$/;
  const BRACKET_SYS_RE = /^[\u200e\u200f]*\[(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[aApP][mM])?)\]\s*([\s\S]+)$/;

  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const raw  = lines[i];
    const line = raw.replace(/[\u200e\u200f\u202a-\u202e]/g, '').trim();
    if (!line) continue;

    let m = MSG_RE.exec(raw) || BRACKET_MSG_RE.exec(raw);
    if (m) {
      if (current) messages.push(current);
      current = { date: m[1].trim(), time: m[2].trim(), sender: m[3].trim(), text: m[4].trim(), isSystem: false };
      continue;
    }

    let s = SYS_RE.exec(raw) || BRACKET_SYS_RE.exec(raw);
    if (s && !s[3].includes(':')) {
      if (current) messages.push(current);
      current = { date: s[1].trim(), time: s[2].trim(), sender: null, text: s[3].trim(), isSystem: true };
      continue;
    }

    // Continuation of previous message
    if (current) {
      current.text += '\n' + line;
    }
  }

  if (current) messages.push(current);
  
  // Filter out blank messages (no text and no media)
  return messages.filter(m => m.isSystem || m.text.trim().length > 0);
}

/* ═══════════════════════════ RENDERER ════════════════════════════════ */
function getSenderColor(sender) {
  if (senderColors[sender] === undefined) {
    senderColors[sender] = colorPalette[colorIdx % colorPalette.length];
    colorIdx++;
  }
  return senderColors[sender];
}

function formatDateLabel(dateStr) {
  try {
    const parts = dateStr.split(/[\/\-\.]/);
    let d, m, y;
    if (parts[0].length === 4) {
      [y, m, d] = parts;
    } else {
      [d, m, y] = parts;
      if (parseInt(d) > 12 && parseInt(m) <= 12) { /* DD/MM confirmed */ }
      else { /* ambiguous — keep as-is */ }
    }
    if (String(y).length === 2) y = '20' + y;
    const date  = new Date(y, m - 1, d);
    const today = new Date(); today.setHours(0,0,0,0);
    const diff  = Math.round((today - date) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
  } catch { return dateStr; }
}

function generateMediaHTML(filename, originalMatch) {
  // Try to find exact filename or one that ends with it (sometimes paths are prefixed)
  let url = mediaUrls[filename];
  if (!url) {
    const keys = Object.keys(mediaUrls);
    const foundKey = keys.find(k => k.endsWith(filename));
    if (foundKey) url = mediaUrls[foundKey];
  }
  
  if (url) {
    const lowerName = filename.toLowerCase();
    const ext = filename.includes('.') ? filename.split('.').pop().toUpperCase() : 'FILE';
    if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png') || lowerName.endsWith('.webp')) {
      return `<img src="${url}" class="wa-media-img lightbox-trigger" data-type="image" data-filename="${filename}" data-src="${url}" alt="${filename}" onclick="openLightbox(this)" />`;
    } else if (lowerName.endsWith('.mp4')) {
      return `<div class="wa-media-video-wrap lightbox-trigger" data-type="video" data-filename="${filename}" data-src="${url}" onclick="openLightbox(this)">
                <video src="${url}#t=0.1" class="wa-media-video"></video>
                <div class="video-play-icon">▶</div>
              </div>`;
    } else if (lowerName.endsWith('.opus') || lowerName.endsWith('.ogg') || lowerName.endsWith('.mp3') || lowerName.endsWith('.m4a')) {
      return `<audio src="${url}" class="wa-media-audio" controls></audio>`;
    } else {
      const type = lowerName.endsWith('.pdf') ? 'pdf' : 'document';
      return `<div class="wa-document-card lightbox-trigger" data-type="${type}" data-filename="${filename}" data-src="${url}" onclick="openLightbox(this)">
                <div class="wa-document-icon">📄</div>
                <div class="wa-document-info">
                  <div class="wa-document-name">${filename}</div>
                  <div class="wa-document-type">${ext} Document</div>
                </div>
              </div>`;
    }
  }
  
  // Placeholder if unsupported type or not found
  return `<span class="media-placeholder">📎&nbsp;<em>${filename}</em></span>`;
}

function formatText(text) {
  // Escape HTML first
  text = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  // Bold *text*
  text = text.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>');
  // Italic _text_
  text = text.replace(/_([^_\n]+)_/g, '<em>$1</em>');
  // Strikethrough ~text~
  text = text.replace(/~([^~\n]+)~/g, '<s>$1</s>');
  // Code `text`
  text = text.replace(/`([^`\n]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:3px;font-size:13px;">$1</code>');
  // Line breaks
  text = text.replace(/\n/g, '<br>');
  
  // Handle Android style attachments: filename.ext (file attached)
  text = text.replace(/([a-zA-Z0-9_\-\.\s]+)\s*\(file attached\)/gi, (match, filename) => {
    return generateMediaHTML(filename.trim(), match);
  });
  
  // Handle iOS style attachments: <attached: filename.ext>
  text = text.replace(/&lt;attached:\s*(.+?)&gt;/gi, (match, filename) => {
    return generateMediaHTML(filename.trim(), match);
  });
  
  // Media omitted
  text = text.replace(/&lt;Media omitted&gt;/gi, '<span class="media-placeholder">🖼&nbsp;<em>Media omitted</em></span>');
  return text;
}

function renderChat() {
  const container = document.getElementById('wa-messages');
  container.innerHTML = '';

  const realMsgs   = filteredMessages.filter(m => !m.isSystem);
  const senders    = [...new Set(filteredMessages.filter(m => m.sender).map(m => m.sender))];
  const isGroupChat = senders.length > 2;

  document.getElementById('msg-count').textContent     = `${realMsgs.length} messages loaded`;
  document.getElementById('chat-title').textContent    = chatName;
  const waChatName = document.getElementById('wa-chat-name');
  if (waChatName) waChatName.textContent = chatName;
  const waChatSub = document.getElementById('wa-chat-sub');
  if (waChatSub) {
    waChatSub.textContent = isGroupChat
      ? senders.slice(0,3).join(', ') + (senders.length > 3 ? ` +${senders.length-3} more` : '')
      : 'tap here for contact info';
  }

  let lastDate = null;
  let idx      = 0;
  const BATCH  = 150;

  function renderBatch() {
    const frag = document.createDocumentFragment();
    const end  = Math.min(idx + BATCH, filteredMessages.length);

    for (let i = idx; i < end; i++) {
      const msg = filteredMessages[i];

      // Date divider
      if (msg.date !== lastDate) {
        const div = document.createElement('div');
        div.className = 'date-divider';
        div.innerHTML = `<span>${formatDateLabel(msg.date)}</span>`;
        frag.appendChild(div);
        lastDate = msg.date;
      }

      const isMe     = !!msg.sender && msg.sender === myName;
      const isSystem = msg.isSystem || !msg.sender;
      const wrap     = document.createElement('div');
      wrap.className = `wa-msg ${isSystem ? 'system' : isMe ? 'me' : 'them'}`;

      // Sender label for incoming messages (Always show on 'their' side, as requested)
      if (!isMe && !isSystem) {
        const sl = document.createElement('div');
        sl.className = `wa-sender color-${getSenderColor(msg.sender)}`;
        sl.textContent = msg.sender;
        wrap.appendChild(sl);
      }

      const bubble = document.createElement('div');
      bubble.className = 'wa-bubble';
      bubble.innerHTML = formatText(msg.text);

      if (!isSystem) {
        const meta = document.createElement('div');
        meta.className = 'wa-meta';
        meta.innerHTML = `<span class="wa-time">${msg.time}</span>${isMe ? '<span class="wa-ticks">✓✓</span>' : ''}`;
        bubble.appendChild(meta);
      }

      wrap.appendChild(bubble);
      frag.appendChild(wrap);
    }

    container.appendChild(frag);
    idx = end;

    if (idx < filteredMessages.length) {
      requestAnimationFrame(renderBatch);
    } else {
      // Done
      container.scrollTop = container.scrollHeight;
      document.getElementById('upload-section').style.display = 'none';
      document.getElementById('chat-section').classList.add('visible');
      document.getElementById('progress-wrap').classList.remove('visible');
      generateInsights();
      if(realMsgs.length > 0) {
        showToast(`Loaded ${realMsgs.length} messages!`, 'success');
      }
    }
  }

  renderBatch();
}

/* ═══════════════════════════ DASHBOARD & FILTERS ═══════════════════════════════ */
let viewAsUser = 'system';
let filterSearchQuery = '';
let filterSenders = [];
let filteredMessages = [];

function populateViewAsDropdown(senders) {
  const select = document.getElementById('view-as-select');
  select.innerHTML = '<option value="system">System (Neutral)</option>';
  senders.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    if (s === viewAsUser) opt.selected = true;
    select.appendChild(opt);
  });
}

function changeViewAs(val) {
  viewAsUser = val;
  myName = val === 'system' ? null : val;
  renderChat();
}

function populateFilterSenders(senders) {
  const list = document.getElementById('filter-senders-list');
  list.innerHTML = '';
  senders.forEach(s => {
    const div = document.createElement('div');
    div.style.marginBottom = '8px';
    div.innerHTML = `<label style="display:flex; align-items:center; gap:8px; cursor:pointer;"><input type="checkbox" value="${s}" class="sender-filter-cb" /> ${s}</label>`;
    list.appendChild(div);
  });
}

function updateSidebarStats() {
  document.getElementById('sb-msg-count').textContent = parsedMessages.length;
  const senders = new Set(parsedMessages.map(m=>m.sender).filter(Boolean));
  document.getElementById('sb-people-count').textContent = senders.size;
  
  const mediaCount = parsedMessages.filter(m => m.text.includes('<Media omitted>') || m.text.includes('attached') || m.text.includes('image omitted')).length;
  document.getElementById('sb-media-count').textContent = mediaCount;

  if (parsedMessages.length > 0) {
    const firstDate = parsedMessages[0].date;
    const lastDate = parsedMessages[parsedMessages.length-1].date;
    document.getElementById('sb-date-range').textContent = `${firstDate} - ${lastDate}`;
    
    const uniqueDates = new Set(parsedMessages.map(m=>m.date));
    document.getElementById('sb-days-count').textContent = uniqueDates.size;
  }

  // Calculate top participants
  const counts = {};
  parsedMessages.forEach(m => {
    if (m.sender) counts[m.sender] = (counts[m.sender] || 0) + 1;
  });
  const sorted = Object.keys(counts).sort((a,b) => counts[b] - counts[a]);
  if (sorted.length > 0) document.getElementById('sb-most-active').textContent = sorted[0];

  const topHtml = sorted.slice(0, 5).map(s => {
    const pct = Math.round((counts[s] / parsedMessages.length) * 100);
    return `
      <div class="participant-row">
        <div class="participant-header"><span>${s}</span><strong>${counts[s]}</strong></div>
        <div class="participant-bar-bg"><div class="participant-bar-fill" style="width:${pct}%"></div></div>
      </div>
    `;
  }).join('');
  document.getElementById('sb-top-participants').innerHTML = topHtml;
}

let searchTimeout;
function handleSearch(val) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    filterSearchQuery = val.toLowerCase();
    applyFilters();
  }, 300);
}

function openFilterModal() { 
  const m = document.getElementById('filter-modal');
  m.style.display = 'flex'; 
  setTimeout(() => m.style.opacity = '1', 10);
}
function closeFilterModal() { 
  const m = document.getElementById('filter-modal');
  m.style.opacity = '0'; 
  setTimeout(() => m.style.display = 'none', 300);
}

function applyFilters() {
  const dStart = document.getElementById('filter-date-start').value; // YYYY-MM-DD
  const dEnd = document.getElementById('filter-date-end').value;
  const sBoxes = document.querySelectorAll('.sender-filter-cb:checked');
  filterSenders = Array.from(sBoxes).map(cb => cb.value);

  const startMs = dStart ? new Date(dStart).getTime() : 0;
  const endMs = dEnd ? new Date(dEnd).getTime() + 86400000 : Infinity; // add 1 day to include end date

  filteredMessages = parsedMessages.filter(m => {
    if (filterSearchQuery && !m.text.toLowerCase().includes(filterSearchQuery) && !(m.sender && m.sender.toLowerCase().includes(filterSearchQuery))) return false;
    if (filterSenders.length > 0 && m.sender && !filterSenders.includes(m.sender)) return false;
    
    // Very basic date parsing since WA format varies heavily. 
    // This assumes the browser can parse m.date correctly (usually mm/dd/yyyy or yyyy/mm/dd).
    // If it fails (NaN), we just ignore the date filter for that message to be safe.
    if (dStart || dEnd) {
      const msgDate = new Date(m.date).getTime();
      if (!isNaN(msgDate)) {
        if (msgDate < startMs || msgDate > endMs) return false;
      }
    }
    return true;
  });

  renderChat();
  closeFilterModal();
}

/* ═══════════════════════════ PDF EXPORT ═════════════════════════════ */
async function downloadPDF() {
  const overlay = document.getElementById('pdf-overlay');
  overlay.classList.add('visible');
  await new Promise(r => setTimeout(r, 200));

  const frame = document.getElementById('wa-frame');
  const messagesArea = document.getElementById('wa-messages');

  // Save original state
  const originalBodyOverflow = document.body.style.overflow;
  const originalHtmlOverflow = document.documentElement.style.overflow;
  const originalBodyHeight = document.body.style.height;
  const originalFrameCssText = frame.style.cssText;
  const originalMessagesCssText = messagesArea.style.cssText;
  const originalScrollY = window.scrollY;
  
  try {
    // 1. Expand the LIVE DOM to its full height
    document.body.style.overflow = 'visible';
    document.documentElement.style.overflow = 'visible';
    document.body.style.height = 'auto';

    frame.style.cssText += `
      max-height: none !important;
      height: auto !important;
      overflow: visible !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      width: 720px !important;
      max-width: 720px !important;
      margin: 0 auto !important;
    `;
    
    messagesArea.style.cssText += `
      max-height: none !important;
      height: auto !important;
      overflow: visible !important;
    `;

    // 2. Add title bar
    const titleBar = document.createElement('div');
    titleBar.id = 'temp-pdf-title-bar';
    titleBar.style.cssText = `
      background: linear-gradient(135deg, #005c4b 0%, #007a61 100%);
      padding: 24px 32px;
      display: flex;
      align-items: center;
      gap: 16px;
    `;
    const realMsgs = parsedMessages.filter(m => !m.isSystem);
    const dateNow  = new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'});
    titleBar.innerHTML = `
      <div style="width:52px;height:52px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
        <img src="logo.png" style="width:170%;height:170%;object-fit:contain;" alt="Logo" />
      </div>
      <div>
        <div style="font-size:26px;font-weight:700;color:#fff;line-height:1.2;">ChatScroll Export</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.72);margin-top:6px;">
          ${chatName} &nbsp;·&nbsp; ${realMsgs.length} messages &nbsp;·&nbsp; Generated ${dateNow}
        </div>
      </div>
    `;
    frame.insertBefore(titleBar, frame.firstChild);

    // Create a temporary 1440px wrapper to shift the chat to the right half of the page
    const pdfWrapper = document.createElement('div');
    pdfWrapper.id = 'temp-pdf-wrapper';
    pdfWrapper.style.cssText = `
      width: 1440px !important;
      background: #ffffff !important;
      display: flex !important;
      justify-content: flex-end !important;
      padding-right: 560px !important;
    `;
    
    // Put frame inside the wrapper
    const originalParent = frame.parentNode;
    const nextSibling = frame.nextSibling;
    pdfWrapper.appendChild(frame);
    document.body.appendChild(pdfWrapper);

    // Scroll to top to prevent html2canvas culling bugs
    window.scrollTo(0, 0);

    // Wait for browser to repaint the expanded layout
    await new Promise(r => setTimeout(r, 800));

    // Calculate total height to dynamically adjust scale to prevent browser canvas limits (blank pages)
    const totalHeight = pdfWrapper.offsetHeight || frame.scrollHeight || 1000;
    let canvasScale = 2.0;
    if (totalHeight > 8000) canvasScale = 1.5;
    if (totalHeight > 20000) canvasScale = 1.0;
    if (totalHeight > 40000) canvasScale = 0.8;

    // 3. Configure html2pdf for high quality and no margins
    const opt = {
      margin:      0, 
      filename:    `${chatName}.pdf`,
      image:       { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: canvasScale, 
        useCORS: true, 
        backgroundColor: '#ffffff', 
        logging: false, 
        allowTaint: true,
        windowWidth: 1440
      },
      jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:   { mode: ['avoid-all', 'css', 'legacy'] },
    };

    // 4. Generate PDF directly from the live wrapper
    const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform();
    if (isCapacitor) {
      const pdfDataUri = await html2pdf().set(opt).from(pdfWrapper).output('datauristring');
      const base64Data = pdfDataUri.split(',')[1];
      const fileName = `${chatName.replace(/[^a-zA-Z0-9]/g, '_') || 'chatscroll_export'}.pdf`;
      
      const writeResult = await window.Capacitor.Plugins.Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: 'CACHE'
      });
      
      await window.Capacitor.Plugins.Share.share({
        title: 'Export PDF',
        text: 'Here is your exported PDF from ChatScroll',
        url: writeResult.uri,
        dialogTitle: 'Share PDF'
      });
      showToast('PDF shared successfully! 📤', 'success');
    } else {
      await html2pdf().set(opt).from(pdfWrapper).save();
      showToast('PDF downloaded successfully! 🎉', 'success');
    }
    
    if (typeof DbTracker !== 'undefined') {
      DbTracker.incrementStat('downloads');
    }

  } catch(err) {
    console.error('PDF error:', err);
    showToast('PDF failed: ' + (err.message || 'Unknown error'), 'error');
  } finally {
    // Restore frame to original position
    const pdfWrapper = document.getElementById('temp-pdf-wrapper');
    if (pdfWrapper) {
      const chatSection = document.getElementById('chat-section');
      const dashboardMain = chatSection.querySelector('.dashboard-main');
      if (dashboardMain) {
        dashboardMain.appendChild(frame);
      }
      pdfWrapper.remove();
    }

    // 5. Restore everything
    document.body.style.overflow = originalBodyOverflow;
    document.documentElement.style.overflow = originalHtmlOverflow;
    document.body.style.height = originalBodyHeight;
    frame.style.cssText = originalFrameCssText;
    messagesArea.style.cssText = originalMessagesCssText;
    
    const tempTitle = document.getElementById('temp-pdf-title-bar');
    if (tempTitle) tempTitle.remove();

    window.scrollTo(0, originalScrollY);
    overlay.classList.remove('visible');
  }
}

/* ═══════════════════════════ RESET ══════════════════════════════════ */
function resetApp() {
  parsedMessages = [];
  filteredMessages = [];
  chatName       = 'WhatsApp Chat';
  myName         = null;
  viewAsUser     = 'system';
  filterSearchQuery = '';
  filterSenders  = [];
  colorIdx       = 0;
  Object.keys(senderColors).forEach(k => delete senderColors[k]);
  
  // Revoke object URLs to free memory
  Object.values(mediaUrls).forEach(url => URL.revokeObjectURL(url));
  mediaUrls = {};

  // Destroy charts
  if (window.activityChartInstance) {
    window.activityChartInstance.destroy();
    window.activityChartInstance = null;
  }
  if (window.distChartInstance) {
    window.distChartInstance.destroy();
    window.distChartInstance = null;
  }

  // Clear inputs
  document.getElementById('search-input').value = '';
  document.getElementById('filter-date-start').value = '';
  document.getElementById('filter-date-end').value = '';

  document.getElementById('wa-messages').innerHTML = '';
  document.getElementById('chat-section').classList.remove('visible');
  document.getElementById('chat-insights').classList.remove('visible');
  document.getElementById('upload-section').style.display = 'block';
  document.getElementById('file-input').value = '';
  updateProgress(0);
  document.getElementById('progress-wrap').classList.remove('visible');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ═══════════════════════════ LIGHTBOX ═══════════════════════════════ */
let lightboxItems = [];
let currentLightboxIndex = 0;

function openLightbox(element) {
  const items = Array.from(document.querySelectorAll('.lightbox-trigger'));
  lightboxItems = items.map(el => ({
    src: el.getAttribute('data-src'),
    type: el.getAttribute('data-type'),
    filename: el.getAttribute('data-filename')
  }));
  
  currentLightboxIndex = items.indexOf(element);
  if (currentLightboxIndex === -1) currentLightboxIndex = 0;
  
  renderLightboxContent();
  document.getElementById('lightbox').classList.add('visible');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('visible');
  const video = document.querySelector('#lightbox-content-container video');
  if (video) video.pause();
}

function navigateLightbox(dir) {
  currentLightboxIndex += dir;
  if (currentLightboxIndex < 0) currentLightboxIndex = lightboxItems.length - 1;
  if (currentLightboxIndex >= lightboxItems.length) currentLightboxIndex = 0;
  renderLightboxContent();
}

function renderLightboxContent() {
  const container = document.getElementById('lightbox-content-container');
  const info = document.getElementById('lightbox-info');
  const item = lightboxItems[currentLightboxIndex];
  
  if (!item) return;
  
  info.textContent = `${item.filename} (${currentLightboxIndex + 1} of ${lightboxItems.length})`;
  
  if (item.type === 'image') {
    container.innerHTML = `<img src="${item.src}" class="lightbox-media" />`;
  } else if (item.type === 'video') {
    container.innerHTML = `<video src="${item.src}" class="lightbox-media" controls autoplay></video>`;
  } else if (item.type === 'pdf') {
    container.innerHTML = `<iframe src="${item.src}" class="lightbox-media" style="width: 85vw; height: 85vh; background: #fff; border: none; border-radius: 8px;"></iframe>`;
  } else {
    container.innerHTML = `
      <div style="text-align:center; color:#fff;">
        <div style="font-size: 64px; margin-bottom: 20px;">📄</div>
        <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">${item.filename}</div>
        <div style="color: #8696a0; margin-bottom: 30px;">Preview not available for this file type</div>
        <a href="${item.src}" download="${item.filename}" style="display:inline-block; padding: 12px 24px; background: var(--accent-green); color: #000; text-decoration: none; border-radius: 24px; font-weight: 500;">Download File</a>
      </div>
    `;
  }
}

document.addEventListener('keydown', e => {
  if (document.getElementById('lightbox').classList.contains('visible')) {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') navigateLightbox(1);
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
  }
});

// Cursor Glow Effect
const glowCursor = document.getElementById('bg-glow-cursor');
document.addEventListener('mousemove', (e) => {
  if (!glowCursor) return;
  // Use requestAnimationFrame for smooth performance
  requestAnimationFrame(() => {
    glowCursor.style.opacity = '1';
    glowCursor.style.left = e.clientX + 'px';
    glowCursor.style.top = e.clientY + 'px';
  });
});
document.addEventListener('mouseleave', () => {
  if (glowCursor) glowCursor.style.opacity = '0';
});
/* ═══════════════════════════ INSIGHTS ═══════════════════════════════ */
function generateInsights() {
  const realMsgs = parsedMessages.filter(m => !m.isSystem && m.sender && m.text);
  if (realMsgs.length === 0) return;

  document.getElementById('chat-insights').classList.add('visible');

  const hourlyCounts = new Array(24).fill(0);
  const senderCounts = {};

  const emojiRegex = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu;

  realMsgs.forEach(m => {
    let hour = 0;
    const tMatch = m.time.match(/(\d+):(\d+)(?:\s?(am|pm))?/i);
    if (tMatch) {
      hour = parseInt(tMatch[1], 10);
      const ampm = tMatch[3] ? tMatch[3].toLowerCase() : null;
      if (ampm === 'pm' && hour < 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;
    }
    hourlyCounts[hour]++;

    if (!senderCounts[m.sender]) {
      senderCounts[m.sender] = { count: 0, words: 0, longest: 0, uniqueWords: new Set(), emojis: {} };
    }
    const stat = senderCounts[m.sender];
    stat.count++;

    const text = m.text.toLowerCase();
    const words = text.match(/\b[\w']+\b/g) || [];
    stat.words += words.length;
    if (words.length > stat.longest) stat.longest = words.length;
    words.forEach(w => stat.uniqueWords.add(w));

    const emojis = m.text.match(emojiRegex) || [];
    emojis.forEach(e => {
      stat.emojis[e] = (stat.emojis[e] || 0) + 1;
    });
  });

  const chartColors = ['#25D366', '#128C7E', '#075E54', '#34B7F1', '#ECE5DD', '#DCF8C6'];
  const textColor = '#8b9bb4';

  if (window.activityChartInstance) window.activityChartInstance.destroy();
  if (window.distChartInstance) window.distChartInstance.destroy();

  const ctxActivity = document.getElementById('activityChart').getContext('2d');
  window.activityChartInstance = new Chart(ctxActivity, {
    type: 'bar',
    data: {
      labels: ['12 AM','1 AM','2 AM','3 AM','4 AM','5 AM','6 AM','7 AM','8 AM','9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM','6 PM','7 PM','8 PM','9 PM','10 PM','11 PM'],
      datasets: [{
        label: t('msgsUnit') || 'Messages',
        data: hourlyCounts,
        backgroundColor: 'rgba(37, 211, 102, 0.6)',
        borderColor: '#25D366',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(139,155,180,0.1)' }, ticks: { color: textColor } },
        x: { grid: { display: false }, ticks: { color: textColor, maxRotation: 45, minRotation: 45 } }
      }
    }
  });

  const senders = Object.keys(senderCounts).sort((a,b) => senderCounts[b].count - senderCounts[a].count);
  const topSenders = senders.slice(0, 10);
  
  const ctxDist = document.getElementById('distributionChart').getContext('2d');
  window.distChartInstance = new Chart(ctxDist, {
    type: 'doughnut',
    data: {
      labels: topSenders,
      datasets: [{
        data: topSenders.map(s => senderCounts[s].count),
        backgroundColor: chartColors.slice(0, topSenders.length),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor } }
      }
    }
  });

  const usersContainer = document.getElementById('insights-users-container');
  usersContainer.innerHTML = '';
  
  topSenders.slice(0, 2).forEach((s, idx) => {
    const stat = senderCounts[s];
    const topEmojis = Object.keys(stat.emojis).sort((a,b) => stat.emojis[b] - stat.emojis[a]).slice(0, 3).join(' ');
    const avgWords = stat.count > 0 ? (stat.words / stat.count).toFixed(1) : 0;

    const card = document.createElement('div');
    card.className = 'user-card';
    card.innerHTML = `
      <h3 style="color: ${chartColors[idx]}">${s}</h3>
      <div class="user-stat"><span class="icon">📘</span> <span><span data-i18n="totalWords">${t('totalWords')}</span> <strong>${stat.words}</strong></span></div>
      <div class="user-stat"><span class="icon">😀</span> <span><span data-i18n="mostEmojis">${t('mostEmojis')}</span> <strong>${topEmojis || 'None'}</strong></span></div>
      <div class="user-stat"><span class="icon">📏</span> <span><span data-i18n="longestMsg">${t('longestMsg')}</span> <strong>${stat.longest} <span data-i18n="wordsUnit">${t('wordsUnit')}</span></strong></span></div>
      <div class="user-stat"><span class="icon">⭐</span> <span><span data-i18n="wordstock">${t('wordstock')}</span> <strong>${stat.uniqueWords.size}</strong></span></div>
      <div class="user-stat"><span class="icon">📊</span> <span><span data-i18n="avgWords">${t('avgWords')}</span> <strong>${avgWords}</strong></span></div>
    `;
    usersContainer.appendChild(card);
  });
}
