const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Events service listening at ${HOST}:${PORT}`)
})


let clients = [];

app.get('/status', (request, response) => response.json({clients: clients.length}));

function subscribe(request, response, next) {
    response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    });
    response.write(`data: ${JSON.stringify({'system_message': 'event-hub app'})}\n\n`);

    const clientId = Date.now();

    const newClient = {
        id: clientId,
        response
    };

    clients.push(newClient);

    request.on('close', () => {
        console.log(`${clientId} Connection closed`);
        clients = clients.filter(client => client.id !== clientId);
    });
}
app.get('/events', subscribe);



function broadcastEvents(newEvent) {
    clients.forEach(client => client.response.write(`data: ${JSON.stringify(newEvent)}\n\n`))
}
async function notifyEvent(request, response, next) {
    response.json(request.body);
    return broadcastEvents(request.body);
}
app.post('/events', notifyEvent);