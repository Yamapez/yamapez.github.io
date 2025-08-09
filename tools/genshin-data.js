// Genshin Impact 聖遺物スコア計算機 - 詳細データファイル

// より詳細なキャラクター名マッピング
const CHARACTER_NAMES = {
    '10000002': 'カミサト アヤカ',
    '10000003': 'ジン',
    '10000005': '旅人（風）',
    '10000006': 'リサ',
    '10000007': '旅人（岩）',
    '10000014': 'バーバラ',
    '10000015': 'カエデハラ カズハ',
    '10000016': 'ディルック',
    '10000020': 'レザー',
    '10000021': 'アンバー',
    '10000022': 'ベネット',
    '10000023': 'フィッシュル',
    '10000024': 'ノエル',
    '10000025': 'ナヒーダ',
    '10000026': 'ショウ',
    '10000027': 'ニィロウ',
    '10000029': 'ウェンティ',
    '10000030': 'ジョンリ',
    '10000031': 'フィッシュル',
    '10000032': 'ベネット',
    '10000033': 'タルタリア',
    '10000034': 'ノエル',
    '10000035': 'チーチー',
    '10000036': 'チョンユン',
    '10000037': 'ガニュウ',
    '10000038': 'アルベド',
    '10000039': 'モナ',
    '10000041': 'モナ',
    '10000042': 'ケーヤ',
    '10000043': 'スクロース',
    '10000044': 'ジンユン',
    '10000045': 'ロサリア',
    '10000046': 'フータオ',
    '10000047': 'カズハ',
    '10000048': 'やんふぇい',
    '10000049': 'エウルア',
    '10000050': 'ショウ',
    '10000051': 'エウルア',
    '10000052': 'ココミ',
    '10000053': '五郎',
    '10000054': 'イッコウ',
    '10000055': 'ヨウ',
    '10000056': 'シェンへ',
    '10000057': 'イッコウ',
    '10000058': 'ヨウ',
    '10000059': 'へイゾウ',
    '10000060': 'イーラン',
    '10000062': 'アリサ',
    '10000063': 'ティナリ',
    '10000064': 'コライ',
    '10000065': 'ドーリー',
    '10000066': 'キャンディス',
    '10000067': 'サイノ',
    '10000068': 'ニィロウ',
    '10000069': 'ナヒーダ',
    '10000070': 'レイラ',
    '10000071': 'ワンダラー',
    '10000072': 'ファルザン',
    '10000073': 'やえ神子',
    '10000074': 'アルハイゼン',
    '10000075': 'ミカ',
    '10000076': 'バイツー',
    '10000077': 'カーヴェ',
    '10000078': 'リネ',
    '10000079': 'リオセスリ',
    '10000080': 'ノイヴィレット',
    '10000081': 'リネット',
    '10000082': 'フリーナ',
    '10000083': 'ベフスト',
    '10000084': 'ナヴィア',
    '10000085': 'シェヴルーズ',
    '10000086': 'ガミング',
    '10000087': 'シオリ',
    '10000088': 'アルレッキーノ'
};

// キャラクター別の推奨ステータス重み
const CHARACTER_STAT_WEIGHTS = {
    // DPSキャラクター
    'DPS': {
        'FIGHT_PROP_CRITICAL': 2,
        'FIGHT_PROP_CRITICAL_HURT': 1,
        'FIGHT_PROP_ATTACK_PERCENT': 0.75,
        'FIGHT_PROP_ELEMENT_MASTERY': 0.25,
        'FIGHT_PROP_CHARGE_EFFICIENCY': 0.5
    },
    // サポートキャラクター
    'SUPPORT': {
        'FIGHT_PROP_HP_PERCENT': 0.75,
        'FIGHT_PROP_DEFENSE_PERCENT': 0.5,
        'FIGHT_PROP_CHARGE_EFFICIENCY': 1,
        'FIGHT_PROP_ELEMENT_MASTERY': 0.5,
        'FIGHT_PROP_HEAL_ADD': 0.75
    },
    // 元素熟知キャラクター
    'EM': {
        'FIGHT_PROP_ELEMENT_MASTERY': 1,
        'FIGHT_PROP_CHARGE_EFFICIENCY': 0.75,
        'FIGHT_PROP_HP_PERCENT': 0.5,
        'FIGHT_PROP_ATTACK_PERCENT': 0.25
    },
    // HPベースキャラクター
    'HP': {
        'FIGHT_PROP_HP_PERCENT': 1,
        'FIGHT_PROP_CRITICAL': 1.5,
        'FIGHT_PROP_CRITICAL_HURT': 0.75,
        'FIGHT_PROP_CHARGE_EFFICIENCY': 0.75
    },
    // 防御力ベースキャラクター
    'DEF': {
        'FIGHT_PROP_DEFENSE_PERCENT': 1,
        'FIGHT_PROP_CRITICAL': 1.5,
        'FIGHT_PROP_CRITICAL_HURT': 0.75,
        'FIGHT_PROP_CHARGE_EFFICIENCY': 0.75
    }
};

