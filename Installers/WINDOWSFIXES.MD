Paramètres : Dark/LightMode inaccessible

SSyze : env/bin/sslyze www.drhead.org --certinfo --compression --early_data --fallback --heartbleed --http_headers --openssl_ccs --robot --reneg --resum --sslv3 --tlsv1 --tlsv1_1 --tlsv1_2 --tlsv1_3\n Faut interoperabilité ici

OWASP ZAP : Désactiver sur Windows

HakBoardCrawler : Ex├®cution de la commande: touch /tmp/scan_start_marker_003123 Faut interoperabilité ici
Et ducoup surement aussi pour env/Sripts/etC...

Donut : Désactiver Sur windows

Shark & WinPEAS -> Fait crash mais à l'air de fonctionner

VirusTotal Selection Fichier marche pas


Les sous-sections OSINT et CARD manque le dark:

QR Code : rreur lors de l'ex├®cution de la commande: Error: Command failed: cd src && node -e "const qrcode = require('qrcode'); qrcode.toDataURL('https://www.drhead.org', {
        width: 560,
        margin: 5,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }, (err, url) => { if(err) { console.error(err); process.exit(1); } else { console.log(url); } });"
[eval]:1
const qrcode = require('qrcode'); qrcode.toDataURL('https://www.drhead.org', {


SyntaxError: Unexpected end of input
    at makeContextifyScript (node:internal/vm:185:14)
    at compileScript (node:internal/process/execution:386:10)
    at node:internal/process/execution:450:25
    at [eval]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:447:60)
    at evalFunction (node:internal/process/execution:87:30)
    at evalScript (node:internal/process/execution:99:3)
    at node:internal/main/eval_string:74:3

Node.js v22.14.0

    at genericNodeError (node:internal/errors:983:15)
    at wrappedFn (node:internal/errors:537:14)
    at ChildProcess.exithandler (node:child_process:414:12)
    at ChildProcess.emit (node:events:518:28)
    at maybeClose (node:internal/child_process:1101:16)
    at ChildProcess._handle.onexit (node:internal/child_process:304:5) {
  code: 1,
  killed: false,
  signal: null,
  cmd: `cd src && node -e "const qrcode = require('qrcode'); qrcode.toDataURL('https://www.drhead.org', {\n` +
    '        width: 560,\n' +
    '        margin: 5,\n' +
    '        color: {\n' +
    "          dark: '#000000',\n" +
    "          light: '#ffffff'\n" +
    '        }\n' +
    '      }, (err, url) => { if(err) { console.error(err); process.exit(1); } else { console.log(url); } });"'
}
Code de sortie: 1
Signal tu├®: null
Commande compl├¿te: cd src && node -e "const qrcode = require('qrcode'); qrcode.toDataURL('https://www.drhead.org', {
        width: 560,
        margin: 5,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }, (err, url) => { if(err) { console.error(err); process.exit(1); } else { console.log(url); } });"
Error occurred in handler for 'execute-command': {
  error: `Command failed: cd src && node -e "const qrcode = require('qrcode'); qrcode.toDataURL('https://www.drhead.org', {\n` +
    '        width: 560,\n' +
    '        margin: 5,\n' +
    '        color: {\n' +
    "          dark: '#000000',\n" +
    "          light: '#ffffff'\n" +
    '        }\n' +
    '      }, (err, url) => { if(err) { console.error(err); process.exit(1); } else { console.log(url); } });"\n' +
    '[eval]:1\r\n' +
    "const qrcode = require('qrcode'); qrcode.toDataURL('https://www.drhead.org', {\r\n" +
    '                                                                              \r\n' +
    '\r\n' +
    'SyntaxError: Unexpected end of input\r\n' +
    '    at makeContextifyScript (node:internal/vm:185:14)\r\n' +
    '    at compileScript (node:internal/process/execution:386:10)\r\n' +
    '    at node:internal/process/execution:450:25\r\n' +
    '    at [eval]-wrapper:6:24\r\n' +
    '    at runScriptInContext (node:internal/process/execution:447:60)\r\n' +
    '    at evalFunction (node:internal/process/execution:87:30)\r\n' +
    '    at evalScript (node:internal/process/execution:99:3)\r\n' +
    '    at node:internal/main/eval_string:74:3\r\n' +
    '\r\n' +
    'Node.js v22.14.0\r\n',
  code: 1,
  stderr: '[eval]:1\r\n' +
    "const qrcode = require('qrcode'); qrcode.toDataURL('https://www.drhead.org', {\r\n" +
    '                                                                              \r\n' +
    '\r\n' +
    'SyntaxError: Unexpected end of input\r\n' +
    '    at makeContextifyScript (node:internal/vm:185:14)\r\n' +
    '    at compileScript (node:internal/process/execution:386:10)\r\n' +
    '    at node:internal/process/execution:450:25\r\n' +
    '    at [eval]-wrapper:6:24\r\n' +
    '    at runScriptInContext (node:internal/process/execution:447:60)\r\n' +
    '    at evalFunction (node:internal/process/execution:87:30)\r\n' +
    '    at evalScript (node:internal/process/execution:99:3)\r\n' +
    '    at node:internal/main/eval_string:74:3\r\n' +
    '\r\n' +
    'Node.js v22.14.0\r\n',
  stdout: ''
}