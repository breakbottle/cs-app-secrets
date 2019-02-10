const crypto = require('crypto');
const fs = require('fs')
const util = require('util');

class csGitSecretCrypt{
    //todo: rewrite in TypeScript as I want to use this now.
    //toto:docs: must install golabally for it to look at cwd package.json else config file will need the full path of config file. 
    //defaultFile = 'package.json';//format for ts
    constructor(){
        this.defaultFile = 'package.json';
        this.secret = process.env.CSGSC_SECRET || undefined;
        //messages
        this.messages = {
            configNotFound:"Warning, config file [%s] specified not found, using default package.json.",
            savedConfigSuccess:"\n Store **secret** in safe place-> %s \n",
            noSecretProvided:"Error: Secret was not specified.",
            invalidSecret:"Error: Secret provided is invalid",
            savedKeyValue:"[%s] value is [%s]",
            noticeReveal: "NOTE: All secrets will be revealed in the config file, ready to be used. (Cannot be undone)",
            revealAll:"All secrets are revealed in %s",
            revealAlready:"All secrets already revealed!",
            systemCheck:"Config file %s doesn't contain data, please run 'init'",
            decryptFailed: "Decryption failed! ensure you're using the correct secret.(NOTE: All values should be encrypted with the same secret which can be used for decryption, if your encrypted values are in the key list, with a different secrets you cannot use `revealAll`. If using `get` ensure correct secret that was used for encryption. )"
        }
    }
    /**
     * Initialize the config file
     * @param {string} configFile Optional config file path
     */
    init(configFile){ 
        let config = configFile || this.defaultFile;
        if(!fs.existsSync(config)) {
            console.log(this.messages.configNotFound,config)
            config = this.defaultFile;
        }
        const configContents = this.readConfigs(config);
        const serverKey = configContents.name || crypto.randomBytes(16);
        const serverKeyReady = crypto.createHash("sha256").update(serverKey, "utf8").digest("base64");
        const secret = crypto.createHash("sha256").update(crypto.randomBytes(32), "utf8").digest("base64").substr(0,32);

        configContents.csgsc = configContents.csgsc || {};
        configContents.csgsc.server = serverKeyReady.substr(0,16);
        configContents.csgsc.keys = [];
        configContents.csgsc.reveal = false;
        this.writeConfigs(config,configContents);
        console.log(this.messages.savedConfigSuccess,secret);

    };
    /**
     * add key value pair to config file
     * @param {string} key 
     * @param {string} value 
     * @param {string} configFile Optional config file path
     */
    add(key,value,configFile){
        const vConfig = this.check(configFile);
        if(!this.secret)
            throw new Error(this.messages.noSecretProvided);
        
        if(this.secret.length == 32){
            if(vConfig.contents.csgsc.keys.filter((v)=>{return v.key == key}).length >=1){
                vConfig.contents.csgsc.keys[key] = this.encrypt(value,this.secret,vConfig.contents.csgsc.server);
            } else {
                vConfig.contents.csgsc.keys.push({
                    key:key,
                    value:this.encrypt(value,this.secret,vConfig.contents.csgsc.server)
                });
            }
            vConfig.contents.csgsc.reveal = false;
            this.writeConfigs(vConfig.config,vConfig.contents);
        } else {
            console.error(this.messages.invalidSecret);
        }   
    }
    /**
     * get the decrypted value from provided key
     * @param {string} key 
     * @param {string} configFile Optional config file path
     * @param {boolean} showConsole how decrypted value in console, default false
     */
    get(key,showConsole,configFile){
        const vConfig = this.check(configFile);
        if(!this.secret)
            throw new Error(this.messages.noSecretProvided);
        if(this.secret.length == 32){
            const configItem = vConfig.contents.csgsc.keys.filter((v)=>{return v.key == key})[0];
            if(configItem){
                try{
                    const value = (vConfig.contents.csgsc.reveal)?configItem.value : this.decrypt(configItem.value,this.secret,vConfig.contents.csgsc.server);
                    if(showConsole && showConsole != 'false')
                        console.log(this.messages.savedKeyValue,key,value);
                    return value;
                } catch(e){
                    throw new Error(this.messages.decryptFailed);
                }
            }
            
        } else {
            console.error(this.messages.invalidSecret);
        }
    }
    /**
     * get all the keys and decrypt the values and keep revealed values in config file
     * @param {string} configFile Optional config file path
     */
    getAllReveal(configFile){
        console.log(this.messages.noticeReveal);
        const vConfig = this.check(configFile);
        if(!this.secret)
            throw new Error(this.messages.noSecretProvided);
            
        if(!vConfig.contents.csgsc.reveal){
            vConfig.contents.csgsc.reveal = true;
            if(this.secret.length == 32){
                try{
                    vConfig.contents.csgsc.keys.forEach((secret,index)=>{
                        secret.value = this.decrypt(secret.value,this.secret,vConfig.contents.csgsc.server);
                        vConfig.contents.csgsc.keys[index] = secret;
                    });
                } catch(e){
                    throw new Error(this.messages.decryptFailed)
                }
                this.writeConfigs(vConfig.config,vConfig.contents);
                console.log(this.messages.revealAll,vConfig.config)
            }
        } else 
            console.log(this.messages.revealAlready)
        
    }
  
    help(){
        console.log(`
            Use 'node' prefix if not installed globally or not running from package.json
            usage: csgsc [--init | <config-file?>]  
                         [--add <key> <value> <config-file?>]  [--secret <key>]
                         [--get <key> <config-file?>]  [--secret <key>]
                         [--revealAll <config-file?>]  [--secret <key>]
                        

            Options:
                --init              Initialize the options and store in config file
                --add               Adds a key & encrypted value pair to config file, optional config file if different from package.json
                --get               Get one item, decrypted value, if config, 'reveal' is true, will just return the value.
                --revealAll        Get all items, decrypted and saved back to config file for consumption.
                --secret            The secret used to decrypt values. **required** for --add, --get && --getAllReveal
        `)
    }
    
    decrypt(text,key,serverKey) {
        let encryptedText = Buffer.from(text, 'hex');
        let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), serverKey);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
       }
    encrypt(text,key,serverKey) {
         let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), serverKey);
         let encrypted = cipher.update(text);
         encrypted = Buffer.concat([encrypted, cipher.final()]);
         return encrypted.toString('hex');//{encryptedData:  };
    }
    //private
    check(file){
        const config = file || this.defaultFile;
       
        const configContents = this.readConfigs(config);
        if(!configContents.csgsc)
            throw new Error(util.format(this.messages.systemCheck,config));
        return {
            config:config,
            contents:configContents
        }
    }
    readConfigs(configFile){
        return require(process.cwd()+"/"+configFile);
    }
    /**
     * write JSON configs
     * @param {string} configFile 
     * @param {string} contents strigify object
     */
    writeConfigs(configFile,contents){
        fs.writeFile(configFile, JSON.stringify(contents,null,'\t'), function (err) {
            if (err) return console.log(err);
            console.log('writing to ' + configFile,JSON.stringify(contents.csgsc,null,'\t'));
        });
    }
}
module.exports = csGitSecretCrypt