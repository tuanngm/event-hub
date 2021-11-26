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
let subscribers = [];

app.get('/status', (request, response) => response.json({clients: clients.length, details: clients}));

function subscribe(request, response, next) {
    if (request.get('x-api-key') !== process.env.API_KEY) {
        response.status(401).send('Invalid API key');
        return;
    }

    response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    });
    response.write(`data: ${JSON.stringify({'system_message': 'Welcome to EventHub!'})}\n\n`);

    const clientId = Date.now();

    const newClient = {
        id: clientId,
        name: request.get('x-client-name'),
        host: request.get('x-host-name')
    };
    const newSubscriber = {
        id: clientId,
        response: response
    };

    clients.push(newClient);
    subscribers.push(newSubscriber);

    request.on('close', () => {
        console.log(`${clientId} Connection closed`);
        clients = clients.filter(client => client.id !== clientId);
    });
}
app.get('/events', subscribe);



function broadcastEvents(newEvent) {
    subscribers.forEach(subscriber => subscriber.response.write(`data: ${JSON.stringify(newEvent)}\n\n`))
}
async function notifyEvent(request, response, next) {
    console.log('request.headers=' + JSON.stringify(request.headers));
    response.json(request.body);
    return broadcastEvents({ headers: request.headers, body: request.body });
}
app.post('/events', notifyEvent);
