// WebSocket chat server
var http = require("http");
var fs = require("fs");
// TODO: Uncomment when done working on CSS and html.
// var pagetop = fs.readFileSync('pagetop.html');
// var pagebot = fs.readFileSync('pagebot.html');

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8122 });

var rgbIndex = 0;
var hostColour = textRGB();
var hostBackground = textBackground();

function rgbValuesString()
{
  var indexVal = rgbIndex;
  var valueArray = new Array();
  for (var i = 0; i < 3; i++)
  {
    valueArray.push((indexVal &1) * 128);
    indexVal = indexVal >> 1;
  }
  return valueArray.join(',');
}

function textRGB()
{
  return "rgb(" + rgbValuesString() + ')';
}

function textBackground()
{
  return "rgba(" + rgbValuesString() + ', 0.1)';
}

wss.on('connection', function connection(ws) {

  // Process messages from browser
  ws.on('message', function incoming(msg) {
      console.log(`received: ${msg}`);
      var msgObject = JSON.parse(msg);

      if (msgObject.message.trim().length == 0)
        return;
        
      if (!ws.name)
      {
        console.log("Setting name to " + msgObject.message);
        var othersString;
        if (wss.clients.size == 1)
          othersString = "You are the first to join the chat.";
        else
        {
          var others = [];
          wss.clients.forEach(function add(client) {
            if (client !== ws)
              others.push(client.name);
          });
          var otherNames = ``;
          if (others.length > 1)
          {
            otherNames = `${others.slice(1).join(', ')} and ${others[0]}`;
          }
          else
          {
            otherNames = others[0];
          }
          othersString = `You are joining ${otherNames} in the chat.`;
        }
        ws.name = msgObject.message;
        ws.send(JSON.stringify(new Object({ 
          "name": "Chat Host", 
          "colour": hostColour, 
          "background": hostBackground, 
          "text": `Hi, ${ws.name}! ${othersString}`})));

        wss.broadcast(new Object({
          "name": "Chat Host",
          "colour": hostColour,
          "background": hostBackground,
          "text": `${ws.name} has joined the Chat.`
        }),
        false);
      }
      else
      {
        wss.broadcast(new Object({ 
          "name": ws.name,
          "colour": ws.colour, 
          "background": ws.background, 
          "text": msgObject.message}),
          true);
      }
  });
    
  ws.on('close', function close() {
    console.log(`Disconnected client ${ws.name}`);

    if (ws.name)
      wss.broadcast(new Object({
        "name": "Chat Host",
        "colour": hostColour,
        "background": hostBackground,
        "text": `${ws.name} has left the Chat.`
      }),
      false);
});

  rgbIndex++;
  ws.colour = textRGB();
  ws.background = textBackground();

  // Broadcast to all.
  wss.broadcast = function broadcast(data, toAll) {
    var formatted = JSON.stringify(data);
    console.log('broadcast: ' + formatted);
    wss.clients.forEach(function each(client) {
      if (toAll || client !== ws) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(formatted);
        }
      }
    });
  };

  console.log(`Connection open`);
  ws.send(JSON.stringify(new Object({ 
    "name": "Chat Host", 
    "colour": hostColour, 
    "background": hostBackground, 
    "text": "Hi! What's your name?"})));
});

// Request handler callback
function onRequest(request, response) 
{
  // TODO: Remove when done updating css/html.
  var pagetop = fs.readFileSync('pagetop.html');
  var pagebot = fs.readFileSync('pagebot.html');

  response.writeHead(200, {"Content-Type": "text/html"});
  response.write(pagetop);
  response.write(pagebot);
  response.end();
} // onRequest

http.createServer(onRequest).listen(8121);
console.log("chat server started.");
