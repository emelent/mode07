const spawn = require('child_process').spawn;
const utils = require('./utils');
const is = require('is_js');

const processes = {}

function createInputHandler(socket){
  return (input) => {
    utils.log(`input: ${input}`);
    if(!is.existy(processes[socket])){
      processes[socket] = spawnProcess(socket, input);
    }else{
      processes[socket].stdin.write(message);
    }
  };
}

function spawnProcess(socket, message){
  let cmd = message.trim().split(' ');
  let args = cmd.splice(1);
  cmd = cmd[0];
  
  const child = spawn(cmd, args);
  utils.log(`Running ${cmd} ${args.join(' ')}`);

  child.stdout.on('data', (data) => {
    utils.log(`\n${data}\n`);
    socket.emit('message', data.toString());
  });

  child.stderr.on('data', (data) => {
    utils.log(`\n${data}\n`);
    socket.emit('message', data.toString());
  });

  child.on('close', (code) => {
    utils.log(`\nExited with code ${code}\n`);
    socket.emit('message', `\nExited with code ${code}\n`);
    processes[socket] = undefined;
  });

  return child;
}

module.exports = createInputHandler;
