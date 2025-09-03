class LyricsPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.playButton = document.getElementById('playButton');
        this.playIcon = this.playButton.querySelector('.play-icon');
        this.pauseIcon = this.playButton.querySelector('.pause-icon');
        this.coverImage = document.getElementById('coverImage');
        this.albumCover = document.getElementById('albumCover');
        this.songTitle = document.getElementById('songTitle');

        this.lyricsContainer = document.getElementById('lyricsContainer');
        this.musicFileInput = document.getElementById('musicFile');
        this.lyricsFileInput = document.getElementById('lyricsFile');
        this.coverFileInput = document.getElementById('coverFile');
        
        // 歌词相关
        this.lyrics = [];
        this.currentLyricIndex = -1;
        this.isPlaying = false;
        this.lyricsOffset = 0; // 歌词时间偏移（秒）
        
        // 偏移控件
        this.offsetValue = document.getElementById('offsetValue');
        this.offsetDecrease = document.getElementById('offsetDecrease');
        this.offsetIncrease = document.getElementById('offsetIncrease');
        this.offsetReset = document.getElementById('offsetReset');
        
        // 重置按钮
        this.resetBtn = document.getElementById('resetBtn');
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        // 播放/暂停按钮
        this.playButton.addEventListener('click', () => this.togglePlay());
        
        // 文件上传
        this.musicFileInput.addEventListener('change', (e) => this.handleMusicFile(e));
        this.lyricsFileInput.addEventListener('change', (e) => this.handleLyricsFile(e));
        this.coverFileInput.addEventListener('change', (e) => this.handleCoverFile(e));
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // 偏移控件事件
        this.offsetDecrease.addEventListener('click', () => this.adjustOffset(-0.5));
        this.offsetIncrease.addEventListener('click', () => this.adjustOffset(0.5));
        this.offsetReset.addEventListener('click', () => this.resetOffset());
        
        // 重置按钮事件
        this.resetBtn.addEventListener('click', () => this.resetAll());
        
        // 双击编辑歌曲名
        this.songTitle.addEventListener('dblclick', () => this.editSongTitle());
        
        // 音频事件
        this.audio.addEventListener('loadedmetadata', () => this.onAudioLoaded());
        this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.audio.addEventListener('ended', () => this.onAudioEnded());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());
        
        // 歌词点击跳转
        this.lyricsContainer.addEventListener('click', (e) => this.onLyricClick(e));
    }
    
    handleMusicFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const url = URL.createObjectURL(file);
        this.audio.src = url;
        
        // 更新歌曲标题
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        this.songTitle.textContent = fileName;
        
        // 尝试提取封面
        this.extractAlbumArt(file);
    }
    
    handleLyricsFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            this.parseLyrics(content);
            this.displayLyrics();
        };
        reader.readAsText(file);
    }
    
    handleCoverFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.setCoverImage(e.target.result);
            this.extractDominantColor(e.target.result);
        };
        reader.readAsDataURL(file);
    }
    
    handleKeydown(event) {
        // 空格键播放/暂停
        if (event.code === 'Space') {
            // 防止页面滚动
            event.preventDefault();
            this.togglePlay();
        }
    }
    
    parseLyrics(content) {
        this.lyrics = [];
        const lines = content.split('\n');
        
        lines.forEach(line => {
            const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const milliseconds = parseInt(match[3]);
                const text = match[4].trim();
                
                if (text) {
                    const time = minutes * 60 + seconds + milliseconds / 100;
                    this.lyrics.push({ time, text });
                }
            }
        });
        
        // 按时间排序
        this.lyrics.sort((a, b) => a.time - b.time);
        this.displayLyrics();
    }
    
    displayLyrics() {
        this.lyricsContainer.innerHTML = '';
        
        if (this.lyrics.length === 0) {
            this.lyricsContainer.innerHTML = '<div class="lyrics-line">暂无歌词</div>';
            return;
        }
        
        this.lyrics.forEach((lyric, index) => {
            const lyricElement = document.createElement('div');
            lyricElement.className = 'lyrics-line';
            lyricElement.textContent = lyric.text;
            lyricElement.dataset.index = index;
            lyricElement.dataset.time = lyric.time;
            this.lyricsContainer.appendChild(lyricElement);
        });
    }
    
    extractAlbumArt(file) {
        // 简单的封面提取（实际项目中可能需要更复杂的库）
        // 这里我们使用一个占位符
        const reader = new FileReader();
        reader.onload = (e) => {
            // 由于浏览器限制，我们无法直接提取音频文件的封面
            // 这里显示默认状态
            this.showDefaultCover();
        };
        reader.readAsArrayBuffer(file);
    }
    
    showDefaultCover() {
        this.coverImage.style.display = 'none';
        this.albumCover.querySelector('.cover-placeholder').style.display = 'flex';
    }
    
    setCoverImage(src) {
        this.coverImage.src = src;
        this.coverImage.style.display = 'block';
        this.albumCover.querySelector('.cover-placeholder').style.display = 'none';
        
        // 提取主色调（简化版本）
        this.extractDominantColor(src);
    }
    
    extractDominantColor(imageSrc) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            
            ctx.drawImage(img, 0, 0);
            
            try {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const color = this.getDominantColor(imageData.data);
                this.updateBackgroundColor(color);
            } catch (e) {
                console.log('无法提取颜色，使用默认背景');
            }
        };
        img.src = imageSrc;
    }
    
    getDominantColor(data) {
        const colorMap = {};
        
        for (let i = 0; i < data.length; i += 16) { // 采样以提高性能
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const alpha = data[i + 3];
            
            if (alpha > 128) { // 忽略透明像素
                const color = `${Math.floor(r/32)*32},${Math.floor(g/32)*32},${Math.floor(b/32)*32}`;
                colorMap[color] = (colorMap[color] || 0) + 1;
            }
        }
        
        let maxCount = 0;
        let dominantColor = '74,144,226'; // 默认蓝色
        
        for (const color in colorMap) {
            if (colorMap[color] > maxCount) {
                maxCount = colorMap[color];
                dominantColor = color;
            }
        }
        
        return dominantColor;
    }
    
    updateBackgroundColor(color) {
        const [r, g, b] = color.split(',').map(Number);
        const gradient = `linear-gradient(135deg, 
            rgb(${r}, ${g}, ${b}) 0%, 
            rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)}) 50%, 
            rgb(${Math.min(255, r + 60)}, ${Math.min(255, g + 60)}, ${Math.min(255, b + 60)}) 100%)`;
        
        document.body.style.background = gradient;
    }
    
    togglePlay() {
        if (this.audio.src) {
            if (this.isPlaying) {
                this.audio.pause();
            } else {
                this.audio.play();
            }
        }
    }
    
    onPlay() {
        this.isPlaying = true;
        this.playIcon.style.display = 'none';
        this.pauseIcon.style.display = 'block';
        document.body.classList.add('playing');
    }
    
    onPause() {
        this.isPlaying = false;
        this.playIcon.style.display = 'block';
        this.pauseIcon.style.display = 'none';
        document.body.classList.remove('playing');
    }
    
    onAudioLoaded() {
        console.log('音频加载完成');
    }
    
    onTimeUpdate() {
        if (!this.lyrics.length) return;
        
        const currentTime = this.audio.currentTime + this.lyricsOffset;
        let newIndex = -1;
        
        // 找到当前时间对应的歌词
        for (let i = 0; i < this.lyrics.length; i++) {
            if (currentTime >= this.lyrics[i].time) {
                newIndex = i;
            } else {
                break;
            }
        }
        
        // 如果歌词索引发生变化，更新高亮
        if (newIndex !== this.currentLyricIndex) {
            this.currentLyricIndex = newIndex;
            this.updateLyricHighlight(newIndex);
        }
    }
    
    adjustOffset(delta) {
        this.lyricsOffset += delta;
        this.updateOffsetDisplay();
    }
    
    resetOffset() {
        this.lyricsOffset = 0;
        this.updateOffsetDisplay();
    }
    
    updateOffsetDisplay() {
        this.offsetValue.textContent = this.lyricsOffset.toFixed(1);
    }
    
    resetAll() {
        // 停止播放
        this.audio.pause();
        this.audio.src = '';
        
        // 重置界面
        this.songTitle.textContent = '请选择音乐文件';
        this.showDefaultCover();
        this.lyricsContainer.innerHTML = '';
        
        // 重置数据
        this.lyrics = [];
        this.currentLyricIndex = -1;
        this.isPlaying = false;
        this.lyricsOffset = 0;
        this.updateOffsetDisplay();
        
        // 重置播放按钮
        this.playIcon.style.display = 'block';
        this.pauseIcon.style.display = 'none';
        
        // 清空文件输入
        this.musicFileInput.value = '';
        this.lyricsFileInput.value = '';
        this.coverFileInput.value = '';
        
        // 重置背景色
        document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    
    editSongTitle() {
        const currentTitle = this.songTitle.textContent;
        if (currentTitle === '请选择音乐文件') return;
        
        // 创建输入框
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentTitle;
        input.className = 'song-title-input';
        input.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            color: white;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            padding: 8px;
            width: 100%;
            outline: none;
        `;
        
        // 替换标题元素
        this.songTitle.style.display = 'none';
        this.songTitle.parentNode.insertBefore(input, this.songTitle);
        input.focus();
        input.select();
        
        // 保存编辑
        const saveEdit = () => {
            const newTitle = input.value.trim();
            if (newTitle) {
                this.songTitle.textContent = newTitle;
            }
            input.remove();
            this.songTitle.style.display = 'block';
        };
        
        // 事件监听
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveEdit();
            } else if (e.key === 'Escape') {
                input.remove();
                this.songTitle.style.display = 'block';
            }
        });
    }
    
    updateLyricHighlight(index) {
        // 移除所有高亮
        const allLyrics = this.lyricsContainer.querySelectorAll('.lyrics-line');
        allLyrics.forEach(line => line.classList.remove('active'));
        
        // 添加当前高亮
        if (index >= 0 && index < allLyrics.length) {
            const currentLine = allLyrics[index];
            currentLine.classList.add('active');
            
            // 滚动到当前歌词
            this.scrollToLyric(currentLine);
        }
    }
    
    scrollToLyric(element) {
        // 使用scrollIntoView实现居中显示
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
        });
    }
    
    onLyricClick(event) {
        if (event.target.classList.contains('lyrics-line')) {
            const time = parseFloat(event.target.dataset.time);
            if (!isNaN(time) && this.audio.src) {
                this.audio.currentTime = time;
            }
        }
    }
    
    onAudioEnded() {
        this.onPause();
        this.currentLyricIndex = -1;
        this.updateLyricHighlight(-1);
    }
}

// 初始化播放器
document.addEventListener('DOMContentLoaded', () => {
    new LyricsPlayer();
});

// 防止拖拽文件到页面导致页面跳转
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
});