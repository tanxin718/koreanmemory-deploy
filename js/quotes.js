/**
 * KoreanMemory - 今日金句数据
 * 类型：名言(quote)、小知识(trivia)、笑话(joke)、脑筋急转弯(riddle)
 * 支持用户自定义添加，存储于 localStorage
 */

const CUSTOM_QUOTES_KEY = 'km_custom_quotes';
const QUOTE_SEEN_KEY = 'km_quote_seen_date';

const DAILY_QUOTES = [
  // ===== 名言 =====
  { type: 'quote', icon: 'fa-quote-left', title: '名言',
    ko: '시작이 반이다.',
    zh: '开始就是一半。（百里行程半九十的反义，重在行动）' },
  { type: 'quote', icon: 'fa-quote-left', title: '名言',
    ko: '천 리 길도 한 걸음부터.',
    zh: '千里之行，始于足下。' },
  { type: 'quote', icon: 'fa-quote-left', title: '名言',
    ko: '고생 끝에 낙이 온다.',
    zh: '苦尽甘来。' },
  { type: 'quote', icon: 'fa-quote-left', title: '名言',
    ko: '티끌 모아 태산.',
    zh: '聚沙成塔，集腋成裘。' },
  { type: 'quote', icon: 'fa-quote-left', title: '名言',
    ko: '아는 길도 물어가라.',
    zh: '即便认识路也要边问边走。（做事要谨慎确认）' },
  { type: 'quote', icon: 'fa-quote-left', title: '名言',
    ko: '윗물이 맑아야 아랫물이 맑다.',
    zh: '上行下效，上梁不正下梁歪。' },
  { type: 'quote', icon: 'fa-quote-left', title: '名言',
    ko: '호랑이는 죽어서 가죽를 남기고 사람은 죽어서 이름을 남긴다.',
    zh: '虎死留皮，人死留名。' },
  { type: 'quote', icon: 'fa-quote-left', title: '名言',
    ko: '늦었다고 생각할 때가 진짜 너무 늦었다.',
    zh: '当你觉得"已经晚了"的时候，才是真的太晚了。（韩国网络流行语）' },
  { type: 'quote', icon: 'fa-quote-left', title: '名言',
    ko: '재주가 많은 놈이 굶어 죽는다.',
    zh: '技多不养家，艺多不精。（讽刺样样通样样松）' },
  { type: 'quote', icon: 'fa-quote-left', title: '名言',
    ko: '빈 수레가 요란하다.',
    zh: '空车响声大。（半瓶水响叮当）' },

  // ===== 韩国小知识 =====
  { type: 'trivia', icon: 'fa-lightbulb', title: '小知识',
    ko: '한국의 국기는 태극기입니다.',
    zh: '韩国的国旗叫"太极旗"，中央的太极图案象征宇宙的阴阳和谐。' },
  { type: 'trivia', icon: 'fa-lightbulb', title: '小知识',
    ko: '한글은 1443년 세종대왕이 창제했습니다.',
    zh: '韩文（한글）由世宗大王于1443年创制，是世界上少有的有明确发明人和发明日期的文字系统。' },
  { type: 'trivia', icon: 'fa-lightbulb', title: '小知识',
    ko: '한국의 나이 계산법은 중국과 다릅니다.',
    zh: '韩国传统年龄计算法：出生即1岁，每过一个元旦加1岁。2023年起韩国已立法改用国际标准年龄。' },
  { type: 'trivia', icon: 'fa-lightbulb', title: '小知识',
    ko: '김치는 한국의 대표 음식입니다.',
    zh: '泡菜（김치）是韩国代表性发酵食品，已知有200多种种类，2013年被列入联合国非遗。' },
  { type: 'trivia', icon: 'fa-lightbulb', title: '小知识',
    ko: '한국에서 4자(arrival)는 불길한 숫자입니다.',
    zh: '韩国和中国一样忌讳数字"4"，因为韩语中"四（사）"与"死（사）"同音。很多电梯没有4楼按钮。' },
  { type: 'trivia', icon: 'fa-lightbulb', title: '小知识',
    ko: '서울은 원래 한양이라고 불렸습니다.',
    zh: '首尔原名"汉阳"（한양），1394年成为朝鲜王朝首都，后改名"汉城"（한성），2005年正式更名为"首尔"（서울）。' },
  { type: 'trivia', icon: 'fa-lightbulb', title: '小知识',
    ko: '한국의 화장실에는 휴지가 비치되어 있습니다.',
    zh: '韩国的公共厕所通常都免费提供厕纸，而且非常干净。这在很多国家是难以想象的便利。' },
  { type: 'trivia', icon: 'fa-lightbulb', title: '小知识',
    ko: '한국에서는 빨간색 펜으로 이름을 쓰면 안 됩니다.',
    zh: '在韩国，用红笔写别人的名字被认为是不吉利的，因为传统上只有死者的名字才用红笔书写。' },
  { type: 'trivia', icon: 'fa-lightbulb', title: '小知识',
    ko: '한국의 배달 문화는 세계 최고 수준입니다.',
    zh: '韩国外卖配送文化世界领先，深夜也能点到炸酱面、炸鸡等外卖，配送速度极快且餐具可回收。' },
  { type: 'trivia', icon: 'fa-lightbulb', title: '小知识',
    ko: '한국에서는 숟가락과 젓가락을 함께 사용합니다.',
    zh: '韩国人吃饭时勺子和筷子并用：勺子用来吃饭喝汤，筷子用来夹菜。这与中国、日本的饮食习惯不同。' },
  { type: 'trivia', icon: 'fa-lightbulb', title: '小知识',
    ko: '한국의 응원 문화 "파이팅!"',
    zh: '"파이팅!(Fighting)"是韩国人最常用的加油用语，虽然来自英语，但已成为韩语日常用语，表示"加油！冲吧！"' },
  { type: 'trivia', icon: 'fa-lightbulb', title: '小知识',
    ko: '한국의 지하철은 세계에서 가장 깨끗한 편입니다.',
    zh: '韩国地铁以干净、准时、便利著称，车厢内有暖气座椅和LCD屏幕，冬季还有温暖的候车室。' },

  // ===== 笑话 =====
  { type: 'joke', icon: 'fa-face-laugh-squint', title: '笑话',
    ko: '선생님: "너 왜 지각했어?" 학생: "길에 미끄러져서요." 선생님: "그럼 다음엔 미끄러지지 말고 굴러와!"',
    zh: '老师："你为什么迟到？" 学生："路上滑倒了。" 老师："那下次别滑了，滚过来！"' },
  { type: 'joke', icon: 'fa-face-laugh-squint', title: '笑话',
    ko: '아빠: "너 커서 뭐 될래?" 아들: "거인이요!"',
    zh: '爸爸："你长大想当什么？" 儿子："巨人！"' },
  { type: 'joke', icon: 'fa-face-laugh-squint', title: '笑话',
    ko: '환자: "의사 선생님, 수술 비용이 얼마인가요?" 의사: "500만 원입니다." 환자: "너무 비싸요!" 의사: "그럼 깎아드릴게요. 마취 안 할래요?"',
    zh: '患者："医生，手术费多少钱？" 医生："500万韩元。" 患者："太贵了！" 医生："那给你打折，不麻醉行吗？"' },
  { type: 'joke', icon: 'fa-face-laugh-squint', title: '笑话',
    ko: '엄마: "네 방 좀 치워!" 아이: "엄마, 제 방은 제 공간이에요!" 엄마: "그래, 그 공간이 내 집이야. 나가!"',
    zh: '妈妈："打扫一下你房间！" 孩子："妈，我的房间是我的私人空间！" 妈妈："好的，那这个空间是我的房子。出去！"' },
  { type: 'joke', icon: 'fa-face-laugh-squint', title: '笑话',
    ko: '친구: "너 한자 시험 몇 점 맞았어?" 나: "100점!" 친구: "대박! 근데 만점이 몇 점이야?" 나: "...200점."',
    zh: '朋友："你汉字考试考了多少分？" 我："100分！" 朋友："哇！满分多少分？" 我："……200分。"' },

  // ===== 脑筋急转弯 =====
  { type: 'riddle', icon: 'fa-puzzle-piece', title: '脑筋急转弯',
    ko: '문제: 한국에서 가장 긴 다리는? (정답: 다리가 가장 긴 사람의 다리)',
    zh: '问题：韩国最长的"桥"（다리，同音"腿"）是？答案：腿最长的人的腿（다리在韩语中既是"桥"也是"腿"）' },
  { type: 'riddle', icon: 'fa-puzzle-piece', title: '脑筋急转弯',
    ko: '문제: 입은 있지만 말을 못 하는 것은? (정답: 강물)',
    zh: '问题：有"口"（입/江口）但不能说话的是什么？答案：河水（강물，韩语"江口"中有"口"字）' },
  { type: 'riddle', icon: 'fa-puzzle-piece', title: '脑筋急转弯',
    ko: '문제: 가만히 있는데도 계속 변하는 것은? (정답: 나이)',
    zh: '问题：什么都不做却一直在变的是什么？答案：年龄。' },
  { type: 'riddle', icon: 'fa-puzzle-piece', title: '脑筋急转弯',
    ko: '문제: 눈이 가장 많은 것은? (정답: 눈사람 — 눈은 "目"も"雪"も意味)',
    zh: '问题："眼睛"（눈）最多的东西是？答案：雪人（눈在韩语中既是"眼睛"也是"雪"，所以雪人有最多的"눈"）' },
  { type: 'riddle', icon: 'fa-puzzle-piece', title: '脑筋急转弯',
    ko: '문제: 입고 있는 옷을 벗을 수 없는 사람은? (정답: 옷장)',
    zh: '问题：穿着衣服却脱不下来的"人"是谁？答案：衣柜（옷장，字面有"衣"字）' },

  // ===== 更多韩国文化小知识 =====
  { type: 'trivia', icon: 'fa-lightbulb', title: '小知识',
    ko: '한국의 전통 혼례에서는 오랑채를 사용합니다.',
    zh: '韩国传统婚礼上会使用"雁"（ wild goose），象征夫妻忠贞不渝，因为大雁终身只有一个伴侣。' },
  { type: 'trivia', icon: 'fa-lightbulb', title: '小知识',
    ko: '한국의 학교는 3월에 새 학기가 시작합니다.',
    zh: '韩国学校新学年从3月开始（不是9月），因为韩国的财政年度和学年都以春季为起点。' },
  { type: 'trivia', icon: 'fa-lightbulb', title: '小知识',
    ko: '한국의 전통주는 막걸리입니다.',
    zh: '马格利酒（막걸리）是韩国传统米酒，呈乳白色，酒精度约6-8度，口感微甜带酸。' },
  { type: 'trivia', icon: 'fa-lightbulb', title: '小知识',
    ko: '한국에서는 생일에 미역국을 먹습니다.',
    zh: '韩国人生日要喝海带汤（미역국），因为母亲产后也喝海带汤补身，以此感恩母亲的生育之苦。' },
  { type: 'trivia', icon: 'fa-lightbulb', title: '小知识',
    ko: '한국의 고유 명절은 설날과 추석입니다.',
    zh: '韩国两大传统节日是"春节"（설날）和"秋夕/中秋"（추석），全家人会穿上韩服、行大礼、吃年糕汤或松饼。' },

  // ===== 更多谚语/名言 =====
  { type: 'quote', icon: 'fa-quote-left', title: '谚语',
    ko: '가랑잎이 솔잎더러 바스락거린다고 한다.',
    zh: '落叶笑松针沙沙响。（五十步笑百步，乌鸦笑猪黑）' },
  { type: 'quote', icon: 'fa-quote-left', title: '谚语',
    ko: '구르는 돌에는 이끼가 끼지 않는다.',
    zh: '滚石不生苔。（人需要安定才能积累）' },
  { type: 'quote', icon: 'fa-quote-left', title: '谚语',
    ko: '도둑이 제 발 저린다.',
    zh: '贼心虚，做贼心虚。（做了坏事自己先露馅）' },
  { type: 'quote', icon: 'fa-quote-left', title: '谚语',
    ko: '원숭이도 나무에서 떨어진다.',
    zh: '猴子也会从树上掉下来。（即使专家也有失手的时候）' },
  { type: 'quote', icon: 'fa-quote-left', title: '谚语',
    ko: '참을 인 자가 세 번이면 호구된다.',
    zh: '"忍"字头上三把刀，忍三次就成冤大头。（韩国版"忍无可忍"）' }
];

