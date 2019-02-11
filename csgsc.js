const optionDefinitions = [
    { name: 'init', alias: 'i', type: String, multiple:true },
    { name: 'add', alias:'a',type: String, multiple: true},
    { name: 'get', alias: 'g', type: String,multiple:true},
    { name: 'revealAll', alias: 'r', type: String, multiple:true },
    { name: 'secret', alias: 's', type: String },
    { name: 'help', alias: 'h', type: Boolean}
  ]
const commandLineArgs = require('command-line-args');
const csGitSecretCrypt = require("./csGitSecretCrypt");
const csgsc = new csGitSecretCrypt();
try{
    const options = commandLineArgs(optionDefinitions)
    //console.log("Executed options are: ",options)//used for debugging.

    if(options.help){
        csgsc.help();
    }
    //init
    if(options.hasOwnProperty('init')){
        if(options.init.length >= 1){
            csgsc.init(options.init[0],options.init[1]);
        } else {
            throw new Error(csgsc.messages.applicationNameRequired)
        }
    }

    if(options.hasOwnProperty('add') && options.hasOwnProperty('secret')){
        if(options.add.length >= 2 && options.secret){
            csgsc.secret = options.secret;
            csgsc.add(options.add[0],options.add[1],options.add[2],options.add[3]);
        } else {
            throw new Error(csgsc.messages.noSecretProvided)
        }
    }
    if(options.hasOwnProperty('get') && options.hasOwnProperty('secret')){
        if(options.get.length >= 1 && options.secret){
            csgsc.secret = options.secret;
            csgsc.get(options.get[0],true,options.get[1]);
        } else {
            throw new Error(csgsc.messages.noSecretProvided)
        }
    }
    if(options.hasOwnProperty('revealAll') && options.hasOwnProperty('secret')){
        if(options.secret){
            csgsc.secret = options.secret;
            csgsc.getAllReveal(options.revealAll[0],options.revealAll[1]);
        } else {
            throw new Error(csgsc.messages.noSecretProvided)
        }
    }

}catch(e){
    console.log("\n FATAL:==>",e.message)
    csgsc.help();
}
