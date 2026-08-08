/**
 * KoreanMemory - 韩语发音（TTS）
 * 优先使用系统 Web Speech API；若无韩语语音包，自动回退在线 TTS
 * 针对 iOS、安卓（vivo/OriginOS）、桌面端做了兼容性优化
 */

const TTS = {
  _voices: [],
  _koreanVoice: null,
  _unlocked: false,
  _voicesReady: false,
  _initRetry: 0,
  _audioEl: null,        // 在线 TTS 用的 audio 元素
  _usingOnline: false,   // 当前是否在用在线 TTS

  init() {
    if (!('speechSynthesis' in window)) {
      console.warn('[TTS] 浏览器不支持 Web Speech API，将仅使用在线发音');
      return;
    }
    console.log('[TTS] 初始化，speechSynthesis 可用');

    // 加载语音列表（部分浏览器异步加载，需多次尝试）
    const loadVoices = () => {
      this._voices = speechSynthesis.getVoices() || [];
      if (this._voices.length > 0) {
        this._koreanVoice = this._voices.find(v => v.lang === 'ko-KR')
          || this._voices.find(v => v.lang === 'ko_KR')
          || this._voices.find(v => v.lang && v.lang.toLowerCase().startsWith('ko'));
        this._voicesReady = true;
        console.log('[TTS] 可用语音数：', this._voices.length,
          '韩语语音：', this._koreanVoice ? this._koreanVoice.name : '未找到（将使用在线发音）');
      } else {
        this._initRetry++;
        if (this._initRetry < 10) {
          setTimeout(loadVoices, 200);
        }
      }
    };
    loadVoices();
    if (typeof speechSynthesis.onvoiceschanged !== 'undefined') {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    // iOS Safari / 安卓 Chrome 都需要在用户交互时"解锁"语音
    const unlock = () => {
      if (this._unlocked) return;
      this._unlocked = true;
      this._doUnlock();
    };
    document.addEventListener('touchend', unlock, { once: true, passive: true });
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
  },

  _doUnlock() {
    if (!('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      u.rate = 1;
      u.lang = 'ko-KR';
      speechSynthesis.speak(u);
      console.log('[TTS] 语音已解锁');
    } catch (e) {
      console.warn('[TTS] 解锁失败:', e);
    }
  },

  /**
   * 朗读韩语
   * @param {string} text - 要朗读的韩语文本
   * @param {number} rate - 语速 (0.5-2.0，默认0.9)
   */
  speak(text, rate = 0.9) {
    if (!text) return;

    // 停止当前所有播放
    this.stop();

    // 如果有系统韩语语音，用系统 TTS（最佳质量）
    if (this.hasKoreanVoice() && 'speechSynthesis' in window) {
      this._systemSpeak(text, rate);
      return;
    }

    // 没有韩语语音包，尝试在线 TTS
    console.log('[TTS] 无韩语语音包，尝试在线发音');
    this._onlineSpeak(text, rate);
  },

  // ========== 系统 TTS ==========
  _systemSpeak(text, rate) {
    speechSynthesis.cancel();
    setTimeout(() => this._doSystemSpeak(text, rate), 50);
  },

  _doSystemSpeak(text, rate) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;
    if (this._koreanVoice) {
      utterance.voice = this._koreanVoice;
    }

    let _handled = false;
    const finishOnce = () => {
      if (_handled) return;
      _handled = true;
    };

    utterance.onend = finishOnce;
    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      console.warn('[TTS] 系统播放失败:', e.error);
      // 系统播放失败，尝试在线兜底
      if (e.error === 'synthesis-failed' || e.error === 'audio-busy' ||
          e.error === 'language-unavailable') {
        console.log('[TTS] 回退到在线发音');
        this._onlineSpeak(text, rate);
      } else if (e.error === 'not-allowed') {
        Toast.show('请点击页面任意位置后再试', 'warning');
      }
      finishOnce();
    };

    setTimeout(() => {
      if (!_handled) finishOnce();
    }, Math.max(3000, text.length * 300));

    try {
      speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('[TTS] speak 异常:', err);
      this._onlineSpeak(text, rate);
    }
  },

  // ========== 在线 TTS 兜底 ==========
  // 多源尝试，哪个能用用哪个（国内优先）
  _buildOnlineUrls(text) {
    const q = encodeURIComponent(text);
    return [
      // 百度翻译 TTS（国内可访问，支持韩语，无需密钥）
      // spd=3 是正常语速，数字越小越慢
      `https://fanyi.baidu.com/gettts?lan=kor&text=${q}&spd=3&source=web`,
      // Google Translate TTS（备用，国外服务器）
      `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ko&q=${q}`,
      // Google Translate 香港节点
      `https://translate.google.com.hk/translate_tts?ie=UTF-8&client=tw-ob&tl=ko&q=${q}`,
    ];
  },

  async _onlineSpeak(text, rate) {
    this._usingOnline = true;
    const urls = this._buildOnlineUrls(text);

    for (let i = 0; i < urls.length; i++) {
      const ok = await this._playAudio(urls[i], rate);
      if (ok) {
        console.log('[TTS] 在线发音成功（源 ' + i + '）');
        return;
      }
    }

    // 所有在线源都失败，回退系统 TTS（发音可能不准）
    console.warn('[TTS] 在线发音全部失败，回退系统 TTS');
    this._usingOnline = false;
    if ('speechSynthesis' in window) {
      this._doSystemSpeak(text, rate);
      Toast.show('在线发音不可用，使用系统语音（可能不准）', 'warning');
    } else {
      Toast.show('语音播放失败，请安装韩语语音包', 'warning');
    }
  },

  // 用 Audio 元素播放一个音频 URL（支持远程 URL 和 blob URL）
  // audio 标签加载媒体资源不受 CORS 限制，可跨域播放
  _playAudio(url, rate) {
    return new Promise((resolve) => {
      try {
        const audio = new Audio();
        audio.src = url;
        audio.playbackRate = rate || 0.9;
        this._audioEl = audio;
        this._usingOnline = true;

        let settled = false;
        const done = (success) => {
          if (settled) return;
          settled = true;
          if (!success) this._audioEl = null;
          resolve(success);
        };

        audio.addEventListener('playing', () => done(true), { once: true });
        audio.addEventListener('canplay', () => {
          audio.play().then(() => done(true)).catch(() => done(false));
        }, { once: true });
        audio.addEventListener('error', () => done(false), { once: true });

        setTimeout(() => done(false), 6000);

        audio.load();
        audio.play().then(() => done(true)).catch(() => {
          done(false);
        });
      } catch (e) {
        resolve(false);
      }
    });
  },

  /**
   * 停止朗读
   */
  stop() {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    if (this._audioEl) {
      try {
        this._audioEl.pause();
        this._audioEl.src = '';
        this._audioEl = null;
      } catch (e) {}
    }
    this._usingOnline = false;
  },

  /**
   * 切换播放/停止
   */
  toggle(text, btnEl) {
    const isPlaying = ('speechSynthesis' in window && speechSynthesis.speaking) || this._audioEl;
    if (isPlaying) {
      this.stop();
      if (btnEl) btnEl.classList.remove('speaking');
    } else {
      this.speak(text);
      if (btnEl) btnEl.classList.add('speaking');
      const checkEnd = setInterval(() => {
        const stillPlaying = ('speechSynthesis' in window && speechSynthesis.speaking) || this._audioEl;
        if (!stillPlaying) {
          if (btnEl) btnEl.classList.remove('speaking');
          clearInterval(checkEnd);
        }
      }, 200);
    }
  },

  /**
   * 是否支持韩语语音
   */
  isSupported() {
    return true; // 有在线兜底，始终返回 true
  },

  /**
   * 是否已安装韩语语音包（影响发音质量）
   */
  hasKoreanVoice() {
    return !!this._koreanVoice;
  }
};

// 页面加载时初始化
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => TTS.init());
}