// キャラクター別の役割分類
const CHARACTER_ROLES = {
    '10000002': 'DPS',    // アヤカ
    '10000003': 'SUPPORT', // ジン
    '10000014': 'SUPPORT', // バーバラ
    '10000015': 'SUPPORT', // カズハ
    '10000016': 'DPS',    // ディルック
    '10000020': 'DPS',    // レザー
    '10000021': 'SUPPORT', // アンバー
    '10000022': 'SUPPORT', // ベネット
    '10000023': 'DPS',    // フィッシュル
    '10000024': 'DEF',    // ノエル
    '10000025': 'EM',     // ナヒーダ
    '10000029': 'SUPPORT', // ウェンティ
    '10000030': 'SUPPORT', // ジョンリ
    '10000033': 'DPS',    // タルタリア
    '10000035': 'SUPPORT', // チーチー
    '10000037': 'DPS',    // ガニュウ
    '10000038': 'DEF',    // アルベド
    '10000039': 'SUPPORT', // モナ
    '10000042': 'DPS',    // ケーヤ
    '10000043': 'EM',     // スクロース
    '10000046': 'HP',     // フータオ
    '10000049': 'DPS',    // エウルア
    '10000052': 'HP',     // ココミ
    '10000053': 'DEF',    // 五郎
    '10000063': 'EM',     // ティナリ
    '10000067': 'EM',     // サイノ
    '10000068': 'HP',     // ニィロウ
    '10000069': 'EM',     // ナヒーダ
    '10000073': 'DPS',    // やえ神子
    '10000074': 'EM',     // アルハイゼン
    '10000080': 'HP',     // ノイヴィレット
    '10000082': 'HP',     // フリーナ
    '10000088': 'DPS'     // アルレッキーノ
};

// 聖遺物セット情報
const ARTIFACT_SETS = {
    '15001': { name: '剣闘士のフィナーレ', type: 'DPS' },
    '15002': { name: '楽団の朝食', type: 'EM' },
    '15003': { name: '守護の心', type: 'SUPPORT' },
    '15004': { name: '雷の怒り', type: 'DPS' },
    '15005': { name: '炎の魔女', type: 'DPS' },
    '15006': { name: '愛される少女', type: 'SUPPORT' },
    '15007': { name: '氷風を彷徨う勇士', type: 'DPS' },
    '15008': { name: '沈淪の心', type: 'DPS' },
    '15009': { name: '古の岩', type: 'DPS' },
    '15010': { name: '逆飛びの流星', type: 'DPS' },
    '15011': { name: '烈火を渡る賢者', type: 'EM' },
    '15012': { name: '雪中の銀杏', type: 'DPS' },
    '15013': { name: '如雷の怒り', type: 'DPS' },
    '15014': { name: '絶縁の旗印', type: 'SUPPORT' },
    '15015': { name: '追憶のしめ縄', type: 'DPS' },
    '15016': { name: '翠緑の影', type: 'EM' },
    '15017': { name: '海染硨磲', type: 'HP' },
    '15018': { name: '華館夢醒形骸記', type: 'DEF' },
    '15019': { name: '辰砂往生録', type: 'HP' },
    '15020': { name: '深林の記憶', type: 'EM' },
    '15021': { name: '金メッキの夢', type: 'EM' },
    '15022': { name: '砂上の楼閣の史話', type: 'EM' },
    '15023': { name: '楽園の絶花', type: 'HP' },
    '15024': { name: '砂漠のパヴィリオンの記録', type: 'DPS' },
    '15025': { name: '花海甘露の光', type: 'HP' },
    '15026': { name: '来歆の余響', type: 'DPS' },
    '15027': { name: '水仙の夢', type: 'HP' },
    '15028': { name: '黄金の劇団', type: 'EM' }
};

