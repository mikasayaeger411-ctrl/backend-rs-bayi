const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Koneksi Database
const mongoURI = "mongodb+srv://RumahSakit:12345678Iii%24@iot-suhu-ruangbayi.nompqhp.mongodb.net/ruangbayi?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB Terhubung'))
    .catch(err => console.error('Gagal:', err));

const Sensor = mongoose.model('Sensor', new mongoose.Schema({
    suhu: Number,
    kelembapan: Number,
    ruangan: String,
    waktu_update: { type: Date, default: Date.now }
}));

// Gunakan Router agar rutenya sesuai dengan path Netlify: /.netlify/functions/api/
const router = express.Router();

router.post('/sensor', async (req, res) => {
    try {
        const { suhu, kelembapan, ruangan } = req.body;
        const dataBaru = new Sensor({ suhu, kelembapan, ruangan });
        await dataBaru.save();
        res.status(200).send({ message: "Sukses" });
    } catch (e) {
        res.status(500).send({ message: "Error" });
    }
});

router.get('/get-sensor', async (req, res) => {
    try {
        const data = await Sensor.find().sort({ waktu_update: -1 }).limit(20);
        res.status(200).json(data.reverse());
    } catch (e) {
        res.status(500).send({ message: "Error" });
    }
});

app.use('/.netlify/functions/api', router);

// INI BAGIAN PALING PENTING UNTUK NETLIFY
module.exports.handler = serverless(app);