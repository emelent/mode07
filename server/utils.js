function logProps(obj, name='object'){
  for(let prop in obj){
    console.log(`${name}.${prop}`);
  }
}

module.exports = {
  logProps
};

