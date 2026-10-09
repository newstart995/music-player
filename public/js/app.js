let allTracks = [];
let currentGenre = 'ALL';

const audioPlayer = document.getElementById('audioPlayer');
const trackListEl = document.getElementById('trackList');
const genreListEl = document.getElementById('genreList');
const refreshBtn = document.getElementById('refreshBtn');
const currentGenreTitle = document.getElementById('currentGenreTitle');

// 页面加载初始化
document.addEventListener('DOMContentLoaded', () => {
  loadMusic();

  refreshBtn.addEventListener('click', refreshCatalog);

  genreListEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('genre-item')) {
      const genre = e.target.getAttribute('data-genre');
      filterGenre(genre);
    }
  });
});

// 从 API 加载歌曲数据
async function loadMusic() {
  try {
    const res = await fetch('/api/music');
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '暂无数据');
    }
    allTracks = await res.json();
    renderGenres();
    renderTracks();
  } catch (err) {
    trackListEl.innerHTML = `<tr><td colspan="4" class="loading-text">${err.message}，请点击右上角【同步七牛云目录】</td></tr>`;
  }
}

// 同步七牛云目录
async function refreshCatalog() {
  refreshBtn.innerText = '同步中...';
  refreshBtn.disabled = true;

  try {
    const res = await fetch('/api/refresh');
    const data = await res.json();
    if (data.success) {
      alert(`同步成功，共发现 ${data.count} 首歌曲`);
      await loadMusic();
    } else {
      alert('同步失败：' + (data.error || '未知错误'));
    }
  } catch (e) {
    alert('请求失败：' + e.message);
  } finally {
    refreshBtn.innerText = '同步七牛云目录';
    refreshBtn.disabled = false;
  }
}

// 渲染类型菜单
function renderGenres() {
  const genres = ['ALL', ...new Set(allTracks.map(t => t.genre))];
  genreListEl.innerHTML = genres.map(g => `
    <li class="genre-item ${g === currentGenre ? 'active' : ''}" data-genre="${g}">
      ${g === 'ALL' ? '全部歌曲' : g}
    </li>
  `).join('');
}

// 筛选指定类型的歌曲
function filterGenre(genre) {
  currentGenre = genre;
  currentGenreTitle.innerText = genre === 'ALL' ? '全部歌曲' : genre;
  renderGenres();
  renderTracks();
}

// 渲染歌曲列表
function renderTracks() {
  const filtered = currentGenre === 'ALL' 
    ? allTracks 
    : allTracks.filter(t => t.genre === currentGenre);

  if (filtered.length === 0) {
    trackListEl.innerHTML = `<tr><td colspan="4" class="loading-text">该分类下无歌曲</td></tr>`;
    return;
  }

  trackListEl.innerHTML = filtered.map((t, index) => `
    <tr class="track-row" onclick="playTrack('${t.id}')">
      <td>${index + 1}</td>
      <td>${t.title}</td>
      <td>${t.artist}</td>
      <td>${t.genre}</td>
    </tr>
  `).join('');
}

// 播放指定的歌曲
function playTrack(id) {
  const track = allTracks.find(t => t.id === id);
  if (!track) return;

  document.getElementById('playerTitle').innerText = track.title;
  document.getElementById('playerArtist').innerText = track.artist;
  audioPlayer.src = track.url;
  audioPlayer.play();
}
