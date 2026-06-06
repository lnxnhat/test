const audio = document.getElementById('audio-player');
const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');
const seekSlider = document.getElementById('seek-slider');
const volumeSlider = document.getElementById('volume-slider');
const timeDisplay = document.getElementById('time-display');
const trackTitle = document.getElementById('track-title');
const playlistContainer = document.getElementById('playlist-container');

let audioCtx;
let trackNode;
let filters = [];
let isAudioContextInit = false;

function initAudioContext() {
  if (isAudioContextInit) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  trackNode = audioCtx.createMediaElementSource(audio);
  
  const frequencies = [60, 230, 910, 4000, 14000];
  let currentOutputNode = trackNode;
  
  frequencies.forEach((freq, index) => {
    const filter = audioCtx.createBiquadFilter();
    if (index === 0) filter.type = 'lowshelf';
    else if (index === frequencies.length - 1) filter.type = 'highshelf';
    else filter.type = 'peaking';
    
    filter.frequency.value = freq;
    filter.Q.value = 1.0;
    filter.gain.value = 0;
    
    currentOutputNode.connect(filter);
    currentOutputNode = filter;
    filters.push(filter);
  });
  
  currentOutputNode.connect(audioCtx.destination);
  isAudioContextInit = true;
}

const eqControls = ['eq-60', 'eq-230', 'eq-910', 'eq-4k', 'eq-14k'];
eqControls.forEach((id, index) => {
  document.getElementById(id).addEventListener('input', function(e) {
    initAudioContext();
    if (filters[index]) filters[index].gain.value = parseFloat(e.target.value);
  });
});

window.addEventListener('DOMContentLoaded', () => {
  google.script.run.withSuccessHandler(buildPlaylistUI).getMusicList();
});

function buildPlaylistUI(songs) {
  playlistContainer.innerHTML = '';
  if (!songs || songs.length === 0) {
    trackTitle.innerText = "Chưa có nhạc trong Sheet. Hãy chạy hàm updateMusicList!";
    return;
  }
  trackTitle.innerText = "Chọn bài hát để phát";
  
  songs.forEach((song) => {
    const row = document.createElement('div');
    row.className = 'playlist-item';
    row.innerText = song.name;
    row.addEventListener('click', () => {
      startTrack(song.url, song.name);
    });
    playlistContainer.appendChild(row);
  });
}

function startTrack(url, name) {
  initAudioContext();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  audio.src = url;
  trackTitle.innerText = name;
  audio.play();
}

btnPlay.addEventListener('click', () => {
  initAudioContext();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  audio.play();
});

btnPause.addEventListener('click', () => {
  audio.pause();
});

volumeSlider.addEventListener('input', (e) => {
  audio.volume = e.target.value;
});

audio.addEventListener('timeupdate', () => {
  seekSlider.max = Math.floor(audio.duration) || 0;
  seekSlider.value = Math.floor(audio.currentTime);
  
  const currentMin = Math.floor(audio.currentTime / 60);
  const currentSec = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
  const durationMin = Math.floor((audio.duration || 0) / 60);
  const durationSec = Math.floor((audio.duration || 0) % 60).toString().padStart(2, '0');
  
  timeDisplay.innerText = `${currentMin}:${currentSec} / ${durationMin}:${durationSec}`;
});

seekSlider.addEventListener('input', (e) => {
  audio.currentTime = e.target.value;
});
