
const fs = require('fs');
const path = require('path');

try {
  const dbPath = path.join(__dirname, 'data/db.json');
  const dbContent = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(dbContent);

  console.log('Total Properties:', db.propertyManagement ? db.propertyManagement.length : 'N/A');
  if (db.propertyManagement) {
    db.propertyManagement.forEach(p => {
      console.log(`Property: ${p.id} (${p.name}), TotalTowers: ${p.totalTowers}`);
    });
  }

  console.log('\nTotal Towers:', db.towers ? db.towers.length : 'N/A');
  if (db.towers) {
    const towersByProperty = {};
    db.towers.forEach(t => {
        const pid = t.propertyId || 'MISSING';
        if (!towersByProperty[pid]) towersByProperty[pid] = 0;
        towersByProperty[pid]++;
    });
    console.log('Towers by PropertyId:');
    console.log(JSON.stringify(towersByProperty, null, 2));

    // Check for unique towers (deduplicated by ID)
    const uniqueTowers = new Set(db.towers.map(t => t.id));
    console.log('Unique Tower IDs:', uniqueTowers.size);
  }

  console.log('\nTotal Units:', db.units ? db.units.length : 'N/A');
  if (db.units) {
      const unitsByProperty = {};
      const unitsByTower = {};
      db.units.forEach(u => {
          const pid = u.propertyId || 'MISSING';
          const tid = u.towerId || 'MISSING';
          
          if (!unitsByProperty[pid]) unitsByProperty[pid] = 0;
          unitsByProperty[pid]++;

          if (!unitsByTower[tid]) unitsByTower[tid] = 0;
          unitsByTower[tid]++;
      });
      console.log('Units by PropertyId:');
      console.log(JSON.stringify(unitsByProperty, null, 2));
      console.log('Units by TowerId:');
      console.log(JSON.stringify(unitsByTower, null, 2));
  }

} catch (err) {
  console.error('Error:', err);
}
