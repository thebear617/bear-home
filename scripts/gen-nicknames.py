#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 lol-heroes.js 读取真实英雄 id，生成合法且 key 有效的外号表 lol-nicknames.js。
外号来源：英雄联盟常见中文简称/昵称。
仅收录有效 id 对应的外号，笔误/无效 key 会被自动丢弃。
"""
import json
import re
import os

# 主流英雄外号（key 为英雄英文 alias，务必与 lol-heroes.js 的 id 一致）
NICK = {
    # ── 法师 ──
    "annie": ["安妮", "小熊"],
    "brand": ["火男", "布兰德"],
    "ziggs": ["炸弹人", "吉格斯"],
    "malzahar": ["蚂蚱", "玛尔扎哈"],
    "hwei": ["彗", "绘"],
    "karthus": ["死歌", "卡尔萨斯"],
    "aurora": ["阿萝拉", "鹿"],
    "leblanc": ["妖姬", "乐芙兰"],
    "syndra": ["辛德拉", "球女"],
    "zoe": ["佐伊", "欢乐女神"],
    "mel": ["梅尔"],
    "ryze": ["瑞兹", "光头", "流浪"],
    "vladimir": ["吸血鬼", "弗拉基米尔"],
    "lissandra": ["冰女", "丽桑卓"],
    "anivia": ["冰鸟", "艾尼维亚"],
    "orianna": ["发条", "奥莉安娜"],
    "lux": ["光辉", "拉克丝", "光女"],
    "xerath": ["泽拉斯", "三炮"],
    "veigar": ["小法", "维迦"],
    "ahri": ["狐狸", "阿狸"],
    "cassiopeia": ["蛇女", "卡西奥佩娅"],
    "swain": ["乌鸦", "斯维因"],
    "velkoz": ["大眼", "维克兹"],
    "taliyah": ["岩雀", "塔莉垭"],
    "azir": ["沙皇", "阿兹尔"],
    "viktor": ["维克托", "三只手", "机械先驱"],
    "zyra": ["婕拉", "植物"],
    "nidalee": ["豹女", "奈德丽"],
    "lulu": ["露露", "璐璐"],
    "karma": ["卡尔玛", "扇子妈"],
    "morgana": ["莫甘娜", "堕落天使"],
    "sona": ["琴女", "娑娜"],
    "seraphine": ["萨勒芬妮", "歌姬"],
    "vex": ["薇古丝", "忧郁"],
    "sylas": ["塞拉斯", "偷男", "偷哥"],
    "neeko": ["妮蔻", "可可"],
    "heimerdinger": ["大头", "黑默丁格", "发明家"],
    "zilean": ["时光", "基兰", "时光老头"],
    "galio": ["加里奥", "石像鬼", "正义巨像"],
    "kennen": ["凯南", "电耗子"],
    # ── 刺客 ──
    "fizz": ["小鱼人", "菲兹", "鱼人"],
    "ekko": ["艾克", "时间刺客"],
    "akali": ["阿卡丽"],
    "kassadin": ["卡萨丁", "虚空行者"],
    "katarina": ["卡特", "卡特琳娜"],
    "diana": ["皎月", "黛安娜"],
    "evelynn": ["寡妇", "伊芙琳", "寡妇制造者"],
    "qiyana": ["琪亚娜"],
    "talon": ["男刀", "泰隆", "刀锋之影"],
    "zed": ["劫"],
    "kayn": ["凯隐"],
    "leesin": ["盲僧", "李青", "瞎子"],
    "khazix": ["螳螂", "卡兹克"],
    "rengar": ["狮子狗", "雷恩加尔"],
    "nocturne": ["梦魇", "魔腾"],
    "vi": ["蔚", "皮城执法官"],
    # ── 战士 ──
    "sett": ["瑟提", "腕豪", "豪"],
    "garen": ["盖伦", "德玛西亚之力", "德玛西亚"],
    "darius": ["诺手", "德莱厄斯", "诺克萨斯之手"],
    "aatrox": ["剑魔", "亚托克斯"],
    "yasuo": ["亚索", "快乐风男", "疾风剑豪"],
    "yone": ["永恩"],
    "tryndamere": ["蛮王", "泰达米尔", "蛮子"],
    "masteryi": ["剑圣", "易大师", "无极剑圣"],
    "riven": ["锐雯", "瑞雯"],
    "fiora": ["剑姬", "菲奥娜", "无双剑姬"],
    "irelia": ["刀妹", "艾瑞莉娅", "刀锋舞者"],
    "camille": ["青钢影", "卡蜜尔"],
    "jayce": ["杰斯", "未来守护者"],
    "graves": ["男枪", "格雷福斯"],
    "renekton": ["鳄鱼", "雷克顿"],
    "nasus": ["狗头", "内瑟斯", "沙漠死神"],
    "olaf": ["奥拉夫", "狂战士"],
    "sion": ["塞恩", "亡灵战神"],
    "drmundo": ["蒙多", "蒙多医生", "祖安狂人"],
    "maokai": ["大树", "茂凯"],
    "malphite": ["石头人", "墨菲特"],
    "rammus": ["龙龟", "拉莫斯"],
    "sejuani": ["猪妹", "瑟庄妮"],
    "shyvana": ["龙女", "希瓦娜"],
    "singed": ["炼金", "辛吉德"],
    "trundle": ["巨魔", "特朗德尔"],
    "volibear": ["狗熊", "沃利贝尔", "熊"],
    "warwick": ["狼人", "沃里克"],
    "nunu": ["雪人", "努努"],
    "poppy": ["波比"],
    # ── 坦克 ──
    "taric": ["宝石", "塔里克", "宝石骑士"],
    "braum": ["布隆"],
    "leona": ["蕾欧娜", "曙光女神", "日女"],
    "nautilus": ["泰坦", "诺提勒斯", "深海泰坦"],
    "thresh": ["锤石", "魂锁典狱长"],
    "blitzcrank": ["机器人", "布里茨"],
    "rakan": ["洛", "羽毛"],
    "bard": ["巴德", "琴师"],
    "rell": ["芮尔"],
    "renata": ["烈娜塔", "炼金男爵"],
    "alistar": ["牛头", "阿利斯塔"],
    "chogath": ["大虫子", "科加斯"],
    # ── 辅助 ──
    "soraka": ["星妈", "索拉卡"],
    "janna": ["风女", "迦娜"],
    "nami": ["娜美"],
    "senna": ["赛娜"],
    "yuumi": ["悠米", "猫"],
    "milio": ["米利欧", "奶"],
    "lulu2": ["露露"],
    # ── 射手 ──
    "twitch": ["老鼠", "图奇"],
    "kogmaw": ["大嘴", "克格莫"],
    "caitlyn": ["女警", "凯特琳", "皮城女警"],
    "jhin": ["烬", "戏命师"],
    "jinx": ["金克丝", "疯女"],
    "missfortune": ["好运姐", "赏金猎人", "女枪"],
    "ashe": ["艾希", "寒冰射手", "寒冰"],
    "lucian": ["卢锡安", "圣枪游侠", "奥巴马"],
    "tristana": ["小炮", "崔丝塔娜"],
    "draven": ["德莱文"],
    "vayne": ["薇恩", "暗夜猎手"],
    "kalista": ["卡莉丝塔", "滑板鞋"],
    "varus": ["韦鲁斯", "维鲁斯"],
    "sivir": ["轮子妈", "希维尔"],
    "ezreal": ["伊泽瑞尔", "EZ", "探险家"],
    "xayah": ["霞", "凤凰"],
    "kaisa": ["卡莎"],
    "samira": ["莎弥拉"],
    "zeri": ["泽丽"],
    "aphelios": ["厄斐琉斯", "无E凡"],
    "nilah": ["尼菈"],
    "briar": ["贝蕾亚", "断头饭"],
    "smolder": ["斯莫德", "龙"],
    "ambessa": ["安蓓萨", "安柏莎"],
    # ── 其他 ──
    "ivern": ["翠神", "艾翁"],
    "aurelionsol": ["龙王", "奥瑞利安·索尔", "星灵"],
    "gnar": ["纳尔"],
    "kindred": ["千珏", "双生"],
    "kayle": ["凯尔", "审判天使", "天使"],
    "reksai": ["雷克塞", "挖掘机", "钻地"],
    "urgot": ["厄加特", "螃蟹", "海兽祭司"],
    "illaoi": ["触手妈", "俄洛伊"],
    "yorick": ["掘墓", "约里克", "牧魂人"],
    "mordekaiser": ["铁男", "莫德凯撒"],
    "gangplank": ["船长", "普朗克"],
    "hecarim": ["人马", "赫卡里姆"],
    "jarvaniv": ["皇子", "嘉文四世", "嘉文"],
    "xinzhao": ["赵信", "菊花信", "德邦总管"],
    "pantheon": ["潘森", "战争之王"],
    "skarner": ["蝎子", "斯卡纳"],
    "elise": ["蜘蛛", "伊莉丝"],
    "monkeyking": ["悟空", "猴子", "齐天大圣"],
    "belveth": ["贝蕾亚", "虚空之女", "贝尓薇思"],
    "naafiri": ["纳菲芮", "狗"],
    "ksante": ["奎桑提"],
    "zaahen": ["扎恩"],
    "locke": ["洛克"],
    "viego": ["佛耶戈", "破败之王"],
    # ── 补全漏掉的主流外号 ──
    "twistedfate": ["卡牌", "崔斯特", "卡牌大师"],
    "fiddlesticks": ["稻草人", "费德提克"],
    "teemo": ["提莫", "提莫队长", "蘑菇精"],
    "jax": ["武器", "贾克斯", "武器大师"],
    "amumu": ["木木", "阿木木", "哭哭"],
    "shaco": ["小丑", "萨科"],
    "corki": ["飞机", "库奇"],
    "rumble": ["兰博", "烧烤"],
    "udyr": ["乌迪尔", "野兽"],
    "gragas": ["酒桶", "古拉加斯"],
    "shen": ["慎", "暮光之眼"],
    "quinn": ["奎因", "鹰"],
    "zac": ["扎克", "橡胶人"],
    "akshan": ["阿克尚", "摆渡人"],
    "tahmkench": ["塔姆", "河流之王", "舔"],
    "kled": ["克烈", "暴怒骑士"],
    "ornn": ["奥恩", "山隐之焰", "铁匠"],
    "pyke": ["派克", "血港鬼影", "水鬼"],
    "yunara": ["芸阿娜", "花女"],
    "lillia": ["莉莉娅", "鹿女"],
    "gwen": ["格温", "裁缝"],
}


def main():
    from pypinyin import lazy_pinyin, Style

    base = os.path.dirname(__file__)
    src_data = os.path.abspath(os.path.join(base, "..", "src", "data"))
    # 读取真实英雄 id
    heroes_src = open(os.path.join(src_data, "lol-heroes.js")).read()
    m = re.search(r"export const lolHeroes = (\[.*?\]);", heroes_src, re.S)
    heroes = json.loads(m.group(1))
    valid_ids = {h["id"] for h in heroes}

    # 只保留有效 id 的外号，丢弃笔误/无效 key
    clean = {}
    skipped = []
    for k, v in NICK.items():
        if k in valid_ids:
            clean[k] = v
        else:
            skipped.append(k)

    # 为每个英雄生成拼音（全拼 + 首字母），基于英雄中文名
    pinyin = {}
    for h in heroes:
        name = h["name"]
        # 全拼：连写小写；首字母：每字首字母小写
        full = "".join(lazy_pinyin(name, style=Style.NORMAL)).lower()
        initial = "".join(lazy_pinyin(name, style=Style.FIRST_LETTER)).lower()
        pinyin[h["id"]] = [full, initial]

    # 生成 JS（JSON 格式保证语法正确）
    out = f"""// AUTO-GENERATED by scripts/gen-nicknames.py
// 英雄外号表：key 与 lol-heroes.js 的 id(英文 alias) 严格对应
// 用于英雄速查搜索框：输入中文简称/昵称/英文名均可匹配
export const lolNicknames = {json.dumps(clean, ensure_ascii=False, indent=1)};

// 英雄拼音（全拼 + 首字母）：用于拼音搜索
export const lolPinyin = {json.dumps(pinyin, ensure_ascii=False, indent=1)};
"""
    path = os.path.join(src_data, "lol-nicknames.js")
    with open(path, "w", encoding="utf-8") as f:
        f.write(out)
    print(f"✅ 生成 {path}，共 {len(clean)} 个英雄外号 + {len(pinyin)} 个拼音")
    print(f"跳过无效 key: {skipped}")
    print(f"英雄总数 {len(heroes)}，有外号的 {len(clean)}，暂无外号 {len(heroes) - len(clean)}")


if __name__ == "__main__":
    main()
