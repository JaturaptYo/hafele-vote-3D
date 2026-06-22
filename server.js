const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// เสิร์ฟไฟล์โฟลเดอร์ public รวมถึงโมเดล 3D
app.use(express.static(path.join(__dirname, 'public')));

// ฐานข้อมูลจำลอง (Mock Database)
const database = {
    promoCodes: [],
    kpi: { totalCalculations: 3450, totalVotes: 12400 }
};

// API: คำนวณความคุ้มค่า (ส่งให้หน้า index.html)
app.post('/api/calculator', (req, res) => {
    const { homeType, productType } = req.body;
    database.kpi.totalCalculations += 1;

    let baseCO2 = productType === 'appliance' ? 450 : 120;
    let baseMoney = productType === 'appliance' ? 4200 : 1500;

    res.json({
        success: true,
        moneySaved: Math.round(baseMoney * homeType * 10),
        co2Reduced: Math.round(baseCO2 * homeType * 10)
    });
});

// API: จัดการโหวตผลงานและสร้างโค้ดส่วนลด
app.post('/api/vote', (req, res) => {
    database.kpi.totalVotes += 1;
    const newCode = "ECO-VOTE-" + Math.floor(Math.random() * 90000 + 10000);
    database.promoCodes.push(newCode);

    res.json({ success: true, rewardCode: newCode });
});

// เปิด Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Häfele Server is running!`);
    console.log(`🌐 เปิดเบราว์เซอร์ไปที่: http://localhost:${PORT}`);
});