#!/usr/bin/env python3
"""オアシス アレルギー一覧 (Excel) から初期データを生成する。

使い方:
    python3 tools/excel_to_seed.py "/path/to/オアシス　アレルギー一覧　202610.xlsx"

出力:
    data/seed.json      … デモモード／初期表示用
    supabase/seed.sql   … Supabase に投入する初期データ

翻訳はAI（Claude）で作成した下書きです。管理画面から修正できます。
"""
import json
import sys
import uuid
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent

# Excel の列見出し → アレルゲンキー（「落下生」は原表の誤記）
HEADER_TO_KEY = {
    "小麦": "wheat", "卵": "egg", "乳": "milk", "クルミ": "walnut",
    "落花生": "peanut", "落下生": "peanut", "カシューナッツ": "cashew",
    "そば": "buckwheat", "エビ": "shrimp", "カニ": "crab", "大豆": "soybean",
    "鶏肉": "chicken", "牛肉": "beef", "豚肉": "pork", "バナナ": "banana",
    "リンゴ": "apple", "ゼラチン": "gelatin", "サバ": "mackerel", "ごま": "sesame",
}
MARK = {"〇": "contains", "○": "contains", "◯": "contains", "△": "may"}

L = ("ja", "en", "zh", "ko", "vi", "id")


def t(*vals):
    return dict(zip(L, vals))


UDON = {
    "うどん": (
        t("うどん", "Udon", "乌冬面", "우동", "Mì udon", "Udon"),
        t("温かいつゆのシンプルなうどん。", "Simple udon noodles in hot broth.", "简单的清汤乌冬面。",
          "따뜻한 국물의 기본 우동.", "Mì udon đơn giản trong nước dùng nóng.", "Udon sederhana dengan kuah panas."),
    ),
    "肉うどん": (
        t("肉うどん", "Beef Udon", "牛肉乌冬面", "소고기 우동", "Mì udon thịt bò", "Udon Daging Sapi"),
        t("甘辛く煮た牛肉をのせたうどん。", "Udon topped with sweet-savory simmered beef.", "配甜咸炖牛肉的乌冬面。",
          "달콤 짭짤하게 조린 소고기를 올린 우동.", "Mì udon với thịt bò hầm vị mặn ngọt.", "Udon dengan daging sapi rebus manis gurih."),
    ),
    "きつねうどん": (
        t("きつねうどん", "Kitsune Udon (Fried Tofu)", "油豆腐乌冬面", "유부 우동", "Mì udon đậu phụ chiên (Kitsune)", "Udon Kitsune (Tahu Goreng)"),
        t("甘く煮た油揚げをのせたうどん。", "Udon topped with sweet simmered fried tofu.", "配甜煮油豆腐的乌冬面。",
          "달게 조린 유부를 올린 우동.", "Mì udon với đậu phụ chiên ninh ngọt.", "Udon dengan tahu goreng yang dimasak manis."),
    ),
    "釜揚げうどん": (
        t("釜揚げうどん", "Kamaage Udon", "釜扬乌冬面", "가마아게 우동", "Mì udon Kamaage", "Udon Kamaage"),
        t("ゆでたてのうどんを温かいつゆにつけて食べます。", "Freshly boiled udon served with a warm dipping sauce.", "现煮乌冬面，蘸温热酱汁食用。",
          "갓 삶은 우동을 따뜻한 쯔유에 찍어 먹습니다.", "Mì udon vừa luộc, chấm với nước sốt ấm.", "Udon yang baru direbus, dicelupkan ke saus hangat."),
    ),
    "カレーうどん": (
        t("カレーうどん", "Curry Udon", "咖喱乌冬面", "카레 우동", "Mì udon cà ri", "Udon Kari"),
        t("カレー風味のつゆで食べるうどん。", "Udon in curry-flavored broth.", "咖喱汤底乌冬面。",
          "카레 국물 우동.", "Mì udon trong nước dùng vị cà ri.", "Udon dengan kuah rasa kari."),
    ),
}

SUBST = {"ja": ("うどん", "そば"), "en": ("Udon", "Soba"), "zh": ("乌冬面", "荞麦面"),
         "ko": ("우동", "소바"), "vi": ("udon", "soba"), "id": ("Udon", "Soba")}


def to_soba(d):
    out = {}
    for k, v in d.items():
        a, b = SUBST[k]
        out[k] = v.replace(a, b).replace(a.lower(), b.lower())
    return out


