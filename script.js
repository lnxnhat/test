const APPS_SCRIPT_API_URL = "https://script.google.com/macros/s/AKfycbyCiPXywgG2AkxC3mfBfRpqwU3Mc6mBgBHaVPSy75wWHNCqRHFLNkSB5mJ1Df2pnzqubg/exec";

const audio = document.getElementById('audio-player');
const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');
const seekSlider = document.getElementById('seek-slider');
const volumeSlider = document.getElementById('volume-slider');
const timeDisplay = document.getElementById('time-display');
const trackTitle = document.getElementById('track-title');
const playlistContainer = document.getElementById('playlist-container');

// Tải dữ liệu từ API
window.addEventListener('DOMContentLoaded', () => {
  trackTitle.innerText = "Đang tải dữ liệu từ Sheet...";

  fetch(APPS_SCRIPT_API_URL)
    .then(response => response.json())
    .then(data => buildPlaylistUI(data))
    .catch(error => {
      console.error("Lỗi:", error);
      trackTitle.innerText = "Lỗi kết nối API!";
    });
});

// Xây dựng danh sách phát
function buildPlaylistUI(songs) {
  playlistContainer.innerHTML = '';
  if (!songs || songs.length === 0) {
    trackTitle.innerText = "Chưa có nhạc trong Sheet.";
    return;
  }
  trackTitle.innerText = "Chọn bài hát để phát";
  
  songs.forEach((song) => {
    const row = document.createElement('div');
    row.className = 'playlist-item';
    row.innerText = song.name;
    row.addEventListener('click', () => startTrack(song.url, song.name));
    playlistContainer.appendChild(row);
  });
}

// Bắt đầu phát bài nhạc
function startTrack(url, name) {
  audio.src = url;
  trackTitle.innerText = name;
  audio.play();
}

// Điều khiển cơ bản
btnPlay.addEventListener('click', () => audio.play());
btnPause.addEventListener('click', () => audio.pause());
volumeSlider.addEventListener('input', (e) => audio.volume = e.target.value);

// Cập nhật thanh thời gian và tua
audio.addEventListener('timeupdate', () => {
  seekSlider.max = Math.floor(audio.duration) || 0;
  seekSlider.value = Math.floor(audio.currentTime);
  
  const currentMin = Math.floor(audio.currentTime / 60);
  const currentSec = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
  
  // Xử lý NaN khi âm thanh chưa load xong thời lượng
  const duration = audio.duration || 0;
  const durationMin = Math.floor(duration / 60);
  const durationSec = Math.floor(duration % 60).toString().padStart(2, '0');
  
  timeDisplay.innerText = `${currentMin}:${currentSec} / ${durationMin}:${durationSec}`;
});

seekSlider.addEventListener('input', (e) => {
  audio.currentTime = e.target.value;
});
