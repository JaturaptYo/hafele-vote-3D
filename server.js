const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// MOCK DATABASE
// ============================================================
const db = {
    designs: [
        {
            id: 1, title: "EcoNest Residence",
            architect: "ณัฐพล สิริมงคล", firm: "GreenSpace Studio BKK",
            carbonScore: 87, co2Saved: 2450, moneySaved: 68000,
            description: "บ้านเดี่ยว 3 ชั้น ระบบ Passive Cooling ร่วมกับหน้าต่าง Low-E สองชั้น และประตูดิจิทัล Häfele ลดการสูญเสียความเย็น 40%",
            votes: 2340, homeType: "single",
            tags: ["passive-cooling", "digital-lock", "lighting"], color: "#064e3b"
        },
        {
            id: 2, title: "The Carbon Condo",
            architect: "ปิยะ วงศ์สุวรรณ", firm: "Atelier Sustainable",
            carbonScore: 82, co2Saved: 1820, moneySaved: 45000,
            description: "คอนโดมิเนียม High-Rise 32 ชั้น ติดตั้งก๊อกน้ำ Smart Faucet และระบบแสงสว่าง Häfele ทุกยูนิต ลด CO₂ ได้ 1,820 kg/ปี",
            votes: 1987, homeType: "condo",
            tags: ["faucet", "lighting", "appliance"], color: "#065f46"
        },
        {
            id: 3, title: "Townhouse Tomorrow",
            architect: "วรรณา ศรีสมบูรณ์", firm: "W.Arch & Associates",
            carbonScore: 79, co2Saved: 1560, moneySaved: 38000,
            description: "ทาวน์โฮม 3 ชั้น ผนังเขียวชะอุ่มรอบบ้าน ระบบ Smart Lock และก๊อกน้ำประหยัดน้ำ 70%",
            votes: 1756, homeType: "townhouse",
            tags: ["faucet", "digital-lock"], color: "#047857"
        },
        {
            id: 4, title: "Net Zero Villa",
            architect: "ภาคภูมิ รัตนประดิษฐ์", firm: "Zero Carbon Design",
            carbonScore: 76, co2Saved: 2100, moneySaved: 58000,
            description: "วิลล่า 4 ห้องนอน มุ่งสู่ Net Zero โดยใช้แผงโซลาร์เซลล์ร่วมกับอุปกรณ์ Häfele Premium ทุกรายการ",
            votes: 1543, homeType: "single",
            tags: ["solar", "appliance", "lighting"], color: "#059669"
        },
        {
            id: 5, title: "Urban Green Pod",
            architect: "ธนัช อินทร์แก้ว", firm: "Peas & Pods Studio",
            carbonScore: 73, co2Saved: 1200, moneySaved: 32000,
            description: "คอนโดขนาดเล็ก 1 ห้องนอน Layout ประหยัดพลังงานสูงสุด หน้าต่างทิศตะวันออก-ตก และก๊อก Smart Flow",
            votes: 1321, homeType: "condo",
            tags: ["faucet", "lighting"], color: "#10b981"
        },
        {
            id: 6, title: "Harmony Courtyard",
            architect: "สมหญิง ดาราพงศ์", firm: "S.Dara Architects",
            carbonScore: 71, co2Saved: 1680, moneySaved: 41000,
            description: "บ้านสไตล์ไทยประยุกต์ มีลานบ้านกลางเป็นหัวใจ ระบบ Air Flow ธรรมชาติ ลดการใช้แอร์ได้ 65%",
            votes: 1187, homeType: "single",
            tags: ["passive-cooling", "appliance"], color: "#34d399"
        }
    ],
    warranties: [],
    promoCodes: [],
    kpi: {
        totalCalculations: 3450,
        totalVotes: 12400,
        totalSubmissions: 67,
        totalWarranties: 234,
        totalImpressions: 1243000
    }
};

// ============================================================
// CARBON CALCULATOR DATA
// ============================================================
const PRODUCTS = {
    'digital-lock': { name: 'ประตูดิจิทัล Häfele', co2: 120, savings: 1500 },
    'appliance':    { name: 'เครื่องใช้ไฟฟ้า Smart', co2: 450, savings: 4200 },
    'faucet':       { name: 'ก๊อกน้ำอัจฉริยะ', co2: 80, savings: 800 },
    'lighting':     { name: 'ระบบแสงสว่าง LED', co2: 200, savings: 2000 }
};