TRANSLATIONS = {
    "オアシスカレー": (
        t("オアシスカレー", "OASIS Curry", "OASIS咖喱饭", "오아시스 카레", "Cơm cà ri OASIS", "Kari OASIS"),
        t("オアシス定番のカレーライス。", "OASIS's signature curry and rice.", "OASIS招牌咖喱饭。",
          "오아시스의 대표 카레라이스.", "Cơm cà ri đặc trưng của OASIS.", "Nasi kari andalan OASIS."),
    ),
    "チキン南蛮風ライス": (
        t("チキン南蛮風ライス", "Chicken Nanban-style Rice", "南蛮风味炸鸡饭", "치킨 난반풍 라이스", "Cơm gà kiểu Nanban", "Nasi Ayam ala Nanban"),
        t("甘酢をからめた鶏の唐揚げにタルタルソースをのせたご飯。", "Rice topped with fried chicken in sweet vinegar sauce and tartar sauce.",
          "淋上甜醋汁的炸鸡配塔塔酱盖饭。", "새콤달콤한 소스를 입힌 닭튀김에 타르타르 소스를 올린 덮밥.",
          "Cơm với gà chiên sốt chua ngọt và sốt tartar.", "Nasi dengan ayam goreng saus asam manis dan saus tartar."),
    ),
    "博多ラーメン": (
        t("博多ラーメン", "Hakata Ramen", "博多拉面", "하카타 라멘", "Mì ramen Hakata", "Ramen Hakata"),
        t("豚骨スープに細麺の福岡名物ラーメン。", "Fukuoka's famous ramen: thin noodles in rich pork-bone broth.",
          "福冈名产，浓郁猪骨汤配细面。", "진한 돼지뼈 육수에 가는 면을 넣은 후쿠오카 명물 라멘.",
          "Món ramen nổi tiếng của Fukuoka: sợi mì mảnh trong nước dùng xương lợn.", "Ramen khas Fukuoka: mi tipis dalam kuah tulang babi yang kental."),
    ),
    "醤油ラーメン": (
        t("醤油ラーメン", "Shoyu (Soy Sauce) Ramen", "酱油拉面", "쇼유(간장) 라멘", "Mì ramen xì dầu", "Ramen Shoyu (Kecap Asin)"),
        t("醤油ベースのすっきりしたスープのラーメン。", "Ramen in a light soy-sauce-based broth.", "清爽酱油汤底拉面。",
          "깔끔한 간장 베이스 국물의 라멘.", "Ramen với nước dùng nền xì dầu thanh nhẹ.", "Ramen dengan kuah berbahan dasar kecap asin yang ringan."),
    ),
    "唐揚げ味噌ラーメン": (
        t("唐揚げ味噌ラーメン", "Miso Ramen with Karaage", "日式炸鸡味噌拉面", "가라아게 미소 라멘", "Mì ramen miso gà chiên Karaage", "Ramen Miso dengan Karaage"),
        t("味噌スープのラーメンに鶏の唐揚げをトッピング。", "Miso ramen topped with Japanese fried chicken (karaage).",
          "味噌拉面配日式炸鸡块。", "미소 라멘에 닭튀김(가라아게)을 올렸습니다.",
          "Ramen miso kèm gà chiên kiểu Nhật (karaage).", "Ramen miso dengan topping ayam goreng Jepang (karaage)."),
    ),
    **UDON,
    **{k.replace("うどん", "そば"): (to_soba(n), to_soba(d)) for k, (n, d) in UDON.items()},
}
# 「そば」単品は説明をそば粉向けに上書き
TRANSLATIONS["そば"] = (
    t("そば", "Soba (Buckwheat Noodles)", "荞麦面", "소바(메밀국수)", "Mì soba (kiều mạch)", "Soba (Mi Gandum Kuda)"),
    t("温かいつゆのシンプルなそば。", "Simple buckwheat soba noodles in hot broth.", "简单的清汤荞麦面。",
      "따뜻한 국물의 기본 소바.", "Mì soba kiều mạch đơn giản trong nước dùng nóng.", "Soba sederhana dengan kuah panas."),
)

