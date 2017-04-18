const fs = require('fs');
const path = require('path');
const dbFile = path.join(__dirname, 'db.json');

function retrieveState(cb){
  fs.readFile(dbFile, 'utf8', (error, data) => {
    if(error) throw error;
    cb(JSON.parse(data.toString()));
  });
}

function storeState(state){
  fs.writeFile(dbFile, JSON.stringify(state), 'utf8', (error) => {
    if(error) throw error;
    console.log('State updated.');
  });
}

module.exports = {
  retrieveState,
  storeState
};
