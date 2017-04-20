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
const prices = [50, 80, 100, 125, 150, 200, 300];

/*MIDDLEWARE*/
app.use('/assets', express.static(path.join(pubDir, 'assets')));
app.use(fileUpload());
app.use(bodyParser.urlencoded({extended: false}));

app.set('view engine', 'pug');

/*ROUTES*/
app.post('/upload', (req, res) => {
  if(!req.files)
    return res.status(400).end('No files were uploaded.');

  let {level, module, type, content, name} = req.body;
  module = module.toLowerCase();
  type = type.toLowerCase();
  name = name.toLowerCase();
  level = parseInt(level) % prices.length;
  content = content.toLowerCase();

  let uploadPath = path.join(__dirname, `uploads/${module}/${type}`);
  let binPath = `${uploadPath}/${name}`;
  let tarPath = `${uploadPath}/${name}.tar.gz`;
  exec(`mkdir -p ${uploadPath}`);

  let binFile = req.files.binary;
  binFile.mv('bin', (error) => {
    if(error)
      return res.status(500).end(error.message);
    let tarFile = req.files.tar;
    tarFile.mv('tar', (error) => {
      if(error)
        return res.status(500).end(error.message);

      fs.renameSync('bin', binPath);
      fs.renameSync('tar', tarPath);

      let state = db.retrieveState();
      exec(`chmod 777 ${binPath}`);
      state.uploads.push({
        id: Date.now(),
        module,
        type,
        name,
        content,
        price: prices[level],
        uploadedAt: new Date().toString(),
        bin: binPath,
        tar: tarPath
      });
      db.storeState(state);
      res.end('Uploaded successful.');
    });
  });
});

app.get('/l99', (req, res) => {
  res.sendFile(path.join(__dirname,'../public/l99.html'));
});

app.get('/', (req, res) => {
  let state = db.retrieveState();
  res.render(
    path.join(pubDir, 'index.pug'), 
    {uploads: state.uploads}
  );
});
app.get('/state', (req, res) => {
  res.end(JSON.stringify(db.retrieveState()));
});


app.get('/uploads', (req, res) => {
  res.end(JSON.stringify(db.retrieveState().uploads));
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
