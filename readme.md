if not global

node node_modules/cs-git-secret-crypt --init

gNTvxjf69AQjGfgMT3eoBLAKW64Gc5AE

node node_modules/cs-git-secret-crypt --add authServerAPIKey CainIoT --secret gNTvxjf69AQjGfgMT3eoBLAKW64Gc5AE


use in app
set CSGSC_SECRET=gNTvxjf69AQjGfgMT3eoBLAKW64Gc5AE
csGitSecretCrypt.get('authServerAPIKey')