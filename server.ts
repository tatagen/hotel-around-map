/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { Spot, SystemStats } from './src/types';

// Default sample hotel coordinates (placeholder location for the demo)
const DEFAULT_HOTEL = {
  name: 'サンプルホテル',
  latitude: 35.0000,
  longitude: 135.0000,
};

const DATA_DIR = path.join(process.cwd(), 'data');
const SPOTS_FILE = path.join(DATA_DIR, 'spots.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');
const HOTEL_FILE = path.join(DATA_DIR, 'hotel.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure files exist with seeds
if (!fs.existsSync(HOTEL_FILE)) {
  fs.writeFileSync(HOTEL_FILE, JSON.stringify(DEFAULT_HOTEL, null, 2));
}

const SEED_SPOTS: Spot[] = [
  {
    id: 'spot-sample-1',
    type: 'sightseeing',
    source: 'hotel_master',
    name: {
      ja: '城跡ロープウェイ商店街',
      en: 'Castle Ropeway Shopping Street',
      zh_cn: '城址缆车商店街',
      zh_tw: '城址纜車商店街',
      ko: '성터 로프웨이 상점가'
    },
    description: {
      ja: 'ホテルのすぐ側に広がる、城跡の山頂へと続く美しい並木道です。地元産フルーツジュースのスタンド、銘菓の老舗、タオルなど特産品の直営店、モダンなお洒落カフェや骨董品店などがずらりと並んでおり、歩くだけで地域の文化と情緒を満喫できます。',
      en: 'A scenic boardwalk extending just steps from the hotel entrance, leading up to the castle ropeway station. The street is lined with elegant boutiques, fresh fruit juice stands, traditional confectioners, and local craft shops.',
      zh_cn: '紧邻酒店的一条景观步行街，直通城址索道站。街道两旁鳞次栉比地开满了高雅精品店、鲜果汁特色店、传统糕点名铺以及本地工艺品店，极富散步和购物乐趣。',
      zh_tw: '緊鄰酒店的一條景觀步行街，直通城址索道站。街道兩旁鱗次櫛比地開滿了高雅精品店、鮮果汁特色店、傳統糕點名鋪以及本地工藝品店，極富散步和購物樂趣。',
      ko: '호텔 바로 옆에 펼쳐져 성터 로프웨이 승강장까지 이어지는 정취 있는 산책로입니다. 지역 특산 과일 주스 스탠드, 전통 과자 전문점, 지역 공예품 숍, 모던한 카페들이 늘어서 있어 걷는 것만으로도 즐거움을 선사합니다.'
    },
    latitude: 34.9997,
    longitude: 135.0006, // approx 60m
    tags: ['#スタッフ厳選', '#徒歩5分以内', '#ご当地グルメ'],
    image_urls: ['https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&auto=format&fit=crop'],
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'spot-sample-2',
    type: 'sightseeing',
    source: 'hotel_master',
    name: {
      ja: '温泉本館',
      en: 'Historic Onsen Bathhouse',
      zh_cn: '温泉本馆',
      zh_tw: '溫泉本館',
      ko: '온천 본관'
    },
    description: {
      ja: '長い歴史を誇る由緒ある温泉であり、壮麗な3階建ての城郭風木造建築です。文学作品や映画のモデルとして名高く、大改修を終えて古き佳き時代の贅沢な佇まいが蘇りました。とろりとした美肌の湯を心ゆくまでご堪能ください。',
      en: 'A magnificent castle-like wooden bathhouse complex with centuries of history. A celebrated cultural landmark, its legendary alkaline waters soothe tired muscles and leave the skin silky smooth.',
      zh_cn: '拥有悠久历史的名汤，整座建筑是一栋壮丽的日本城堡风三层木质楼阁。这里也是众多文学名著的灵感之地，滑爽的碱性泉质具有极佳的美肌功效。',
      zh_tw: '擁有悠久歷史的名湯，整座建築是一棟壯麗的日本城堡風三層木質樓閣。這裡也是眾多文學名著的靈感之地，滑爽的鹼性泉質具有極佳的美肌功效。',
      ko: '오랜 역사를 품은 유서 깊은 온천이자, 장엄한 3층 규모의 성곽풍 전통 목조건축물입니다. 문학 작품과 영화의 배경 모델로도 유명하며, 대대적인 복원 공사를 마치고 한층 우아한 자태로 미끄러운 미인탕의 온천수를 제공합니다.'
    },
    latitude: 35.0000,
    longitude: 135.0153, // easy tram access
    tags: ['#スタッフ厳選', '#和モダン', '#名湯温泉'],
    image_urls: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop'],
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'spot-sample-3',
    type: 'restaurant',
    source: 'hotel_master',
    name: {
      ja: '郷土料理 サンプル亭 本店',
      en: 'Sample-tei Local Cuisine',
      zh_cn: '乡土料理 样品亭 本店',
      zh_tw: '鄉土料理 樣品亭 本店',
      ko: '향토요리 샘플테이 본점'
    },
    description: {
      ja: '江戸時代創業、380年以上の歴史を持つ老舗郷土料理店です。地元名物の真鯛を炊き込む「鯛めし」と、生卵入りのだし醤油に真鯛の刺身を絡めてご飯にかける「刺身鯛めし」の2種を一度に楽しめます。美しく彩られた五色そうめんも一級品です。',
      en: 'An iconic local institution serving regional delicacies for over 380 years. Experience both of the area\'s signature sea bream rice dishes under one roof: the simmered savory version, and the fresh raw style dipped in a rich amber egg glaze.',
      zh_cn: '创业于江户时代、拥有380余年历史的乡土料理老铺。在这里您可以一站式体验当地两大王牌美食——热气腾腾的“鲷鱼饭”，以及用新鲜鲷鱼刺身裹上浓香生鸡蛋酱油浇于热饭之上的“刺身鲷鱼饭”。',
      zh_tw: '創業於江戶時代、擁有380餘年歷史的鄉土料理老鋪。在這裡您可以一站式體驗當地兩大王牌美食——熱氣騰騰的「鯛魚飯」，以及用新鮮鯛魚刺身裹上濃香生雞蛋醬油澆於熱飯之上的「刺身鯛魚飯」。',
      ko: '에도 시대에 창업하여 380년이 넘는 전통을 간직한 향토 요리 전문점입니다. 도미를 밥과 함께 쪄내는 고소한 "타이메시"와 신선한 참돔 회를 계란 간장 고명에 비벼 먹는 "사시미 타이메시"를 한자리에서 최고의 퀄리티로 맛볼 수 있습니다.'
    },
    latitude: 34.9986,
    longitude: 134.9949, // approx 450m
    tags: ['#スタッフ厳選', '#ご当地グルメ', '#ランチ', '#ディナー'],
    image_urls: ['https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop'],
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'spot-sample-4',
    type: 'sightseeing',
    source: 'hotel_master',
    name: {
      ja: '洋館 サンプル荘',
      en: 'Sample-so French Villa',
      zh_cn: '洋楼 样品庄',
      zh_tw: '洋樓 樣品莊',
      ko: '서양식 별관 샘플소'
    },
    description: {
      ja: '大正時代に旧藩主が別邸として建てた、地域最古にして最もエレガントな純フランス風の洋館建築です。各界の名士が集った社交場で、アンティークな暖炉、見事なステンドグラス、大正ロマンが息づく豪華な内装が魅力です。',
      en: 'Built in the Taisho era as a retreat for the local nobility, this pure French Neo-Renaissance villa stands as a sublime monument to the period\'s romantic architecture. Its interior features authentic custom stained glass windows and magnificent period fireplaces.',
      zh_cn: '建于大正时代的纯法式新文艺复兴城堡式庄园，原为旧藩主的避暑别墅。这也是当地最华美的洋楼，陈设着精工细作的水晶吊灯与绚丽无比的彩绘彩色玻璃。',
      zh_tw: '建於大正時代的純法式新文藝復興城堡式莊園，原為舊藩主的避暑別墅。這也是當地最華美的洋樓，陳設著精工細作的水晶吊燈與絢麗無比的彩繪彩色玻璃。',
      ko: '다이쇼 시대에 옛 번주가 프랑스 르네상스 양식으로 건축한 지역 최초이자 가장 우아한 서양식 양관입니다. 과거 명사들의 사교 클럽으로 쓰였으며, 고전적인 벽난로와 웅장한 스테인드글라스 등 다이쇼 로망이 깃든 인테리어가 매력입니다.'
    },
    latitude: 34.9981,
    longitude: 134.9993,
    tags: ['#スタッフ厳選', '#インスタ映え', '#雨でも安心'],
    image_urls: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop'],
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'spot-sample-5',
    type: 'sightseeing',
    source: 'hotel_master',
    name: {
      ja: '市立文学ミュージアム',
      en: 'City Literature Museum',
      zh_cn: '市立文学博物馆',
      zh_tw: '市立文學博物館',
      ko: '시립 문학 뮤지엄'
    },
    description: {
      ja: '地元が生んだ近代文学の巨匠たちと、その時代を描いた名作小説をテーマにした文学館です。著名建築家の手による「浮遊感のあるスロープ」など斬新でスタイリッシュな近代コンクリート建築デザインも必見です。',
      en: 'A gorgeous modern concrete museum dedicated to the region\'s celebrated modern writers and the epic novels that chronicled their era. The building itself, with its floating ramps and geometric forms, is a work of art.',
      zh_cn: '一座极具现代美感的清水混凝土建筑。该馆围绕本地出身的近代文豪及描绘那个时代的史诗小说展开，建筑本身悬浮式坡道的设计亦是一大亮点。',
      zh_tw: '一座極具現代美感的清水混凝土建築。該館圍繞本地出身的近代文豪及描繪那個時代的史詩小說展開，建築本身懸浮式坡道的設計亦是一大亮點。',
      ko: '세련되고 기하학적인 현대 미술관입니다. 지역 출신의 근대 문학 거장들과 그 시대를 그린 대하소설을 테마로, 부유감 있는 슬로프 등 압도적인 공간미를 담아냈습니다.'
    },
    latitude: 34.9983,
    longitude: 135.0000,
    tags: ['#スタッフ厳選', '#雨でも安心', '#和モダン'],
    image_urls: ['https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop'],
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'spot-sample-6',
    type: 'sightseeing',
    source: 'hotel_master',
    name: {
      ja: '温泉別館 サンプルの湯',
      en: 'Sample-no-Yu Premium Spa',
      zh_cn: '温泉别馆 样品之汤',
      zh_tw: '溫泉別館 樣品之湯',
      ko: '온천 별관 샘플노유'
    },
    description: {
      ja: '古代の貴人が湯治に訪れたという温泉の歴史に準じて、往時の高貴な建築様式を忠実に再現した瀟洒なプレミアム外湯です。浴室内は地域の伝統工芸（陶器のプロジェクションマッピング等）とアートで贅沢に装飾されており、五感に響く歴史体験を楽しめます。',
      en: 'A premium annex built in the noble architectural style of the ancient era, reflecting the hot spring\'s storied history. Inside, soak surrounded by state-of-the-art local craft installations, projection mapping on classic pottery tiles, and traditional tea salons.',
      zh_cn: '依据古代贵人曾到此汤治的历史典故，以往昔高雅建筑风格全新打造的高端外汤浴室。浴室内部采用了本地传统陶器与先进投影艺术的浪漫融合，带来极致享受。',
      zh_tw: '依據古代貴人曾到此湯治的歷史典故，以往昔高雅建築風格全新打造的高端外湯浴室。浴室內部採用了本地傳統陶器與先進投影藝術的浪漫融合，帶來極致享受。',
      ko: '고대 귀인들이 휴양을 위해 찾았다는 유래에 따라, 당시의 귀족적인 궁궐 양식으로 지은 최고급 별관 온천탕입니다. 내부 욕장은 지역의 대표 도자기 도판화에 펼쳐지는 환상적인 프로젝션 맵핑과 고급 미술 공예품으로 꾸며져 있습니다.'
    },
    latitude: 35.0000,
    longitude: 135.0143,
    tags: ['#スタッフ厳選', '#インスタ映え', '#和モダン'],
    image_urls: ['https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&auto=format&fit=crop'],
    status: 'active',
    created_at: new Date().toISOString()
  }
];

if (!fs.existsSync(SPOTS_FILE)) {
  fs.writeFileSync(SPOTS_FILE, JSON.stringify(SEED_SPOTS, null, 2));
}

const DEFAULT_STATS: SystemStats = {
  pvCount: 142,
  activeSpotCount: SEED_SPOTS.filter(s => s.status === 'active').length,
  activeEventCount: SEED_SPOTS.filter(s => s.status === 'active' && s.type === 'event').length,
  lastUpdated: new Date().toISOString()
};

if (!fs.existsSync(STATS_FILE)) {
  fs.writeFileSync(STATS_FILE, JSON.stringify(DEFAULT_STATS, null, 2));
}

// Haversine formula to compute distance in meters between two lat/lng pairs
function computeDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance);
}

