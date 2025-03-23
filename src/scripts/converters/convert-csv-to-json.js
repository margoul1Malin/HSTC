const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Chemin source et destination
const csvFilePath = path.join(__dirname, 'src', 'components', 'CC', 'binlist-data.csv');
const jsonFilePath = path.join(__dirname, 'src', 'components', 'CC', 'binlist-data.json');

const results = [];

// Lire le CSV et convertir en JSON
fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    // Écrire le fichier JSON
    fs.writeFileSync(jsonFilePath, JSON.stringify(results, null, 2));
    console.log(`Conversion terminée. ${results.length} entrées converties.`);
    console.log(`Fichier JSON créé à : ${jsonFilePath}`);
  }); 