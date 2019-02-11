var csVersion = require('cs-json-version');

csVersion.run({
    listOfFiles:['package.json'],
    useCommitOptions:true,
    postCommands:'echo version updated from manual execution of build.js',
    branch:"master",
    limits:{
        patchLimit:20
    }
});