const HOME_MULTIPLIERS = { condo: 1.0, townhouse: 1.8, single: 3.0 };

// ============================================================
// ROUTES
// ============================================================

// Carbon ROI Calculator
app.post('/api/calculator', (req, res) => {
    const { homeType, productType, years = 10 } = req.body;
    if (!PRODUCTS[productType] || !HOME_MULTIPLIERS[homeType])
        return res.status(400).json({ success: false, error: 'ข้อมูลไม่ถูกต้อง' });

    db.kpi.totalCalculations += 1;

    const p = PRODUCTS[productType];
    const m = HOME_MULTIPLIERS[homeType];
    const y = Math.min(Math.max(parseInt(years) || 10, 1), 30);
    const co2Year  = Math.round(p.co2 * m);
    const saveYear = Math.round(p.savings * m);

    res.json({
        success: true,
        productName: p.name,
        co2PerYear: co2Year,
        moneySavedPerYear: saveYear,
        co2Total: Math.round(co2Year * y),
        moneySavedTotal: Math.round(saveYear * y),
        years: y,
        carbonScore: Math.min(Math.round(55 + co2Year / 15), 99),
        equivalentTrees: Math.round((co2Year * y) / 21)
    });
});

// Get All Designs
app.get('/api/designs', (_req, res) => {
    const sorted = [...db.designs].sort((a, b) => b.votes - a.votes);
    res.json({ success: true, designs: sorted, total: sorted.length });
});

// Submit New Design
app.post('/api/designs/submit', (req, res) => {
    const { title, architect, firm, homeType, description, tags } = req.body;
    if (!title || !architect || !homeType)
        return res.status(400).json({ success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });

    const colors = ['#064e3b','#065f46','#047857','#059669','#10b981'];
    const design = {
        id: db.designs.length + 1,
        title, architect,
        firm: firm || 'Independent',
        carbonScore: Math.floor(Math.random() * 20 + 60),
        co2Saved: Math.floor(Math.random() * 1200 + 600),
        moneySaved: Math.floor(Math.random() * 30000 + 15000),
        description: description || '',
        votes: 0,
        homeType,
        tags: tags || [],
        color: colors[Math.floor(Math.random() * colors.length)],
        submittedAt: new Date().toISOString()
    };
    db.designs.push(design);
    db.kpi.totalSubmissions += 1;
    res.json({ success: true, design });
});

// Vote for Design
app.post('/api/vote', (req, res) => {
    const { designId } = req.body;
    const design = db.designs.find(d => d.id === parseInt(designId));
    if (!design)
        return res.status(404).json({ success: false, error: 'ไม่พบผลงานนี้' });

    design.votes += 1;
    db.kpi.totalVotes += 1;

    const code = `ECO-${design.id}-${Math.floor(Math.random() * 90000 + 10000)}`;
    db.promoCodes.push(code);

    res.json({
        success: true,
        rewardCode: code,
        totalVotes: design.votes,
        designTitle: design.title
    });
});

// E-Warranty Registration
app.post('/api/warranty', (req, res) => {
    const { name, phone, email, productType, purchaseDate } = req.body;
    if (!name || !phone || !productType)
        return res.status(400).json({ success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });

    const warrantyId = `HFW-${Date.now().toString(36).toUpperCase()}`;
    db.warranties.push({ id: warrantyId, name, phone, email, productType, purchaseDate, carbonPoints: 50, registeredAt: new Date().toISOString() });
    db.kpi.totalWarranties += 1;

    res.json({
        success: true,
        warrantyId,
        carbonPoints: 50,
        message: `ลงทะเบียนสำเร็จ! หมายเลขรับประกัน: ${warrantyId}`
    });
});

// KPI Dashboard
app.get('/api/kpi', (_req, res) => {
    const top3 = [...db.designs]
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 3)
        .map(d => ({ id: d.id, title: d.title, votes: d.votes, carbonScore: d.carbonScore, architect: d.architect }));

    res.json({
        success: true,
        kpi: db.kpi,
        targets: { calculations: 5000, votes: 20000, submissions: 100, warranties: 500, impressions: 3000000 },
        top3
    });
});

// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅  Häfele HOME IMPACT server running`);
    console.log(`🌐  http://localhost:${PORT}`);
});
