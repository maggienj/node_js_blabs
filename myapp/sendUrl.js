var log4js = require('log4js');
var logger = log4js.getLogger("echo");
logger.setLevel('DEBUG');

var OneApp = require('oneapp-buddy-sdk').OneApp;

var oneapp = new OneApp(
    'vcb68',
    'c79xnv!',
    'fe-sandbox-oneapp.futurexlabs.com',
    {log:logger}
  )

var messageHandler = function(message) {
    oneapp.sendWebapp(message.chatThreadId,"https://oneapi.futurexlabs.com/hackathon/docs/site/");
  }

oneapp.onMessage(messageHandler, { chatThreadId: true, textContent: true });