SETTINGS = {
    "hero_title": "OASIS",
    "hero_image": "",
    "hero_sub": t(
        "福岡工業大学 学生食堂「オアシス」のメニューとアレルギー情報",
        "Menu and allergy information for OASIS, the student cafeteria at Fukuoka Institute of Technology",
        "福冈工业大学学生食堂「OASIS」的菜单与过敏原信息",
        "후쿠오카공업대학 학생식당 「OASIS」의 메뉴 및 알레르기 정보",
        "Thực đơn và thông tin dị ứng của nhà ăn sinh viên OASIS, Đại học Công nghiệp Fukuoka",
        "Menu dan informasi alergi kantin mahasiswa OASIS, Fukuoka Institute of Technology",
    ),
    "notice": t(
        "メニューの写真は順次掲載していきます。",
        "Menu photos will be added gradually.",
        "菜单照片将陆续上传。",
        "메뉴 사진은 순차적으로 게재할 예정입니다.",
        "Ảnh món ăn sẽ được cập nhật dần.",
        "Foto menu akan ditambahkan secara bertahap.",
    ),
    "hours": t("", "", "", "", "", ""),
    "disclaimer": t(
        "当店は大量調理のため、アレルギー対応が確実ではありません。アレルギー表は目安としてご覧ください。ご了承のほどよろしくお願いいたします。",
        "Because our food is prepared in large quantities, we cannot guarantee allergen control. Please use this allergy chart as a guide only.",
        "本店为大量烹调，无法确保完全对应过敏原。过敏原表仅供参考，敬请谅解。",
        "당점은 대량 조리를 하기 때문에 알레르기 대응을 보장할 수 없습니다. 알레르기 표는 참고용으로 봐 주십시오.",
        "Do nấu ăn với số lượng lớn, chúng tôi không thể đảm bảo hoàn toàn về chất gây dị ứng. Vui lòng chỉ xem bảng dị ứng như thông tin tham khảo.",
        "Karena makanan dimasak dalam jumlah besar, kami tidak dapat menjamin penanganan alergen. Mohon gunakan tabel alergi ini hanya sebagai panduan.",
    ),
}


def category_of(name):
    if "ラーメン" in name:
        return "ramen"
    if "うどん" in name:
        return "udon"
    if "そば" in name:
        return "soba"
    return "rice"


def read_items(path):
    ws = openpyxl.load_workbook(path, data_only=True).worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    header_idx = next(i for i, r in enumerate(rows) if "商品名" in [str(c).strip() if c else "" for c in r])
    header = [str(c).strip() if c else "" for c in rows[header_idx]]
    name_col = header.index("商品名")
    cols = {i: HEADER_TO_KEY[h] for i, h in enumerate(header) if h in HEADER_TO_KEY}

    items = []
    for r in rows[header_idx + 1:]:
        name = str(r[name_col]).strip() if r[name_col] else ""
        if not name:
            continue
        allergens = {k: MARK[str(r[i]).strip()] for i, k in cols.items() if r[i] and str(r[i]).strip() in MARK}
        if not allergens and not any(r[i] for i in cols):
            break  # 表の下の注記に到達
        names, descs = TRANSLATIONS.get(name, ({"ja": name}, {}))
        items.append({
            "id": str(uuid.uuid5(uuid.NAMESPACE_URL, "oasis-menu/" + name)),
            "sort_order": len(items) + 1,
            "category": category_of(name),
            "name": names,
            "description": descs,
            "price": None,
            "image_url": "",
            "allergens": allergens,
            "is_visible": True,
            "is_sold_out": False,
        })
    return items


def sql_str(v):
    return "'" + str(v).replace("'", "''") + "'"


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else str(Path.home() / "Downloads/オアシス　アレルギー一覧　202610.xlsx")
    items = read_items(src)

    (ROOT / "data").mkdir(exist_ok=True)
    (ROOT / "data/seed.json").write_text(
        json.dumps({"items": items, "settings": SETTINGS}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = ["-- tools/excel_to_seed.py で生成。schema.sql の実行後に実行してください。", ""]
    for it in items:
        lines.append(
            "insert into public.menu_items (id, sort_order, category, name, description, price, image_url, allergens, is_visible, is_sold_out) values ("
            f"{sql_str(it['id'])}, {it['sort_order']}, {sql_str(it['category'])}, "
            f"{sql_str(json.dumps(it['name'], ensure_ascii=False))}::jsonb, "
            f"{sql_str(json.dumps(it['description'], ensure_ascii=False))}::jsonb, null, '', "
            f"{sql_str(json.dumps(it['allergens'], ensure_ascii=False))}::jsonb, true, false) on conflict (id) do nothing;")
    lines.append("")
    for k, v in SETTINGS.items():
        lines.append(f"insert into public.site_settings (key, value) values ({sql_str(k)}, "
                     f"{sql_str(json.dumps(v, ensure_ascii=False))}::jsonb) on conflict (key) do nothing;")
    (ROOT / "supabase").mkdir(exist_ok=True)
    (ROOT / "supabase/seed.sql").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(items)} items → data/seed.json, supabase/seed.sql")


if __name__ == "__main__":
    main()
