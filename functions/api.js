const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// ===================================================================
// 1. SETUP KONEKSI MONGODB ATLAS
// Tanda '$' pada password telah diubah menjadi '%24' agar bisa dibaca URL
// ===================================================================
const mongoURI = "mongodb+srv://RumahSakit:12345678Iii%24@iot-suhu-ruangbayi.nompqhp.mongodb.net/?appName=IOT-Suhu-RuangBayi";

mongoose.connect(mongoURI)
    .then(() => console.log('Berhasil terhubung ke MongoDB Atlas'))
    .catch(err => console.error('Gagal koneksi database:', err));

// ===================================================================
// 2. BUAT SKEMA (STRUKTUR DATA) MONGODB
// ===================================================================
const sensorSchema = new mongoose.Schema({
    suhu: Number,
    kelembapan: Number,
    ruangan: String,
    waktu_update: { type: Date, default: Date.now } 
});

const Sensor = mongoose.model('Sensor', sensorSchema);

// ===================================================================
// 3. Endpoint untuk MENERIMA data dari ESP32 (HTTP POST)
// ===================================================================
app.post('/api/sensor', async (req, res) => {
    const { suhu, kelembapan, ruangan } = req.body;
    
    if (suhu != null && kelembapan != null) {
        try {
            const dataBaru = new Sensor({
                suhu: suhu,
                kelembapan: kelembapan,
                ruangan: ruangan
            });
            
            await dataBaru.save(); 
            
            console.log("Data sukses disimpan ke MongoDB:", { suhu, kelembapan, ruangan });
            res.status(200).send({ message: "Data berhasil diterima server & MongoDB" });
        } catch (error) {
            console.error("Error menyimpan ke database:", error);
            res.status(500).send({ message: "Terjadi kesalahan server saat menyimpan data" });
        }
    } else {
        res.status(400).send({ message: "Format data tidak valid" });
    }
});


// ===================================================================
// 4. Endpoint untuk MENGIRIM data ke Website Dashboard (HTTP GET)
// Perbaikan: Mengubah 'router.get' menjadi 'app.get' dan menyesuaikan URL
// ===================================================================
app.get('/api/get-sensor', async (req, res) => {
    try {
        const dataHistori = await Sensor.find().sort({ waktu_update: -1 }).limit(20);
        
        if (dataHistori.length > 0) {
            const dataFormatArray = dataHistori.reverse().map(item => ({
                suhu: item.suhu,
                kelembapan: item.kelembapan,
                ruangan: item.ruangan,
                waktu_update: item.waktu_update.toLocaleTimeString('id-ID')
            }));
            
            res.status(200).json(dataFormatArray);
        } else {
            res.status(200).json([]);
        }
    } catch (error) {
        res.status(500).send({ message: "Gagal mengambil data histori" });
    }
});

app.listen(port, () => {
    console.log(`Server Backend berjalan di http://localhost:${port}`);
});