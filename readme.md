# cs-git-secret-crypt

## Intended 
If you need to be able to hide credentials and still use in repository without user management, this is for you. There are other full solutions for use management that woulds with commit and check out.


## install - PENDING....

  `npm install cs-git-secret-crypt` 

## CLI - Command Line Options 

### Prefix

 If installed globally i.e. `(npm i -g)` vs using `node_modules` folder

`node node_modules/cs-git-secret-crypt` vs GLOBAL `cs-git-secret-crypt`

### Setup 

1. `cs-git-secret-crypt --init` - add a section in package.json 
    - Returns a <SECRET> for you to store safety.
2. Now we add our secrets to package.json 
    - `cs-git-secret-crypt --add MSSQLConnStr Server=myServerName\myInstanceName;Database=myDataBase;User Id=myUsername; Password=myPassword --secret <SECRET>`
    - Encrypt a file contents
        - `cs-git-secret-crypt --add MSSQLConnStr <Location of file> file --secret <SECRET>`
3. Show decrypted value on console
    - `cs-git-secret-crypt --get MSSQLConnStr  --secret <SECRET>`


**SEE CLI HELP FOR MORE OPTIONS -> `cs-git-secret-crypt --help`
## Use in NodeJs application

NOTE: **You must start the application with environment variable 'CSGSC_SECRET' set with the `<SECRET>`** exampe:

`set CSGSC_SECRET=<SECRET>`
```javascript
//TypeScript 
import * as csGitSecretCrypt from 'cs-git-secret-crypt/index';

//JavaScript
const csGitSecretCrypt = require('cs-git-secret-crypt/index');

let value = csGitSecretCrypt.get('MSSQLConnStr');

```


## author(s)

  Clint W. Cain (Small)

## summary

Basic options for saving credentials in public repository. Adds encrypted key/values to JSON file for saving into repo so as not to save actual credentials in the repo. NOTE: This is just a basic option, use git-secret or git-crypt for advanced options.{I'm not affiliated with git-secret or git-crypt} 


## license

[MIT](LICENSE)