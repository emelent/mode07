/*NODE LIBS*/
const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const socketIo = require('socket.io');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const exec = require('child_process').exec;

/*CUSTOM LIBS*/
const runner = require('./runner');
const utils = require('./utils');
const db = require('./state');

/*CONSTANTS*/
const app = express();
const server = http.Server(app);
const io = socketIo(server);

/*MIDDLEWARE*/
app.use(express.static('../public'));
app.use(fileUpload());
app.use(bodyParser.urlencoded({extended: false}));

app.set('view engine', 'pug');

/*ROUTES*/
app.post('/upload', (req, res) => {
  if(!req.files)
    return res.status(400).end('No files were uploaded.');

  let {module, type, name} = req.body;
  let binFile = req.files.binary;
  let binDir = path.join(__dirname, `uploads/bin/${module}/${type}`);
  let tarDir = path.join(__dirname, `uploads/src/${module}/${type}`);
  let binPath = `${binDir}/${name}`;
  let tarName = `${Date.now()}.tar.gz`;
  let tarPath = `${tarDir}/${tarName}`;

  //prepare directories
  exec(`mkdir -p ${binDir}`);
  exec(`mkdir -p ${tarDir}`);

  binFile.mv(binPath, (error) => {
    if(error)
      return res.status(500).end(error);
    let tarFile = req.files.tar;
    tarFile.mv(tarPath, (error) => {
      if(error)
        return res.status(500).end(error);

      fs.chmodSync(binPath, 777);

      db.retrieveState((state) =>{
        state.uploads.push({
          module,
          type,
          name,
          uploadedAt: new Date().toString(),
          bin: binPath,
          tar: `${module}/${type}/${tarName}`
        });
        db.storeState(state);
        res.end('Uploaded successful.');
      });
    });
  });
});

app.get('/l99', (req, res) => {
  res.sendFile(path.join(__dirname,'../public/l99.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
app.get('/state', (req, res) => {
  db.retrieveState(state => res.end(JSON.stringify(state)));
});


app.get('/uploads', (req, res) => {
  db.retrieveState(state => res.end(JSON.stringify(state.uploads)));
});

app.get('/codes', (req, res) => {
  db.retrieveState(state => res.end(JSON.stringify(state.codes)));
});

/*SOCKET IO*/
io.on('connection', (socket) => {
  console.log('Client connected.');
  socket.emit('message', 'SHELL\n');
  socket.on('message', runner(socket));
});


/*START SERVER*/
server.listen(3000, () => {
  console.log('Listening on *:3000');
});