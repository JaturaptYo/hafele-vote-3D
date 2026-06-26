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
    designs: [{
            id: 1,
            title: "Minimalist Eco Haven",
            architect: "Atelier Sustainable",
            firm: "AS Studio",
            carbonScore: 85,
            co2Saved: 1250,
            moneySaved: 85000,
            description: "บ้านเดี่ยวที่เน้นการใช้วัสดุและฮาร์ดแวร์ประตูที่ปล่อยคาร์บอนต่ำ",
            votes: 8500,
            homeType: "single",
            tags: ["hardware", "digital-lock"],
            color: "#064e3b"
        },
        {
            id: 2,
            title: "Comfy Living Interior",
            architect: "EcoStudio Design",
            firm: "EcoStudio",
            carbonScore: 82,
            co2Saved: 950,
            moneySaved: 62000,
            description: "ตกแต่งภายในคอนโดโดยใช้ระบบ Smart Home ลดพลังงานแฝง",
            votes: 6200,
            homeType: "condo",
            tags: ["smart", "appliance"],
            color: "#065f46"
        },
        {
            id: 3,
            title: "Smart Green Space",
            architect: "Green Arch",
            firm: "GA Partners",
            carbonScore: 78,
            co2Saved: 820,
            moneySaved: 54000,
            description: "ทาวน์โฮมระบบหมุนเวียนอากาศอัจฉริยะ พร้อมบานพับทนทาน",
            votes: 4245,
            homeType: "townhouse",
            tags: ["hinges", "faucet"],
            color: "#047857"
        }
    ],
    warranties: [],
    promoCodes: [],
    // 🟢 อัปเดต KPI ให้สอดคล้องกับหน้า Admin Dashboard โฉมใหม่
    kpi: {
        totalCalculations: 18452,
        totalVotes: 86430,
        totalSubmissions: 342,
        totalWarranties: 4120,
        // เพิ่ม Marketing & Business Metrics
        reach: 1245000,
        traffic: 284500,
        storeVisits: 12450,
        conversionRate: 4.2,
        premiumSales: 2800000,
        engagementRate: 12.4,
        brandLift: 22
    }
};

// ============================================================
// CARBON CALCULATOR DATA (อิงตามหมวดหมู่ EPD ใหม่)
// ============================================================
const PRODUCTS = {
    'cat1': { name: 'หมวดมือจับประตูและหน้าต่าง', co2: 6.47, savings: 100 },
    'cat2': { name: 'หมวดอุปกรณ์เครื่องกลไฟฟ้า', co2: 11.80, savings: 450 },
    'cat3': { name: 'หมวดบานพับ', co2: 7.37, savings: 50 },
    'cat4': { name: 'หมวดตลับกุญแจ', co2: 5.62, savings: 150 },
    'cat5': { name: 'หมวดไส้กุญแจ', co2: 10.90, savings: 120 }
};

const HOME_MULTIPLIERS = { condo: 1.0, townhouse: 1.5, single: 2.0 };

// ============================================================
// ROUTES
// ============================================================

// Carbon ROI Calculator
app.post('/api/calculator', (req, res) => {
    const { homeType, productType, timeMonths = 12 } = req.body;
    if (!PRODUCTS[productType] || !HOME_MULTIPLIERS[homeType])
        return res.status(400).json({ success: false, error: 'ข้อมูลไม่ถูกต้อง' });

    db.kpi.totalCalculations += 1;
    db.kpi.traffic += 1; // นับ Traffic เพิ่มเมื่อมีการใช้งาน

    const p = PRODUCTS[productType];
    const m = HOME_MULTIPLIERS[homeType];
    const totalCo2 = p.co2 * m;
    const totalMoney = p.savings * m * timeMonths;

    res.json({
        success: true,
        productName: p.name,
        co2Total: totalCo2.toFixed(2),
        moneySavedTotal: totalMoney,
        timeMonths: timeMonths,
        carbonScore: Math.max(100 - Math.round(totalCo2 * 0.5), 20),
        equivalentTrees: Math.round(totalCo2 / 1.25)
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

    const colors = ['#064e3b', '#065f46', '#047857', '#059669', '#10b981'];
    const design = {
        id: db.designs.length + 1,
        title,
        architect,
        firm: firm || 'Independent',
        description: description || '',
        homeType,
        tags: tags || [],
        carbonScore: Math.floor(Math.random() * 20) + 70, // จำลองคะแนน 70-90
        co2Saved: Math.floor(Math.random() * 1000) + 500,
        moneySaved: Math.floor(Math.random() * 50000) + 20000,
        votes: 0,
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

    const code = `HFL2026-${design.id}-${Math.floor(Math.random() * 9000 + 1000)}`;
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
    const { name, phone, email, productCategory, productItem, purchaseDate } = req.body;
    if (!name || !phone || !productCategory)
        return res.status(400).json({ success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });

    const warrantyId = `HFW-${Date.now().toString(36).toUpperCase()}`;
    db.warranties.push({
        id: warrantyId,
        name,
        phone,
        email,
        productCategory,
        productItem,
        purchaseDate,
        carbonPoints: 50,
        registeredAt: new Date().toISOString()
    });

    db.kpi.totalWarranties += 1;
    // ลงทะเบียนประกันสำเร็จ แปลว่าซื้อของจริง = เพิ่ม Store Visits ด้วย
    db.kpi.storeVisits += 1;

    res.json({
        success: true,
        warrantyId,
        carbonPoints: 50,
        message: `ลงทะเบียนสำเร็จ! หมายเลขรับประกัน: ${warrantyId}`
    });
});

// 🟢 KPI Dashboard Endpoint (อัปเดตใหม่)
app.get('/api/kpi', (_req, res) => {
    const top3 = [...db.designs]
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 3)
        .map(d => ({
            id: d.id,
            title: d.title,
            votes: d.votes,
            carbonScore: d.carbonScore,
            architect: d.architect
        }));

    res.json({
        success: true,
        kpi: db.kpi,
        targets: {
            calculations: 20000,
            votes: 100000,
            submissions: 500,
            warranties: 5000,
            reach: 2000000 // เป้าหมายการเข้าถึง 2 ล้านคน
        },
        top3
    });
});

// ============================================================
const PORT = process.env.PORT || 1000;
app.listen(PORT, () => {
    console.log(`✅  Häfele HOME IMPACT server running`);
    console.log(`🌐  http://localhost:${PORT}`);
});