// ============================================================
//  script.js — JavaScript xử lý logic trang web
//  ⚠️  Thay YOUR_WEB_APP_URL bằng URL bạn deploy từ Apps Script
// ============================================================

const API_URL = 'https://script.google.com/macros/s/AKfycbxm45tbFXWT6aJexIpEDURd5OSx53X3WaIssfY7IvJSVmRBf0Im7suaMDSdSvyIrIegyw/exec'; // <-- đổi sau khi deploy

// ---------- Trạng thái vẽ ----------
let canvas, ctx;
let isDrawing   = false;
let lastX = 0,  lastY = 0;
let drawHistory = [];
let historyIdx  = -1;
let currentTool = 'pen'; // 'pen' | 'eraser'

// ============================================================
//  KHỞI TẠO TRANG
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('drawing-canvas');
  ctx    = canvas.getContext('2d');

  // Canvas nội bộ Full HD
  canvas.width  = 1920;
  canvas.height = 1080;

  whiteBackground();
  saveHistory();
  bindCanvasEvents();
  bindToolEvents();
  updateBrushPreview();
});

// ============================================================
//  TẠO MỚI — sinh ID & hiện form
// ============================================================
function taoMoi() {
  const id = 'ID-' + Date.now() + '-' + Math.random().toString(36).slice(2,7).toUpperCase();
  document.getElementById('display-id').textContent = id;

  // Reset canvas
  drawHistory = [];
  historyIdx  = -1;
  whiteBackground();
  saveHistory();
  document.getElementById('ky-tu').value = '';
  document.getElementById('status-msg').innerHTML = '';

  switchPage('form-page');
}

function quayLai() {
  switchPage('main-page');
}

function switchPage(to) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(to).classList.add('active');
}

// ============================================================
//  HOÀN TẤT — gửi dữ liệu lên Apps Script
// ============================================================
async function hoanTat() {
  const kyTu = document.getElementById('ky-tu').value.trim();
  if (!kyTu) { showStatus('⚠️ Vui lòng nhập ký tự!', 'warn'); return; }

  const id      = document.getElementById('display-id').textContent;
  const hinhVe  = canvas.toDataURL('image/png'); // Full HD PNG base64

  const btn = document.getElementById('btn-hoan-tat');
  btn.disabled    = true;
  btn.textContent = '⏳ Đang gửi…';

  try {
    const res  = await fetch(API_URL, {
      method : 'POST',
      body   : JSON.stringify({ id, kyTu, hinhVe }),
    });
    const data = await res.json();

    if (data.success) {
      showStatus('✅ ' + data.message, 'success');
      setTimeout(() => quayLai(), 2200);
    } else {
      showStatus('❌ ' + data.message, 'error');
    }
  } catch (err) {
    showStatus('❌ Không kết nối được server: ' + err.message, 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = '✅ Hoàn tất';
  }
}

function showStatus(msg, type) {
  const el = document.getElementById('status-msg');
  el.textContent  = msg;
  el.className    = 'status-msg ' + type;
}

// ============================================================
//  CANVAS — vẽ
// ============================================================
function bindCanvasEvents() {
  // Mouse
  canvas.addEventListener('mousedown',  startDraw);
  canvas.addEventListener('mousemove',  draw);
  canvas.addEventListener('mouseup',    stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);

  // Touch (hỗ trợ điện thoại nếu cần)
  canvas.addEventListener('touchstart', e => { e.preventDefault(); startDraw(e); }, { passive: false });
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); draw(e);      }, { passive: false });
  canvas.addEventListener('touchend',   stopDraw);
}

function getPos(e) {
  const rect   = canvas.getBoundingClientRect();
  const scaleX = 1920 / rect.width;
  const scaleY = 1080 / rect.height;
  const src    = e.touches ? e.touches[0] : e;
  return {
    x: (src.clientX - rect.left) * scaleX,
    y: (src.clientY - rect.top)  * scaleY,
  };
}

function startDraw(e) {
  isDrawing = true;
  const p   = getPos(e);
  lastX = p.x; lastY = p.y;

  // Chấm tròn tại điểm bấm
  ctx.beginPath();
  ctx.arc(lastX, lastY, currentBrushSize() / 2, 0, Math.PI * 2);
  ctx.fillStyle = currentColor();
  ctx.fill();
}

function draw(e) {
  if (!isDrawing) return;
  const p = getPos(e);

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(p.x, p.y);
  ctx.strokeStyle = currentColor();
  ctx.lineWidth   = currentBrushSize();
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.stroke();

  lastX = p.x; lastY = p.y;
}

function stopDraw() {
  if (!isDrawing) return;
  isDrawing = false;
  saveHistory();
}

function currentColor() {
  if (currentTool === 'eraser') return '#FFFFFF';
  return document.getElementById('color-picker').value;
}

function currentBrushSize() {
  const v = parseInt(document.getElementById('brush-size').value);
  return currentTool === 'eraser' ? v * 3 : v;
}

// ============================================================
//  CANVAS — tools
// ============================================================
function bindToolEvents() {
  document.getElementById('brush-size').addEventListener('input', updateBrushPreview);
  document.getElementById('color-picker').addEventListener('input', () => {
    if (currentTool === 'eraser') setTool('pen');
  });
}

function setTool(tool) {
  currentTool = tool;
  document.getElementById('btn-pen').classList.toggle('active', tool === 'pen');
  document.getElementById('btn-eraser').classList.toggle('active', tool === 'eraser');
  updateBrushPreview();
}

function clearCanvas() {
  if (!confirm('Xóa toàn bộ hình vẽ?')) return;
  whiteBackground();
  saveHistory();
}

function undoCanvas() {
  if (historyIdx <= 0) return;
  historyIdx--;
  restoreHistory();
}

function redoCanvas() {
  if (historyIdx >= drawHistory.length - 1) return;
  historyIdx++;
  restoreHistory();
}

function whiteBackground() {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 1920, 1080);
}

function saveHistory() {
  drawHistory = drawHistory.slice(0, historyIdx + 1);
  drawHistory.push(canvas.toDataURL());
  if (drawHistory.length > 30) { drawHistory.shift(); } else { historyIdx++; }
}

function restoreHistory() {
  const img   = new Image();
  img.src     = drawHistory[historyIdx];
  img.onload  = () => ctx.drawImage(img, 0, 0);
}

function updateBrushPreview() {
  const size    = parseInt(document.getElementById('brush-size').value);
  const preview = document.getElementById('brush-dot');
  const display = Math.max(4, Math.min(size * 0.8, 40));
  preview.style.width  = display + 'px';
  preview.style.height = display + 'px';
  preview.style.background = currentTool === 'eraser'
    ? '#ccc' : document.getElementById('color-picker').value;
}
