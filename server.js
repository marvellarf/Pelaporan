const db = require('./database.js');
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Menyajikan semua file HTML/CSS/JS rekan lo sebagai static files
app.use(express.static(path.join(__dirname, '/')));

app.listen(PORT, () => {
    console.log(`Server CampusFix berjalan di http://localhost:${PORT}`);
});