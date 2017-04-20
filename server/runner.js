const spawn = require('child_process').spawn;
const is = require('is_js');

const processes = {}
const db = require('./state');


function createInputHandler(socket){
  let state = db.retrieveState();
  return (input) => {
    let upload;
    for(upload of state.uploads)
      if(upload.id.toString() === input) break;

    if(!is.existy(processes[socket])){
			console.log('running => ', upload.bin); 
      //run spawn new process
      processes[socket] = spawnProcess(socket, upload.bin);
    }else{
      //add a new line so program receives text
      processes[socket].stdin.write(input);
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
    console.log(`\n${data}\n`);
    socket.emit('message', data.toString());
  });

  child.stderr.on('data', (data) => {
    console.log(`\n${data}\n`);
    socket.emit('message', data.toString());
  });

  child.on('close', (code) => {
    console.log(`\nExited with code ${code}\n`);
    socket.emit('message', `\nExited with code ${code}\n`);
    processes[socket] = undefined;
  });

  return child;
}

module.exports = createInputHandler;


