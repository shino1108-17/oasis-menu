// 多言語の定義（UI文言・アレルゲン名・カテゴリ・食習慣プリセット）
// 翻訳はAI（Claude）で作成した下書きです。

export const LANGS = [
  { code: 'ja', label: '日本語', html: 'ja' },
  { code: 'en', label: 'English', html: 'en' },
  { code: 'zh', label: '中文', html: 'zh-Hans' },
  { code: 'ko', label: '한국어', html: 'ko' },
  { code: 'vi', label: 'Tiếng Việt', html: 'vi' },
  { code: 'id', label: 'Bahasa Indonesia', html: 'id' },
];

const T = (ja, en, zh, ko, vi, id) => ({ ja, en, zh, ko, vi, id });

// Excel の列順に並べる
export const ALLERGENS = [
  { key: 'wheat', name: T('小麦', 'Wheat', '小麦', '밀', 'Lúa mì', 'Gandum') },
  { key: 'egg', name: T('卵', 'Egg', '鸡蛋', '달걀', 'Trứng', 'Telur') },
  { key: 'milk', name: T('乳', 'Milk', '乳制品', '우유', 'Sữa', 'Susu') },
  { key: 'walnut', name: T('クルミ', 'Walnut', '核桃', '호두', 'Quả óc chó', 'Kenari') },
  { key: 'peanut', name: T('落花生', 'Peanut', '花生', '땅콩', 'Đậu phộng', 'Kacang tanah') },
  { key: 'cashew', name: T('カシューナッツ', 'Cashew', '腰果', '캐슈너트', 'Hạt điều', 'Kacang mete') },
  { key: 'buckwheat', name: T('そば', 'Buckwheat', '荞麦', '메밀', 'Kiều mạch', 'Soba (gandum kuda)') },
  { key: 'shrimp', name: T('エビ', 'Shrimp', '虾', '새우', 'Tôm', 'Udang') },
  { key: 'crab', name: T('カニ', 'Crab', '蟹', '게', 'Cua', 'Kepiting') },
  { key: 'soybean', name: T('大豆', 'Soybean', '大豆', '대두', 'Đậu nành', 'Kedelai') },
  { key: 'chicken', name: T('鶏肉', 'Chicken', '鸡肉', '닭고기', 'Thịt gà', 'Ayam') },
  { key: 'beef', name: T('牛肉', 'Beef', '牛肉', '소고기', 'Thịt bò', 'Daging sapi') },
  { key: 'pork', name: T('豚肉', 'Pork', '猪肉', '돼지고기', 'Thịt lợn', 'Babi') },
  { key: 'banana', name: T('バナナ', 'Banana', '香蕉', '바나나', 'Chuối', 'Pisang') },
  { key: 'apple', name: T('リンゴ', 'Apple', '苹果', '사과', 'Táo', 'Apel') },
  { key: 'gelatin', name: T('ゼラチン', 'Gelatin', '明胶', '젤라틴', 'Gelatin', 'Gelatin') },
  { key: 'mackerel', name: T('サバ', 'Mackerel', '鲭鱼', '고등어', 'Cá thu', 'Ikan makerel') },
  { key: 'sesame', name: T('ごま', 'Sesame', '芝麻', '참깨', 'Vừng (mè)', 'Wijen') },
];

export const CATEGORIES = [
  { key: 'rice', name: T('ごはん', 'Rice', '饭类', '밥', 'Cơm', 'Nasi') },
  { key: 'ramen', name: T('ラーメン', 'Ramen', '拉面', '라멘', 'Ramen', 'Ramen') },
  { key: 'udon', name: T('うどん', 'Udon', '乌冬面', '우동', 'Udon', 'Udon') },
  { key: 'soba', name: T('そば', 'Soba', '荞麦面', '소바', 'Soba', 'Soba') },
  { key: 'other', name: T('その他', 'Other', '其他', '기타', 'Khác', 'Lainnya') },
];

// 宗教・食習慣のプリセット（選ぶと対応するアレルゲン項目を除外条件に加える）
export const DIETS = [
  { key: 'no_pork', avoid: ['pork', 'gelatin'],
    name: T('豚肉・ゼラチンを避ける', 'No pork / gelatin', '不含猪肉・明胶', '돼지고기・젤라틴 제외', 'Không thịt lợn / gelatin', 'Tanpa babi / gelatin') },
  { key: 'no_beef', avoid: ['beef'],
    name: T('牛肉を避ける', 'No beef', '不含牛肉', '소고기 제외', 'Không thịt bò', 'Tanpa daging sapi') },
  { key: 'no_meat', avoid: ['chicken', 'beef', 'pork', 'gelatin'],
    name: T('肉類を避ける', 'No meat', '不含肉类', '육류 제외', 'Không thịt', 'Tanpa daging') },
];

