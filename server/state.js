const fs = require('fs');
const path = require('path');
const dbFile = path.join(__dirname, 'db.json');

function retrieveStateAsync(cb){
  fs.readFile(dbFile, 'utf8', (error, data) => {
    if(error) throw error;
    cb(JSON.parse(data.toString()));
  });
}

function storeStateAsync(state, cb){
  fs.writeFile(dbFile, JSON.stringify(state), 'utf8', (error) => {
    if(error) throw error;
    cb();
  });
}

function retrieveState(){
  return JSON.parse(fs.readFileSync(dbFile).toString());
}

function storeState(state){
  fs.writeFileSync(dbFile, JSON.stringify(state));
}

module.exports = {
  retrieveState,
  retrieveStateAsync,
  storeState,
  storeStateAsync
};
