const projectList = document.getElementById('project-list');
const projectDesc = document.getElementById('project-desc');
const cardFlip = document.querySelector('.card-flip');
const avatar = document.getElementById('avatar');
const backClose = document.getElementById('backClose');
const cardFront = document.querySelector('.card-front');
const cardBack = document.querySelector('.card-back');

// 更新卡片高度
function updateCardHeight() {
    if (cardFlip.classList.contains('flipped')) {
        cardFlip.style.height = cardBack.offsetHeight + 'px';
    } else {
        cardFlip.style.height = cardFront.offsetHeight + 'px';
    }
}

// 初始化高度
setTimeout(() => {
    cardFlip.style.height = cardFront.offsetHeight + 'px';
}, 0);

// 头像点击翻转
avatar.addEventListener('click', () => {
    cardFlip.classList.add('flipped');
    setTimeout(updateCardHeight, 50);
});

// 关闭按钮翻转回来
backClose.addEventListener('click', (e) => {
    e.stopPropagation();
    cardFlip.classList.remove('flipped');
    setTimeout(updateCardHeight, 50);
});

// Music Player
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');
const vinyl = document.getElementById('vinyl');


let playlist = [];
let currentSongIndex = 0;

// 从 GitHub raw 获取播放列表
fetch('https://raw.githubusercontent.com/JyHu/jyhu.github.io/assets/music/playlist.json')
    .then(response => response.json())
    .then(data => {
        playlist = data.map(song => ({
            title: song.title,
            artist: song.artist,
            url: `https://raw.githubusercontent.com/JyHu/jyhu.github.io/assets/music/${song.filename}`
        }));
        if (playlist.length > 0) {
            loadSong(0);
        }
    })
    .catch(error => {
        console.error('Failed to load playlist:', error);
        songTitle.textContent = 'No songs available';
    });

function loadSong(index) {
    if (!playlist || playlist.length === 0) return;
    const song = playlist[index];
    audioPlayer.src = song.url;
    songTitle.textContent = song.title;
    songArtist.textContent = song.artist;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

playBtn.addEventListener('click', () => {
    if (audioPlayer.paused) {
        audioPlayer.play();
        playBtn.textContent = '⏸';
        vinyl.classList.add('playing');
    } else {
        audioPlayer.pause();
        playBtn.textContent = '▶';
        vinyl.classList.remove('playing');
    }
});

prevBtn.addEventListener('click', () => {
    currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
    loadSong(currentSongIndex);
    audioPlayer.play();
    playBtn.textContent = '⏸';
    vinyl.classList.add('playing');
});

nextBtn.addEventListener('click', () => {
    currentSongIndex = (currentSongIndex + 1) % playlist.length;
    loadSong(currentSongIndex);
    audioPlayer.play();
    playBtn.textContent = '⏸';
    vinyl.classList.add('playing');
});

audioPlayer.addEventListener('timeupdate', () => {
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.value = progress || 0;
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
});

audioPlayer.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audioPlayer.duration);
});

progressBar.addEventListener('input', () => {
    const time = (progressBar.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = time;
});

audioPlayer.addEventListener('ended', () => {
    nextBtn.click();
});

Projects.forEach((project, index) => {
    const listItem = document.createElement('li');
    listItem.textContent = project.name;
    listItem.addEventListener('mouseover', () => {
        document.querySelectorAll('#project-list li').forEach(li => li.classList.remove('active'));
        listItem.classList.add('active');
        projectDesc.innerHTML = project.description;
        if (project.url) {
            projectDesc.innerHTML += ` <a href="${project.url}" target="_blank">Go >>></a>`;
        }
    });
    if (project.url) {
        listItem.addEventListener('click', () => {
            window.open(project.url, '_blank');
        });
    }
    if (index === 0) {
        listItem.classList.add('active');
        projectDesc.innerHTML = project.description;
        if (project.url) {
            projectDesc.innerHTML += ` <a href="${project.url}" target="_blank">Go >>></a>`;
        }
    }
    projectList.appendChild(listItem);
});

const listBtn = document.getElementById('listBtn');
const playlistMenu = document.getElementById('playlistMenu');

function renderPlaylistMenu() {
    if (!playlist || playlist.length === 0) return;
    let html = '<button class="close-btn" id="closePlaylist">✕</button>';
    html += '<h3>播放列表</h3><ul>';
    playlist.forEach((song, idx) => {
        html += `<li class="${idx === currentSongIndex ? 'current' : ''}" data-idx="${idx}">${song.title} - ${song.artist}</li>`;
    });
    html += '</ul>';
    playlistMenu.innerHTML = html;
    playlistMenu.style.display = 'block';

    document.getElementById('closePlaylist').onclick = () => {
        playlistMenu.style.display = 'none';
    };
    playlistMenu.querySelectorAll('li').forEach(li => {
        li.onclick = function() {
            const idx = parseInt(this.getAttribute('data-idx'));
            if (!isNaN(idx)) {
                currentSongIndex = idx;
                loadSong(currentSongIndex);
                audioPlayer.play();
                playBtn.textContent = '⏸';
                vinyl.classList.add('playing');
                renderPlaylistMenu();
            }
        };
    });
}

listBtn.addEventListener('click', function(event) {
    renderPlaylistMenu();
    event.stopPropagation();
});

document.addEventListener('click', function(e) {
    if (playlistMenu.style.display === 'block' && !playlistMenu.contains(e.target) && !listBtn.contains(e.target)) {
        playlistMenu.style.display = 'none';
    }
});
