const crypto = require('crypto');
const fs = require('fs')
const util = require('util');
const Confirm = require('prompt-confirm');
 

class csAppSecrets{
    //TODO: rewrite in TypeScript as I want to use this now.
    //defaultFile = 'package.json';//format for ts
    constructor(){
        this.defaultFile = 'package.json';
        //messages
        this.messages = {
            applicationNameRequired:"Please provide an application name",
            configNotFound:"Warning, config file [%s] specified not found, using default package.json.",
            fileNotFound:"Operation cancelled because cannot find file %s",
            savedConfigSuccess:"\n Store **secret** in safe place-> %s. Set your Environment Variable before you run your apps. example; \n\t %s \n\t %s \n",
            noSecretProvided:"Error: Secret was not specified.",
            invalidSecret:"Error: Secret provided is invalid",
            savedKeyValue:"[%s] value is [%s]",
            noticeReveal: "NOTE: All secrets will be revealed in the config file, ready to be used. (Cannot be undone at this time)",
            revealAll:"All secrets are revealed in %s, NOTE: if one or more is revealed by getAllReveal",
            revealAlready:"All secrets already revealed!",
            systemCheck:"Config file %s doesn't contain data, please run 'init'",
            decryptFailed: "Decryption failed! ensure you're using the correct secret.(NOTE: All values should be encrypted with the same secret which can be used for decryption, if your encrypted values are in the key list, with a different secrets you cannot use `revealAll`. If using `get` ensure correct secret that was used for encryption. )",
            keyAlreadyEncrypted: "%s is already been encrypted",
            fileOperationError:"Cannot % file due to % ",
            keyNotFound:"% wasn't found in %s",
            keyUsed:"%s is being used.",
            confirmReveal:'Are you sure you want to reveal all secrets in config file %s & encrypted files?'

        }
        this.statuses = {
            encrypted:'encrypted',
            raw:'raw'
        }
    }
    /**
     * Initialize the config file
     * @param {string} appName The short name of the application 
     * @param {string} configFile Optional config file path
     */
    init(appName,configFile){ 
        let config = configFile || this.defaultFile;
        if(!fs.existsSync(config)) {
            console.log(this.messages.configNotFound,config)
            config = this.defaultFile;
        }
        if(!appName) throw new Error(this.messages.applicationNameRequired);
        const configContents = this.readConfigs(config);
        let serverKey;
        const skTotalLength = 16;
        const skFormat = skTotalLength - appName.length;
        if(skFormat > 0){
            serverKey = appName+crypto.randomBytes(skFormat);
        } else {
            //to large
            serverKey = appName.substr(0,skTotalLength);
        }
       

        const serverKeyReady = crypto.createHash("sha256").update(serverKey, "utf8").digest("base64");
        const secret = crypto.createHash("sha256").update(crypto.randomBytes(32), "utf8").digest("base64").substr(0,32);
        
        configContents.csas = configContents.csas || {};
        configContents.csas.server = serverKeyReady.substr(0,16);
        configContents.csas.keys = [];
        configContents.csas.reveal = false;
        configContents.csas.env = "CSAS_"+appName.toLocaleUpperCase()+"_SECRET";
        
        this.writeConfigs(config,configContents);
        console.log(this.messages.savedConfigSuccess,secret,"Windows: set "+configContents.csas.env+"="+secret,"Other: export "+configContents.csas.env+"="+secret);

    };
    /**
     * add key value pair to config file
     * @param {string} key 
     * @param {string} value 
     * @param {string} type Defaults to String, can also be File
     * @param {string} configFile Optional config file path
     */
    add(key,value,type,configFile){
        const vConfig = this.check(configFile);
        if(!this.secret)
            throw new Error(this.messages.noSecretProvided);
        
        if(this.secret.length == 32){
            let encryptedValue;
            let fileValue;
            const pat = new RegExp("^file$",'i');
            
            if(vConfig.contents.csas.keys.filter(v=>(v.key === key && v.status === this.statuses.encrypted)).length){
                console.log(this.messages.keyAlreadyEncrypted,key);
                return false;
            }
          
            if(pat.test(type)){
                const fileToEncrypt =process.cwd()+"/"+value;
                if(!fs.existsSync(fileToEncrypt)) 
                    throw new Error(util.format(this.messages.fileNotFound,fileToEncrypt));

                const _this = this;
                fs.readFile(fileToEncrypt,(err,data)=>{
                    if(err)
                        throw new Error(util.format(this.messages.fileOperationError,'read',err));

                    fileValue = this.encrypt(data,this.secret,vConfig.contents.csas.server);
                    fs.writeFile(fileToEncrypt,fileValue,(err)=>{
                        if(err)
                            throw new Error(util.format(this.messages.fileOperationError,'write',err));

                        _this.saveEncrypted(key,'File',vConfig,value);
                    });

                })
            } else {
                //Assume string
                encryptedValue = this.encrypt(value,this.secret,vConfig.contents.csas.server);
                this.saveEncrypted(key,'String',vConfig,encryptedValue);
            }

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
        let value;
        const vConfig = this.check(configFile);
        if(!this.secret)
            throw new Error(this.messages.noSecretProvided);
        if(this.secret.length == 32){
            const configItem = vConfig.contents.csas.keys.filter((v)=>{return v.key == key})[0];
            if(configItem){
                try{
                    const type = configItem.type || "String";
                    if(type == 'File'){
                        try{
                            const fileContent = fs.readFileSync(process.cwd()+"/"+configItem.value).toString("Utf8");
                            value = configItem.status === this.statuses.encrypted ? this.decrypt(fileContent,this.secret,vConfig.contents.csas.server): fileContent;
                           
                        }catch(e){
                            console.error(this.messages.fileOperationError,'read',e.message)
                        }
   
                    } else {
                        //String
                        value = configItem.status === this.statuses.encrypted ? this.decrypt(configItem.value,this.secret,vConfig.contents.csas.server):configItem.value;
                    }
                    if(showConsole && showConsole != 'false')
                        console.log(this.messages.savedKeyValue,key,value);
                    else {
                        console.log(this.messages.keyUsed,key,vConfig.config)
                    }                        
                    return value;
         
                } catch(e){
                    throw new Error(this.messages.decryptFailed);
                }
            } else {
                console.log(this.messages.keyNotFound,key)
            }
            
        } else {
            console.error(this.messages.invalidSecret);
        }
    }
    /**
     * get all the keys and decrypt the values and keep revealed values in config file
     * @param {boolean} default false, if true, all values will be decrypted and save in respective files.
     * @param {string} configFile Optional config file path
     */
    getAllReveal(updateFiles,configFile){
        const vConfig = this.check(configFile);
        if(!this.secret)
            throw new Error(this.messages.noSecretProvided);
          
        if(updateFiles){
            const prompt = new Confirm(util.format(this.messages.confirmReveal,vConfig.config));
            if(!vConfig.contents.csas.reveal){ 
                    vConfig.contents.csas.reveal = true;
                    console.log(this.messages.noticeReveal);
                    const _this = this;
                    prompt.ask(function(answer) {
                        if(answer === true){
                            //back up file
                            let source;
                            if(fs.copyFileSync)
                                fs.copyFile(process.cwd()+"/"+vConfig.config,process.cwd()+"/"+vConfig.config+"_"+Date.now(),(err)=>{
                                    if(err)
                                        throw new Error("Backup Failed")

                                    _this.revealSync.call(_this,vConfig)
                                });
                            else {
                                source = fs.createReadStream(process.cwd()+"/"+vConfig.config);
                                source.pipe(fs.createWriteStream(process.cwd()+"/"+vConfig.config+"_"+Date.now()));
                                source.on("end",()=>{
                                    _this.revealSync.call(_this,vConfig)
                                })
                            }
                            
                            
                        }
                        
                    });
                }   
            else 
                console.log(this.messages.revealAlready)
        } else {
            vConfig.contents.csas.keys.forEach((secret,index)=>{
                secret.value = this.get(secret.key,true);
                vConfig.contents.csas.keys[index] = secret;
            });
        }
    }
    revealSync(vConfig){
        vConfig.contents.csas.keys.forEach((secret,index)=>{
            if(secret.type === 'File'){
                const value = this.get(secret.key,true);
                fs.writeFileSync(process.cwd()+"/"+secret.value,value);
            } else {
                secret.value = this.get(secret.key,true);
            }
            secret.status = this.statuses.raw;
            
            vConfig.contents.csas.keys[index] = secret;
        });
        //save main file
        this.writeConfigs(vConfig.config,vConfig.contents);
    }
    /**
     * Shows how to use the CLI
     * Todo: should use command-line-usage (https://github.com/75lb/command-line-usage)
     */
    help(){
        console.log(`
            Use 'node' prefix if not installed globally or not running from package.json
            usage: csas [--init <appName> <config-file?>]  
                         [--add <key> <value> <type> <config-file?>]  [--secret <key>]
                         [--get <key> <config-file?>]  [--secret <key>]
                         [--revealAll <updateFileValues> <config-file?>]  [--secret <key>]
                        

            Options:
                --init              Initialize the options and store in config file
                --add               Adds a key & encrypted value pair to config file, optional type Default String | File, config file if different from package.json
                --get               Get one item, decrypted value, if config, 'reveal' is true, will just return the value.
                --revealAll         Get all items, decrypted and saved back to config file for consumption, if choose updateFileValues, otherwise will just show in the console.
                --secret            The secret used to decrypt values. **required** for --add, --get && --getAllReveal
        `)
    }

    /**
     * decrypt text with key and password
     * @param {string} text 
     * @param {string} key 
     * @param {string} serverKey 
     */
    decrypt(text,key,serverKey) {
        let encryptedText = Buffer.from(text, 'hex');
        let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), serverKey);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }
    /**
     * encrypt text with key and password
     * @param {string} text 
     * @param {string} key 
     * @param {string} serverKey 
     */
    encrypt(text,key,serverKey) {
         let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), serverKey);
         let encrypted = cipher.update(text);
         encrypted = Buffer.concat([encrypted, cipher.final()]);
         return encrypted.toString('hex');//{encryptedData:  };
    }
    //private
    /**
     * Saves the config files contents with encrypted values
     * @param {*} key 
     * @param {*} type can be String|File, default String
     * @param {*} vConfig 
     * @param {*} encryptedValue 
     */
    saveEncrypted(key,type,vConfig,encryptedValue){
        const found =vConfig.contents.csas.keys.filter((v)=>{return v.key == key});
        if(found.length >=1){
            vConfig.contents.csas.keys.map(v=>{
                if(v.key === key){
                    v.value = encryptedValue;
                    v.type = type;
                    v.status = this.statuses.encrypted
                }
                return v;
            });
        } else {
            vConfig.contents.csas.keys.push({
                key:key,
                value:encryptedValue,
                type:type,
                status:this.statuses.encrypted
            });
        }
        vConfig.contents.csas.reveal = false;
        this.writeConfigs(vConfig.config,vConfig.contents);
    }
    /**
     * check if the configs are loaded and in config file
     * @param {string} file 
     */
    check(file){
        const config = file || this.defaultFile;
       
        const configContents = this.readConfigs(config);
        if(!configContents.csas)
            throw new Error(util.format(this.messages.systemCheck,config));

        this.secret = process.env[configContents.csas.env] || this.secret;

        return {
            config:config,
            contents:configContents
        }
    }
    /**
     * loads the config file
     * @param {string} configFile 
     */
    readConfigs(configFile){
        return require(process.cwd()+"/"+configFile);
    }
    /**
     * write JSON configs
     * @param {string} configFile 
     * @param {string} contents stringify object
     */
    writeConfigs(configFile,contents){
        fs.writeFile(configFile, JSON.stringify(contents,null,'\t'), function (err) {
            if (err) return console.log(err);
            console.log('writing to ' + configFile,JSON.stringify(contents.csas,null,'\t'));
        });
    }
}
module.exports = csAppSecrets;