/**
 * 获取所有金句（内置 + 自定义）
 */
function getAllQuotes() {
  let custom = [];
  try {
    custom = JSON.parse(localStorage.getItem(CUSTOM_QUOTES_KEY)) || [];
  } catch { custom = []; }
  return [...DAILY_QUOTES, ...custom];
}

/**
 * 基于日期获取今日金句
 */
function getDailyQuote() {
  const all = getAllQuotes();
  if (all.length === 0) return null;
  const today = new Date().toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % all.length;
  return { ...all[index], _index: index };
}

/**
 * 换一条金句（随机）
 */
function getRandomQuote(excludeIndex = -1) {
  const all = getAllQuotes();
  if (all.length === 0) return null;
  if (all.length === 1) return { ...all[0], _index: 0 };
  let idx;
  do {
    idx = Math.floor(Math.random() * all.length);
  } while (idx === excludeIndex);
  return { ...all[idx], _index: idx };
}

/**
 * 添加自定义金句
 */
function addCustomQuote(type, ko, zh) {
  const iconMap = {
    'quote': 'fa-quote-left',
    'trivia': 'fa-lightbulb',
    'joke': 'fa-face-laugh-squint',
    'riddle': 'fa-puzzle-piece'
  };
  const titleMap = {
    'quote': '名言',
    'trivia': '小知识',
    'joke': '笑话',
    'riddle': '脑筋急转弯'
  };
  const quote = {
    type: type,
    icon: iconMap[type] || 'fa-star',
    title: titleMap[type] || '自定义',
    ko: ko.trim(),
    zh: zh.trim(),
    custom: true
  };
  let custom = [];
  try {
    custom = JSON.parse(localStorage.getItem(CUSTOM_QUOTES_KEY)) || [];
  } catch { custom = []; }
  custom.push(quote);
  localStorage.setItem(CUSTOM_QUOTES_KEY, JSON.stringify(custom));
  return quote;
}

/**
 * 删除自定义金句
 */
function deleteCustomQuote(index) {
  let custom = [];
  try {
    custom = JSON.parse(localStorage.getItem(CUSTOM_QUOTES_KEY)) || [];
  } catch { custom = []; }
  if (index >= 0 && index < custom.length) {
    custom.splice(index, 1);
    localStorage.setItem(CUSTOM_QUOTES_KEY, JSON.stringify(custom));
    return true;
  }
  return false;
}

/**
 * 获取自定义金句列表
 */
function getCustomQuotes() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_QUOTES_KEY)) || [];
  } catch { return []; }
}
