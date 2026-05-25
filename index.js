const express = require('express');
const mongoose = require('mongoose'); // Tambahan library untuk MongoDB
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// ===================================================================
// 1. SETUP KONEKSI MONGODB ATLAS
// PENTING: Ganti dengan Connection String milikmu dari langkah Drivers!
// Ubah <password> dengan password Database User yang kamu buat.
// ===================================================================
const mongoURI = "mongodb+srv://RumahSakit:12345678Iii$@iot-suhu-ruangbayi.nompqhp.mongodb.net/?appName=IOT-Suhu-RuangBayi";

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
    waktu_update: { type: Date, default: Date.now } // Otomatis mencatat waktu server
});

// Membuat model dari skema di atas
const Sensor = mongoose.model('Sensor', sensorSchema);


// ===================================================================
// 3. Endpoint untuk MENERIMA data dari ESP32 (HTTP POST)
// ===================================================================
app.post('/api/sensor', async (req, res) => {
    const { suhu, kelembapan, ruangan } = req.body;
    
    if (suhu != null && kelembapan != null) {
        try {
            // Membuat dokumen baru untuk disimpan ke database
            const dataBaru = new Sensor({
                suhu: suhu,
                kelembapan: kelembapan,
                ruangan: ruangan
            });
            
            await dataBaru.save(); // Menyimpan data secara permanen ke MongoDB
            
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
// ===================================================================
app.get('/api/get-sensor', async (req, res) => {
    try {
        // Mengambil 1 data paling terbaru dari MongoDB (diurutkan berdasarkan waktu mundur)
        const dataTerakhir = await Sensor.findOne().sort({ waktu_update: -1 });
        
        if (dataTerakhir) {
            // Menyesuaikan format JSON agar persis seperti variabel sementara milikmu sebelumnya
            const responseData = {
                suhu: dataTerakhir.suhu,
                kelembapan: dataTerakhir.kelembapan,
                ruangan: dataTerakhir.ruangan,
                waktu_update: dataTerakhir.waktu_update.toLocaleString('id-ID')
            };
            res.status(200).json(responseData);
        } else {
            // Jika database masih kosong
            res.status(200).json({ suhu: 0, kelembapan: 0, ruangan: "Ruang Bayi 1", waktu_update: "" });
        }
    } catch (error) {
        console.error("Error membaca dari database:", error);
        res.status(500).send({ message: "Gagal mengambil data dari database" });
    }
});

app.listen(port, () => {
    console.log(`Server Backend berjalan di http://localhost:3000`);
});