// 高度なスコア計算関数
function calculateAdvancedArtifactScore(equipment, characterId = null) {
    let score = 0;
    const flat = equipment.flat;
    
    // キャラクター固有の重みを取得
    const characterRole = CHARACTER_ROLES[characterId] || 'DPS';
    const weights = CHARACTER_STAT_WEIGHTS[characterRole];
    
    if (flat.reliquarySubstats) {
        flat.reliquarySubstats.forEach(substat => {
            const propId = substat.appendPropId;
            const value = substat.statValue || 0;
            let weight = weights[propId] || SCORE_WEIGHTS[propId] || 0;
            
            // ロールに応じた追加ボーナス
            if (characterRole === 'EM' && propId === 'FIGHT_PROP_ELEMENT_MASTERY') {
                weight *= 1.5;
            } else if (characterRole === 'HP' && propId === 'FIGHT_PROP_HP_PERCENT') {
                weight *= 1.3;
            } else if (characterRole === 'DEF' && propId === 'FIGHT_PROP_DEFENSE_PERCENT') {
                weight *= 1.3;
            }
            
            if (propId.includes('PERCENT') || propId === 'FIGHT_PROP_CRITICAL' || propId === 'FIGHT_PROP_CRITICAL_HURT') {
                score += (value * 100) * weight;
            } else {
                score += value * weight;
            }
        });
    }
    
    return score;
}

// スコアの評価ランク
function getScoreRank(score) {
    if (score >= 40) return { rank: 'SS', color: '#ff6b6b', description: '伝説級' };
    if (score >= 35) return { rank: 'S', color: '#feca57', description: '完璧' };
    if (score >= 30) return { rank: 'A', color: '#48dbfb', description: '優秀' };
    if (score >= 25) return { rank: 'B', color: '#0abde3', description: '良好' };
    if (score >= 20) return { rank: 'C', color: '#006ba6', description: '平均' };
    return { rank: 'D', color: '#95a5a6', description: '要改善' };
}

// セット効果のボーナス計算
function calculateSetBonus(equipList) {
    const setCounts = {};
    const setBonuses = [];
    
    if (!equipList) return setBonuses;
    
    equipList.forEach(equipment => {
        if (equipment.flat && equipment.flat.itemType === 'ITEM_RELIQUARY') {
            const setId = equipment.flat.setNameTextMapHash;
            if (setId) {
                setCounts[setId] = (setCounts[setId] || 0) + 1;
            }
        }
    });
    
    Object.entries(setCounts).forEach(([setId, count]) => {
        const setInfo = ARTIFACT_SETS[setId];
        if (setInfo && count >= 2) {
            setBonuses.push({
                name: setInfo.name,
                pieces: count,
                bonus: count >= 4 ? '4セット効果' : '2セット効果'
            });
        }
    });
    
    return setBonuses;
}

// 推奨改善点の提案
function getImprovementSuggestions(artifacts, characterId) {
    const suggestions = [];
    const characterRole = CHARACTER_ROLES[characterId] || 'DPS';
    
    artifacts.forEach((artifact, index) => {
        const score = calculateAdvancedArtifactScore(artifact, characterId);
        const rank = getScoreRank(score);
        
        if (rank.rank === 'D' || rank.rank === 'C') {
            const artifactType = ARTIFACT_TYPES[artifact.flat.equipType];
            suggestions.push({
                type: 'low_score',
                message: `${artifactType}のスコアが低いです（${score.toFixed(1)}点）。より良いサブステータスの聖遺物を探しましょう。`,
                priority: rank.rank === 'D' ? 'high' : 'medium'
            });
        }
    });
    
    // キャラクター固有の推奨事項
    const roleAdvice = {
        'DPS': '会心率と会心ダメージのバランスを重視しましょう。理想比率は1:2です。',
        'SUPPORT': '元素チャージ効率を優先し、必要に応じてHPや防御力を強化しましょう。',
        'EM': '元素熟知を最優先し、サブステータスでも元素熟知を狙いましょう。',
        'HP': 'HP%をメインステータスとサブステータスで重視しましょう。',
        'DEF': '防御力%を重視し、会心系ステータスでダメージを補強しましょう。'
    };
    
    suggestions.push({
        type: 'role_advice',
        message: roleAdvice[characterRole],
        priority: 'info'
    });
    
    return suggestions;
}

// エクスポート（ブラウザ環境での使用のため）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CHARACTER_NAMES,
        CHARACTER_STAT_WEIGHTS,
        CHARACTER_ROLES,
        ARTIFACT_SETS,
        calculateAdvancedArtifactScore,
        getScoreRank,
        calculateSetBonus,
        getImprovementSuggestions
    };
}
