# cs-app-secrets

## Intended 
If you need to be able to hide credentials and still use in repository without user management, this is for you. There are other full solutions for use management that woulds with commit and check out.


## Prerequisites

- Nodejs v8.5.0

## Install - PENDING....

  `npm install cs-app-secrets` 

## CLI - Command Line Options 

### Prefix

 If installed globally i.e. `(npm i -g)` vs using `node_modules` folder

`node node_modules/cs-app-secrets` vs GLOBAL `cs-app-secrets`

### Setup 

1. `cs-app-secrets --init appName` - add a section in package.json 
    - Returns a <SECRET> for you to store safety.
2. Now we add our secrets to package.json 
    - `cs-app-secrets --add MSSQLConnStr Server=myServerName\myInstanceName;Database=myDataBase;User Id=myUsername; Password=myPassword --secret <SECRET>`
    - Encrypt a file contents
        - `cs-app-secrets --add MSSQLConnStr <Location of file> file --secret <SECRET>`
3. Show decrypted value on console
    - `cs-app-secrets --get MSSQLConnStr  --secret <SECRET>`


**SEE CLI HELP FOR MORE OPTIONS -> `cs-app-secrets --help`
## Use in NodeJs application

NOTE: **You must start the application with environment variable 'CSAS_`<appName>`_SECRET' set with the `<SECRET>`** exampe:

`set CSAS_<appName>_SECRET=<SECRET>`
```javascript
//TypeScript 
import * as csAppSecrets from 'cs-app-secrets/index';

//JavaScript
const csAppSecrets = require('cs-app-secrets/index');

let value = csAppSecrets.get('MSSQLConnStr');

```


## author(s)

  Clint W. Cain (Small)

## summary

Basic options for saving credentials in public repository. Adds encrypted key/values to JSON file for saving into repo so as not to save actual credentials in the repo. Well used as a master key for build systems such as Jenkins etc & global secure.


## license

[MIT](LICENSE)