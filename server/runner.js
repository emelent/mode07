const spawn = require('child_process').spawn;
const is = require('is_js');

const procs = {}
const db = require('./state');


function createInputHandler(socket){
  let state = db.retrieveState();
  socket.on('disconnect', () => {
    console.log('Client disconnected.');
    if(is.existy(procs[socket])){
      console.log('Killing child process.');
      procs[socket].kill();
    }
  });

  return (input) => {
    let upload;
    for(upload of state.uploads)
      if(upload.id.toString() === input) break;

    if(!is.existy(procs[socket])){
			console.log('running => ', upload.bin); 
      //run spawn new process
      procs[socket] = spawnProcess(socket, upload.bin);
    }else{
      //add a new line so program receives text
      procs[socket].stdin.write(input);
    }
  };
}

function spawnProcess(socket, message){
  let cmd = message.trim().split(' ');
  let args = cmd.splice(1);
  cmd = cmd[0];
  
  const child = spawn(cmd, args);
  console.log(`Running ${cmd} ${args.join(' ')}`);

  child.stdout.on('data', (data) => {
    //console.log(`\n${data}\n`);
    socket.emit('message', data.toString());
  });

  child.stderr.on('data', (data) => {
    //console.log(`\n${data}\n`);
    socket.emit('message', data.toString());
  });

  child.on('close', (code) => {
    console.log(`\nExited with code ${code}\n`);
    socket.emit('message', 
      `\nExited with code ${code}\nPress 'ENTER' to re-run the program or 'ESC' to exit.`);
    procs[socket] = undefined;
  });

  return child;
}

module.exports = createInputHandler;


