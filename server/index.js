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
const pubDir = path.join(__dirname, '../public');

/*MIDDLEWARE*/
app.use('/assets', express.static(path.join(pubDir, 'assets')));
app.use(fileUpload());
app.use(bodyParser.urlencoded({extended: false}));

app.set('view engine', 'pug');

/*ROUTES*/
app.post('/upload', (req, res) => {
  if(!req.files)
    return res.status(400).end('No files were uploaded.');

  let {module, type, name} = req.body;
  module = module.toLowerCase();
  type = type.toLowerCase();
  name = name.toLowerCase();

  let binFile = req.files.binary;
  let binDir = path.join(__dirname, `uploads/bin/${module}/${type}`);
  let tarDir = path.join(__dirname, `uploads/src/${module}/${type}`);
  let binPath = `${binDir}/${name}`;
  let tarName = `${Date.now()}.tar.gz`;
  let tarPath = `${tarDir}/${tarName}`;


  console.log(binPath);
  console.log(tarPath);
  exec(`mkdir -p ${binDir}`);
  exec(`mkdir -p ${tarDir}`);
  binFile.mv('bin', (error) => {
    if(error)
      return res.status(500).end(error.message);
    let tarFile = req.files.tar;
    tarFile.mv('tar', (error) => {
      if(error)
        return res.status(500).end(error.message);

      fs.rename('bin', binPath, (error) => {
        if(error)
          return res.status(500).end(error.message);
      });
      fs.rename('tar', tarPath, (error) => {
        if(error)
          return res.status(500).end(error.message);
      });
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
  db.retrieveState(state => res.render(
    path.join(pubDir, 'index.pug'), 
    {uploads: state.uploads}
  ));
});
app.get('/state', (req, res) => {
  db.retrieveState(state => res.end(JSON.stringify(state)));
});


app.get('/uploads', (req, res) => {
  db.retrieveState(state => res.end(JSON.stringify(state.uploads)));
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