export const UI = {
  nav_menu: T('メニュー', 'Menu', '菜单', '메뉴', 'Thực đơn', 'Menu'),
  nav_filter: T('絞り込み', 'Filter', '筛选', '필터', 'Lọc', 'Filter'),
  nav_info: T('ご案内', 'Info', '须知', '안내', 'Thông tin', 'Info'),
  language: T('言語', 'Language', '语言', '언어', 'Ngôn ngữ', 'Bahasa'),
  hero_cta: T('メニューを見る', 'See the menu', '查看菜单', '메뉴 보기', 'Xem thực đơn', 'Lihat menu'),
  hero_cta2: T('アレルギーで絞り込む', 'Filter by allergy', '按过敏原筛选', '알레르기로 필터', 'Lọc theo dị ứng', 'Filter berdasarkan alergi'),
  notice: T('お知らせ', 'Notice', '通知', '공지', 'Thông báo', 'Pengumuman'),
  hours: T('営業時間', 'Hours', '营业时间', '영업시간', 'Giờ mở cửa', 'Jam buka'),
  filter_title: T('食べられるメニューを探す', 'Find dishes you can eat', '查找可以吃的菜品', '먹을 수 있는 메뉴 찾기', 'Tìm món bạn có thể ăn', 'Cari menu yang bisa Anda makan'),
  filter_lead: T('避けたい食材を選ぶと、それを含まないメニューだけを表示します。',
    'Select ingredients to avoid. Only dishes without them will be shown.',
    '选择需要避免的食材，仅显示不含这些食材的菜品。',
    '피하고 싶은 식재료를 선택하면 그것이 들어가지 않은 메뉴만 표시합니다.',
    'Chọn nguyên liệu cần tránh, chỉ những món không chứa chúng sẽ được hiển thị.',
    'Pilih bahan yang ingin dihindari. Hanya menu tanpa bahan tersebut yang akan ditampilkan.'),
  filter_diet: T('宗教・食習慣', 'Religion / diet', '宗教・饮食习惯', '종교・식습관', 'Tôn giáo / chế độ ăn', 'Agama / pola makan'),
  filter_allergy: T('アレルゲン・食材', 'Allergens / ingredients', '过敏原・食材', '알레르기 유발 물질・식재료', 'Chất gây dị ứng / nguyên liệu', 'Alergen / bahan'),
  filter_strict: T('コンタミ（△）の可能性があるメニューも除外する', 'Also exclude dishes that may contain traces (△)', '同时排除可能混入（△）的菜品',
    '혼입(△) 가능성이 있는 메뉴도 제외', 'Loại trừ cả món có thể lẫn vết (△)', 'Kecualikan juga menu yang mungkin mengandung jejak (△)'),
  search: T('メニュー名で検索', 'Search by name', '按菜名搜索', '메뉴 이름으로 검색', 'Tìm theo tên món', 'Cari berdasarkan nama'),
  clear: T('条件をクリア', 'Clear', '清除条件', '조건 지우기', 'Xóa bộ lọc', 'Hapus filter'),
  all: T('すべて', 'All', '全部', '전체', 'Tất cả', 'Semua'),
  count: T('{n}品', '{n} dishes', '{n}道', '{n}개', '{n} món', '{n} menu'),
  excluded: T('条件に合わないメニュー（{n}品）', 'Dishes that don’t match ({n})', '不符合条件的菜品（{n}道）',
    '조건에 맞지 않는 메뉴 ({n}개)', 'Món không phù hợp ({n})', 'Menu yang tidak sesuai ({n})'),
  none_match: T('条件に合うメニューがありません。', 'No dishes match your filters.', '没有符合条件的菜品。',
    '조건에 맞는 메뉴가 없습니다.', 'Không có món nào phù hợp.', 'Tidak ada menu yang sesuai.'),
  contains: T('含む', 'Contains', '含有', '포함', 'Có chứa', 'Mengandung'),
  may: T('コンタミの可能性', 'May contain traces', '可能混入', '혼입 가능성', 'Có thể lẫn vết', 'Mungkin mengandung jejak'),
  free: T('含まない', 'Not used', '不含', '미포함', 'Không chứa', 'Tidak mengandung'),
  legend: T('● 含む　△ 製造工程で混入の可能性（コンタミ）', '● Contains　△ May contain traces from shared cooking',
    '● 含有　△ 烹调过程中可能混入', '● 포함　△ 조리 과정에서 혼입 가능성', '● Có chứa　△ Có thể lẫn vết trong quá trình nấu',
    '● Mengandung　△ Mungkin tercampur saat proses memasak'),
  sold_out: T('売り切れ', 'Sold out', '已售罄', '품절', 'Hết hàng', 'Habis'),
  details: T('詳しく見る', 'Details', '查看详情', '자세히 보기', 'Xem chi tiết', 'Lihat detail'),
  close: T('閉じる', 'Close', '关闭', '닫기', 'Đóng', 'Tutup'),
  allergy_table: T('アレルギー・原材料', 'Allergens & ingredients', '过敏原・原材料', '알레르기・원재료', 'Chất gây dị ứng & nguyên liệu', 'Alergen & bahan'),
  ja_name: T('日本語名（注文時にお見せください）', 'Japanese name (show this when ordering)', '日文名称（点餐时请出示）',
    '일본어 이름 (주문 시 보여 주세요)', 'Tên tiếng Nhật (đưa cho nhân viên khi gọi món)', 'Nama dalam bahasa Jepang (tunjukkan saat memesan)'),
  reason: T('含む：{x}', 'Contains: {x}', '含有：{x}', '포함: {x}', 'Có chứa: {x}', 'Mengandung: {x}'),
  diet_note: T('※ハラール・ベジタリアン等の認証を受けたメニューではありません。調味料に含まれるアルコールやエキス類、だしの原料は表示の対象外です。気になる方はスタッフにお尋ねください。',
    '* These dishes are not halal- or vegetarian-certified. Alcohol or extracts in seasonings and soup stock ingredients are not listed. Please ask our staff if you have concerns.',
    '※ 本菜单未获得清真、素食等认证。调味料中的酒精、提取物及高汤原料不在标示范围内。如有疑问请咨询工作人员。',
    '※ 할랄・채식 등의 인증을 받은 메뉴가 아닙니다. 조미료에 포함된 알코올이나 엑기스류, 육수 원료는 표시 대상이 아닙니다. 궁금하신 분은 직원에게 문의해 주십시오.',
    '* Các món ăn không được chứng nhận halal hay chay. Cồn hoặc chiết xuất trong gia vị và nguyên liệu nước dùng không được ghi. Vui lòng hỏi nhân viên nếu bạn có thắc mắc.',
    '* Menu ini tidak bersertifikat halal atau vegetarian. Alkohol atau ekstrak dalam bumbu dan bahan kaldu tidak dicantumkan. Silakan tanyakan kepada staf jika ada keraguan.'),
  disclaimer: T('アレルギーについて', 'About allergies', '关于过敏', '알레르기에 대하여', 'Về dị ứng', 'Tentang alergi'),
  loading: T('読み込み中…', 'Loading…', '加载中…', '불러오는 중…', 'Đang tải…', 'Memuat…'),
  load_error: T('メニューを読み込めませんでした。時間をおいて再度お試しください。', 'Could not load the menu. Please try again later.',
    '无法加载菜单，请稍后再试。', '메뉴를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.', 'Không thể tải thực đơn. Vui lòng thử lại sau.', 'Menu tidak dapat dimuat. Silakan coba lagi nanti.'),
  back_top: T('ページ上部へ', 'Back to top', '返回顶部', '맨 위로', 'Lên đầu trang', 'Kembali ke atas'),
  yen: T('{n}円', '¥{n}', '{n}日元', '{n}엔', '{n} yên', '¥{n}'),
  footer_fit: T('福岡工業大学 学生食堂', 'Fukuoka Institute of Technology — Student Cafeteria', '福冈工业大学 学生食堂',
    '후쿠오카공업대학 학생식당', 'Nhà ăn sinh viên — Đại học Công nghiệp Fukuoka', 'Kantin Mahasiswa — Fukuoka Institute of Technology'),
};

/** 多言語オブジェクトから指定言語の文字列を取り出す（無ければ英語→日本語の順に代替） */
export function pick(obj, lang) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.en || obj.ja || '';
}

export function ui(key, lang, vars = {}) {
  let s = pick(UI[key], lang);
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}

export function detectLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q && LANGS.some((l) => l.code === q)) return q;
  try {
    const saved = localStorage.getItem('oasis-lang');
    if (saved && LANGS.some((l) => l.code === saved)) return saved;
  } catch {}
  for (const nav of navigator.languages || [navigator.language]) {
    const code = (nav || '').toLowerCase().split('-')[0];
    if (LANGS.some((l) => l.code === code)) return code;
    if (code === 'ms') return 'id';
  }
  return 'ja';
}