// Convert meters to walk minutes (80m per minute)
function computeWalkMinutes(distanceMeters: number): number {
  return Math.max(1, Math.ceil(distanceMeters / 80));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Get Hotel Configuration
  function getHotelConfig() {
    try {
      return JSON.parse(fs.readFileSync(HOTEL_FILE, 'utf-8'));
    } catch (e) {
      return DEFAULT_HOTEL;
    }
  }

  // 2. Load and compute dynamic spots
  function getSpotsWithComputedValues(): Spot[] {
    try {
      const dbSpots: Spot[] = JSON.parse(fs.readFileSync(SPOTS_FILE, 'utf-8'));
      const hotel = getHotelConfig();
      
      return dbSpots.map(spot => {
        const distance = computeDistance(
          hotel.latitude,
          hotel.longitude,
          spot.latitude,
          spot.longitude
        );
        const minutes = computeWalkMinutes(distance);
        return {
          ...spot,
          distanceMeters: distance,
          walkMinutes: minutes
        };
      });
    } catch (e) {
      console.error('Error loading spots:', e);
      return [];
    }
  }

  // API: Get Hotel Config
  app.get('/api/hotel', (req, res) => {
    res.json(getHotelConfig());
  });

  // API: Update Hotel Config
  app.post('/api/hotel', (req, res) => {
    const { name, latitude, longitude } = req.body;
    if (!name || isNaN(Number(latitude)) || isNaN(Number(longitude))) {
      return res.status(400).json({ error: 'Invalid hotel data' });
    }
    const updatedHotel = {
      name: String(name),
      latitude: Number(latitude),
      longitude: Number(longitude)
    };
    fs.writeFileSync(HOTEL_FILE, JSON.stringify(updatedHotel, null, 2));
    
    // Automatically recalculate stats
    updateStatsCounts();
    
    res.json(updatedHotel);
  });

  // API: Get All Spots (augmented with dynamic distance & walk times)
  app.get('/api/spots', (req, res) => {
    const spots = getSpotsWithComputedValues();
    res.json(spots);
  });

  // Helper: Update dynamic statistical counts to stats.json
  function updateStatsCounts() {
    try {
      const stats: SystemStats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
      const spots: Spot[] = JSON.parse(fs.readFileSync(SPOTS_FILE, 'utf-8'));
      
      const activeSpots = spots.filter(s => s.status === 'active');
      stats.activeSpotCount = activeSpots.length;
      stats.activeEventCount = activeSpots.filter(s => s.type === 'event').length;
      stats.lastUpdated = new Date().toISOString();
      
      fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
    } catch (e) {
      console.error('Error updating stats file:', e);
    }
  }

  // API: Record Page View (PV)
  app.post('/api/stats/pv', (req, res) => {
    try {
      const stats: SystemStats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
      stats.pvCount += 1;
      fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
      res.json({ success: true, pvCount: stats.pvCount });
    } catch (e) {
      res.status(500).json({ error: 'Failed to increment PV statistics' });
    }
  });

  // API: Get Statistics Dashboard details
  app.get('/api/stats', (req, res) => {
    try {
      const stats: SystemStats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
      res.json(stats);
    } catch (e) {
      res.status(500).json({ error: 'Failed to retrieve stats' });
    }
  });

  // API: Create new Spot/Event
  app.post('/api/spots', (req, res) => {
    try {
      const { type, source, name, description, latitude, longitude, tags, image_urls, event_start_at, event_end_at, status, google_maps_url } = req.body;
      
      if (!name?.ja || !latitude || !longitude) {
        return res.status(400).json({ error: 'Spot Japanese name, latitude, and longitude are required' });
      }

      const spots: Spot[] = JSON.parse(fs.readFileSync(SPOTS_FILE, 'utf-8'));
      
      const newSpot: Spot = {
        id: 'spot-' + Date.now(),
        type: type || 'restaurant',
        source: source || 'hotel_master',
        name,
        description: description || { ja: '', en: '', zh_cn: '', zh_tw: '', ko: '' },
        latitude: Number(latitude),
        longitude: Number(longitude),
        tags: Array.isArray(tags) ? tags : [],
        image_urls: Array.isArray(image_urls) ? image_urls : [],
        event_start_at: event_start_at || undefined,
        event_end_at: event_end_at || undefined,
        status: status || 'active',
        created_at: new Date().toISOString(),
        google_maps_url: google_maps_url || undefined
      };

      spots.push(newSpot);
      fs.writeFileSync(SPOTS_FILE, JSON.stringify(spots, null, 2));
      
      updateStatsCounts();
      res.status(201).json(newSpot);
    } catch (e) {
      res.status(500).json({ error: 'Failed to create spot' });
    }
  });

  // API: Update existing Spot/Event
  app.put('/api/spots/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updatedData = req.body;
      
      const spots: Spot[] = JSON.parse(fs.readFileSync(SPOTS_FILE, 'utf-8'));
      const index = spots.findIndex(s => s.id === id);
      
      if (index === -1) {
        return res.status(404).json({ error: 'Spot not found' });
      }

      spots[index] = {
        ...spots[index],
        ...updatedData,
        // Make sure types match
        latitude: isNaN(Number(updatedData.latitude)) ? spots[index].latitude : Number(updatedData.latitude),
        longitude: isNaN(Number(updatedData.longitude)) ? spots[index].longitude : Number(updatedData.longitude),
      };

      fs.writeFileSync(SPOTS_FILE, JSON.stringify(spots, null, 2));
      updateStatsCounts();
      res.json(spots[index]);
    } catch (e) {
      res.status(500).json({ error: 'Failed to update spot' });
    }
  });

  // API: Delete existing Spot/Event
  app.delete('/api/spots/:id', (req, res) => {
    try {
      const { id } = req.params;
      const spots: Spot[] = JSON.parse(fs.readFileSync(SPOTS_FILE, 'utf-8'));
      const filtered = spots.filter(s => s.id !== id);
      
      if (filtered.length === spots.length) {
         return res.status(404).json({ error: 'Spot not found' });
      }

      fs.writeFileSync(SPOTS_FILE, JSON.stringify(filtered, null, 2));
      updateStatsCounts();
      res.json({ success: true, message: 'Deleted successfully' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete spot' });
    }
  });

  // API: Serve AI Auto Translation using Gemini with perfect structural types
  app.post('/api/translate', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text prompt parameter is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('Gemini API key is not configured. Falling back to simple mock translations.');
        return res.json({
          en: `[Translation of: ${text.slice(0, 30)}...]`,
          zh_cn: `[中文简体翻译: ${text.slice(0, 25)}...]`,
          zh_tw: `[中文繁體翻譯: ${text.slice(0, 25)}...]`,
          ko: `[한국어 번역본: ${text.slice(0, 25)}...]`
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Please translate the following Japanese travel spot description into English, Simplified Chinese (zh_cn), Traditional Chinese (zh_tw), and Korean (ko):

---
${text}
---`,
        config: {
          systemInstruction: 'You are an expert multi-lingual hotel concierge. Translate descriptions elegantly and naturally. Adjust local slang, preserve brand names, use appealing vocabulary for tourists, and make descriptions highly readable.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              en: { type: Type.STRING, description: 'Elegantly phrased translation in English.' },
              zh_cn: { type: Type.STRING, description: 'Natural translation in Simplified Chinese.' },
              zh_tw: { type: Type.STRING, description: 'Natural translation in Traditional Chinese.' },
              ko: { type: Type.STRING, description: 'Natural translation in Korean.' }
            },
            required: ['en', 'zh_cn', 'zh_tw', 'ko']
          }
        }
      });

      const jsonText = response.text;
      if (!jsonText) {
        throw new Error('Empty response received from Gemini API');
      }

      const parsedTranslations = JSON.parse(jsonText.trim());
      res.json(parsedTranslations);

    } catch (e: any) {
      console.error('Gemini API Translation Error:', e);
      res.status(500).json({ 
        error: 'Failed to process AI translation', 
        details: e?.message || String(e) 
      });
    }
  });

  // Photo templates matching image search keyword
  const UN_IMAGES = [
    { keywords: ['sushi', 'fish', 'seafood'], url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop' },
    { keywords: ['ramen', 'noodle', 'soup'], url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop' },
    { keywords: ['matcha', 'tea', 'cafe', 'dessert', 'sweet', 'beer', 'drink', 'bar'], url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop' },
    { keywords: ['shrine', 'gate', 'temple', 'castle', 'building', 'villa', 'museum', 'park', 'onsen', 'spa', 'hot spring'], url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop' },
    { keywords: ['alley', 'lantern', 'street', 'night', 'market', 'shopping'], url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop' },
    { keywords: ['bamboo', 'garden', 'forest', 'light', 'nature', 'mountain', 'scenic'], url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&auto=format&fit=crop' }
  ];

  // API 1: Around-Hotel Recommended Spots auto-generated via Gemini search grounding
  app.post('/api/spots/auto-refresh', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const hotel = getHotelConfig();

      if (!apiKey) {
        return res.status(400).json({
          error: 'Gemini API key is required to use the Around-Hotel Auto-Refresh feature. Please provide/verify it under Settings.'
        });
      }

      console.log(`[CONCIERGE SERVER] Launching auto-refresh for hotel "${hotel.name}" at location: ${hotel.latitude}, ${hotel.longitude}`);

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `I have a hotel named "${hotel.name}" located at latitude: ${hotel.latitude}, longitude: ${hotel.longitude}.
Please search Google (using the Search Grounding tool) to find exactly 6 highly popular tourist attractions, famous local specialty restaurants, or cultural experiences that exist and are physically close (preferably within 5km) to these coordinates.

For each of the 6 spots found, generate a complete hotel concierge database entry following the strictly typed schema. Ensure descriptions are compelling and fully translated into Japanese, English, Simplified Chinese, Traditional Chinese, and Korean. Define coordinates accurately so distances can be compute mathematically.`,
        config: {
          systemInstruction: `You are an elite multilingual hotel concierge. Utilize Google Search grounding tool to gather real information about highly rated tourist destinations, traditional food spots, hot springs, and local museums near the coordinates (${hotel.latitude}, ${hotel.longitude}). First determine which city and region those coordinates fall in, then search for well-regarded establishments in that area. Structure the output perfectly inside the requested JSON Schema. No generic names, use real establishments.`,
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'Exactly 6 verified, real-world travel/dining/experience spots close to the hotel coordinates.',
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.OBJECT,
                  properties: {
                    ja: { type: Type.STRING },
                    en: { type: Type.STRING },
                    zh_cn: { type: Type.STRING },
                    zh_tw: { type: Type.STRING },
                    ko: { type: Type.STRING }
                  },
                  required: ['ja', 'en', 'zh_cn', 'zh_tw', 'ko']
                },
                type: {
                  type: Type.STRING,
                  description: 'Category: "restaurant" or "sightseeing" or "event"'
                },
                description: {
                  type: Type.OBJECT,
                  properties: {
                    ja: { type: Type.STRING, description: 'Emotionally appealing descriptive paragraph in elegant Japanese (2-4 sentences).' },
                    en: { type: Type.STRING, description: 'English translation.' },
                    zh_cn: { type: Type.STRING, description: 'Simplified Chinese translation.' },
                    zh_tw: { type: Type.STRING, description: 'Traditional Chinese translation.' },
                    ko: { type: Type.STRING, description: 'Korean translation.' }
                  },
                  required: ['ja', 'en', 'zh_cn', 'zh_tw', 'ko']
                },
                latitude: { type: Type.NUMBER, description: 'Actual latitude coordinates.' },
                longitude: { type: Type.NUMBER, description: 'Actual longitude coordinates.' },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Exactly 2-3 suitable hashtags from: ["#スタッフ厳選", "#徒歩10分以内", "#ご当地グルメ", "#ランチ", "#ディナー", "#インスタ映え", "#雨でも安心", "#名湯温泉", "#お土産屋"]'
                },
                image_query: { type: Type.STRING, description: 'A lowercase theme keyword to select a photo: "sushi", "ramen", "matcha", "shrine", "alley", "bamboo".' }
              },
              required: ['name', 'type', 'description', 'latitude', 'longitude', 'tags', 'image_query']
            }
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response returned from Gemini Model during auto-refresh');
      }

      const freshSpots = JSON.parse(responseText.trim());
      if (!Array.isArray(freshSpots)) {
        throw new Error('Model did not return a valid array of spots');
      }

      // Convert image queries to actual Unsplash temple URLs
      const processedSpots: Spot[] = freshSpots.map((spot: any, index: number) => {
        const query = (spot.image_query || '').toLowerCase();
        let imageUrl = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop'; // default shrine

        const matched = UN_IMAGES.find(img => 
          img.keywords.some(kw => query.includes(kw) || spot.type === kw)
        );
        if (matched) {
          imageUrl = matched.url;
        }

        const distance = computeDistance(hotel.latitude, hotel.longitude, spot.latitude, spot.longitude);
        const mins = computeWalkMinutes(distance);

        // Map correctly to Spot type
        return {
          id: `spot-auto-${Date.now()}-${index}`,
          type: spot.type || 'sightseeing',
          source: 'external_api',
          name: spot.name,
          description: spot.description,
          latitude: spot.latitude,
          longitude: spot.longitude,
          tags: spot.tags,
          image_urls: [imageUrl],
          status: 'active',
          created_at: new Date().toISOString()
        };
      });

      // Write newly gathered recommendations to spots.json
      fs.writeFileSync(SPOTS_FILE, JSON.stringify(processedSpots, null, 2));

      // Refresh stats
      updateStatsCounts();

      console.log(`[CONCIERGE SERVER] Sucessfully updated spots database with ${processedSpots.length} real coordinates around the hotel!`);
      res.json({ success: true, count: processedSpots.length, spots: processedSpots });

    } catch (e: any) {
      console.error('[CONCIERGE SERVER] Failed to auto-refresh spots:', e);
      res.status(500).json({
        error: 'Failed to auto-generate recommended spots around hotel.',
        details: e?.message || String(e)
      });
    }
  });

  // API 2: Speed-assistant metadata auto-generator for new manual hotel spot registrations
  app.post('/api/spots/helper-generate', async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Spot "name" string is required for AI-assisted lookup.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: 'Gemini API key is required under Settings to use the AI Quick Assist lookup feature.'
        });
      }

      console.log(`[CONCIERGE SERVER] Instantly generating helper data for manual spot query: "${name.trim()}"`);

      // We use Search Grounding to pinpoint the true details of this name
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Please verify and search Google to find all standard metadata for the following tourist destination, restaurant, or experience in Japan: "${name.trim()}"
Pinpoint its real geographic coordinate, categories/tags, and elegant translations so that the hotel concierge can register it instantly in one click.`,
        config: {
          systemInstruction: 'You are an advanced digital hotel assistant. Perform quick Google Searches to find precise coordinates, categories, translation names, and descriptions for the requested location. Present results in rigid JSON.',
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.OBJECT,
                properties: {
                  ja: { type: Type.STRING },
                  en: { type: Type.STRING },
                  zh_cn: { type: Type.STRING },
                  zh_tw: { type: Type.STRING },
                  ko: { type: Type.STRING }
                },
                required: ['ja', 'en', 'zh_cn', 'zh_tw', 'ko']
              },
              type: {
                type: Type.STRING,
                description: 'The spot category: must be "restaurant" or "sightseeing" or "event".'
              },
              description: {
                type: Type.OBJECT,
                properties: {
                  ja: { type: Type.STRING, description: 'Emotionally deep, elegant description in polite Japanese for visitors (2-3 sentences).' },
                  en: { type: Type.STRING },
                  zh_cn: { type: Type.STRING },
                  zh_tw: { type: Type.STRING },
                  ko: { type: Type.STRING }
                },
                required: ['ja', 'en', 'zh_cn', 'zh_tw', 'ko']
              },
              latitude: { type: Type.NUMBER, description: 'Accurate latitude coordinates of the spot.' },
              longitude: { type: Type.NUMBER, description: 'Accurate longitude coordinates of the spot.' },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Pick 2 to 3 tags from: ["#スタッフ厳選", "#徒歩10分以内", "#ご当地グルメ", "#ランチ", "#ディナー", "#インスタ映え", "#雨でも安心", "#名湯温泉", "#お土産屋"]'
              },
              image_query: { type: Type.STRING, description: 'Simple category keyword for photos: "sushi", "ramen", "matcha", "shrine", "alley", "bamboo".' }
            },
            required: ['name', 'type', 'description', 'latitude', 'longitude', 'tags', 'image_query']
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('AI could not return lookup metadata.');
      }

      const generatedObj = JSON.parse(responseText.trim());

      // Assign corresponding Unsplash image URL using image_query
      const query = (generatedObj.image_query || '').toLowerCase();
      let chosenUrl = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop';

      const matched = UN_IMAGES.find(img => 
        img.keywords.some(kw => query.includes(kw) || generatedObj.type === kw)
      );
      if (matched) {
        chosenUrl = matched.url;
      }

      generatedObj.image_urls = [chosenUrl];
      delete generatedObj.image_query; // clean temp field

      console.log('[CONCIERGE SERVER] Speed lookup generated:', generatedObj);
      res.json(generatedObj);

    } catch (e: any) {
      console.error('[CONCIERGE SERVER] Speed assistant error:', e);
      res.status(500).json({
        error: 'Failed to populate metadata automatically.',
        details: e?.message || String(e)
      });
    }
  });

  // API Route: Auto-import spot details from Google Maps URL (Gemini-powered)
  app.post('/api/spots/import-maps', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Google Maps URL is required' });
      }

      console.log('[CONCIERGE SERVER] Importing from Google Maps URL:', url);

      let fullUrl = url;
      try {
        const fetchRes = await fetch(url, { 
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        fullUrl = fetchRes.url;
      } catch (e) {
        console.warn('Redirect expansion failed, parsing input URL directly:', e);
      }

      console.log('[CONCIERGE SERVER] Resolved Google Maps URL:', fullUrl);

      const hotel = getHotelConfig();
      let latitude = hotel.latitude + 0.0005; // Slightly shifted from the hotel coord
      let longitude = hotel.longitude + 0.0005;

      const atMatch = fullUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch) {
        latitude = Number(atMatch[1]);
        longitude = Number(atMatch[2]);
      } else {
        const d3Match = fullUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
        if (d3Match) {
          latitude = Number(d3Match[1]);
          longitude = Number(d3Match[2]);
        }
      }

      let placeNameHint = '';
      const placeMatch = fullUrl.match(/\/maps\/place\/([^/]+)/);
      if (placeMatch) {
        placeNameHint = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
        placeNameHint = placeNameHint.split(',')[0].trim();
      } else {
        const qMatch = fullUrl.match(/[?&]q=([^&]+)/);
        if (qMatch) {
          placeNameHint = decodeURIComponent(qMatch[1].replace(/\+/g, ' ')).split(',')[0].trim();
        }
      }

      console.log('[CONCIERGE SERVER] Extracted Coords:', { latitude, longitude, decodedName: placeNameHint });

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('[CONCIERGE SERVER] Gemini API key not found. Using fallback parsing.');
        const fallbackName = placeNameHint || '新規観光スポット';
        
        return res.json({
          name: {
            ja: fallbackName,
            en: fallbackName,
            zh_cn: fallbackName,
            zh_tw: fallbackName,
            ko: fallbackName
          },
          type: 'sightseeing',
          description: {
            ja: 'Google Mapsからインポートされました。詳細な紹介文は、APIキーが設定されている場合にGemini AIによって自動生成されます。',
            en: `Imported from Google Maps URL. Connect your Gemini API key under Settings to automatically generate high-quality multilingual descriptions.`,
            zh_cn: '从Google Maps导入。请在此处手动补充中文介绍文。',
            zh_tw: '從Google Maps導入。請在此處手動補充繁體中文介紹文。',
            ko: 'Google 지도에서 가져왔습니다. 여기에 한국어 설명을 별도로 추가해 주세요.'
          },
          latitude,
          longitude,
          tags: ['#スタッフ厳選', '#和モダン'],
          image_urls: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop'] 
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `I have a Google Maps URL: "${fullUrl}"
Place name hint from URL: "${placeNameHint}"
Extracted starting coordinates: Latitude=${latitude}, Longitude=${longitude}

Based on this information, please search Google (using the Search Grounding tool) to find the real travel-worthy recommendation spot (or restaurant, shrine, alley, cafe, temple, event), confirm its actual geographic layout, and generate a beautiful multi-lingual database entry.

Return a JSON payload structured exactly according to the schema. Make the descriptions highly detailed, inviting, and professional. Describe the location, what tourists should expect, historical contexts if any, and atmosphere.`,
        config: {
          systemInstruction: 'You are an elite multilingual hotel concierge. Utilize Google Search grounding tool to gather real information about the specified place, such as its exact coordinates, category, and historical/culinary highlights. Structure the output perfectly inside the requested JSON Schema.',
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.OBJECT,
                properties: {
                  ja: { type: Type.STRING },
                  en: { type: Type.STRING },
                  zh_cn: { type: Type.STRING },
                  zh_tw: { type: Type.STRING },
                  ko: { type: Type.STRING }
                },
                required: ['ja', 'en', 'zh_cn', 'zh_tw', 'ko']
              },
              type: {
                type: Type.STRING,
                description: 'The spot category: must be "restaurant", "sightseeing" or "event". Choose based on the place\'s true nature.'
              },
              description: {
                type: Type.OBJECT,
                properties: {
                  ja: { type: Type.STRING },
                  en: { type: Type.STRING },
                  zh_cn: { type: Type.STRING },
                  zh_tw: { type: Type.STRING },
                  ko: { type: Type.STRING }
                },
                required: ['ja', 'en', 'zh_cn', 'zh_tw', 'ko']
              },
              latitude: { type: Type.NUMBER },
              longitude: { type: Type.NUMBER },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Select exactly 2 to 3 tags from: ["#ご当地グルメ", "#ランチ", "#ディナー", "#子連れ歓迎", "#インスタ映え", "#雨でも安心", "#夜間営業", "#テイクアウトOK", "#和モダン"]'
              },
              image_query: { type: Type.STRING, description: 'A lowercase keyword search query representing this spot.' }
            },
            required: ['name', 'type', 'description', 'latitude', 'longitude', 'tags', 'image_query']
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response returned from Gemini Model');
      }

      const spotData = JSON.parse(responseText.trim());

      const query = (spotData.image_query || '').toLowerCase();
      let chosenImageUrl = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop';
      
      const matched = UN_IMAGES.find(img => 
        img.keywords.some(kw => query.includes(kw) || spotData.type === kw)
      );
      
      if (matched) {
        chosenImageUrl = matched.url;
      } else {
        if (spotData.type === 'restaurant') {
          chosenImageUrl = 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop';
        } else if (spotData.type === 'event') {
          chosenImageUrl = 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&auto=format&fit=crop';
        }
      }

      spotData.image_urls = [chosenImageUrl];
      delete spotData.image_query; // cleanup temp field

      console.log('[CONCIERGE SERVER] Gemini Spot Generation Complete:', spotData);
      res.json(spotData);

    } catch (e: any) {
      console.error('[CONCIERGE SERVER] Failed to import from Maps URL:', e);
      res.status(500).json({
        error: 'Failed to process Google Maps URL',
        details: e?.message || String(e)
      });
    }
  });

  // Vite development server / production asset routing
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CONCIERGE SERVER] Server running on http://localhost:${PORT}`);
  });
}

startServer();
