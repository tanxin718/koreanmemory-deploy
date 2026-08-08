/**
 * KoreanMemory - 韩语发音（TTS）
 * 使用浏览器内置 Web Speech API，无需外部依赖
 * 针对 iOS、安卓（vivo/OriginOS）、桌面端做了兼容性优化
 */

const TTS = {
  _voices: [],
  _koreanVoice: null,
  _unlocked: false,
  _voicesReady: false,
  _initRetry: 0,

  init() {
    if (!('speechSynthesis' in window)) {
      console.warn('[TTS] 浏览器不支持 Web Speech API');
      return;
    }
    console.log('[TTS] 初始化，speechSynthesis 可用');

    // 加载语音列表（部分浏览器异步加载，需多次尝试）
    const loadVoices = () => {
      this._voices = speechSynthesis.getVoices() || [];
      if (this._voices.length > 0) {
        // 优先找 ko-KR，再找任何 ko 开头的
        this._koreanVoice = this._voices.find(v => v.lang === 'ko-KR')
          || this._voices.find(v => v.lang === 'ko_KR')
          || this._voices.find(v => v.lang && v.lang.toLowerCase().startsWith('ko'));
        this._voicesReady = true;
        console.log('[TTS] 可用语音数：', this._voices.length,
          '韩语语音：', this._koreanVoice ? this._koreanVoice.name : '未找到（将使用默认语音）');
      } else {
        // 安卓某些机型首次获取为空，重试
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

  // 解锁语音引擎（首次交互时调用一次空播放）
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
    if (!('speechSynthesis' in window)) {
      Toast.show('当前浏览器不支持语音播放', 'warning');
      return;
    }
    if (!text) return;

    // 安卓兼容：先 cancel 再 speak，避免队列堆积
    speechSynthesis.cancel();
    // 短暂延迟确保 cancel 完成
    setTimeout(() => this._doSpeak(text, rate), 50);
  },

  _doSpeak(text, rate) {
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
      if (e.error === 'interrupted' || e.error === 'canceled') {
        return;
      }
      console.warn('[TTS] 播放失败:', e.error);
      if (e.error === 'not-allowed') {
        Toast.show('请点击页面任意位置后再试', 'warning');
      } else if (e.error === 'synthesis-failed' || e.error === 'audio-busy') {
        // 安卓常见：引擎忙碌，重试一次
        Toast.show('语音引擎忙碌，正在重试...', 'warning');
        setTimeout(() => this._doSpeak(text, rate), 500);
      } else {
        Toast.show('语音播放失败，可能缺少韩语语音包', 'warning');
      }
      finishOnce();
    };

    // 某些浏览器（Chrome 移动版）有时不触发 onend，加超时兜底
    setTimeout(() => {
      if (!_handled) {
        finishOnce();
      }
    }, Math.max(3000, text.length * 300));

    try {
      speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('[TTS] speak 异常:', err);
      Toast.show('语音播放异常', 'warning');
    }
  },

  /**
   * 停止朗读
   */
  stop() {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  },

  /**
   * 切换播放/停止
   */
  toggle(text, btnEl) {
    if (!('speechSynthesis' in window)) {
      Toast.show('当前浏览器不支持语音播放', 'warning');
      return;
    }
    if (speechSynthesis.speaking) {
      this.stop();
      if (btnEl) btnEl.classList.remove('speaking');
    } else {
      this.speak(text);
      if (btnEl) btnEl.classList.add('speaking');
      const checkEnd = setInterval(() => {
        if (!speechSynthesis.speaking) {
          if (btnEl) btnEl.classList.remove('speaking');
          clearInterval(checkEnd);
        }
      }, 200);
    }
  },

  /**
   * 是否支持韩语语音
   * 注意：即使没有 ko-KR 语音包，浏览器也会用默认语音读，所以只要支持 speechSynthesis 就返回 true
   */
  isSupported() {
    return 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
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
