// Express + web-push backend para notificações push
const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Gere suas chaves VAPID uma vez com: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'COLOQUE_SUA_PUBLIC_KEY_AQUI';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'COLOQUE_SUA_PRIVATE_KEY_AQUI';

webpush.setVapidDetails(
  'mailto:seu@email.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Armazene subscriptions em memória (troque por banco em produção)
const subscriptions = [];

app.get('/vapidPublicKey', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({ message: 'Inscrito com sucesso!' });
});

app.post('/sendNotification', async (req, res) => {
  const { title, message } = req.body;
  const payload = JSON.stringify({ title, message });
  let success = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, payload);
      success++;
    } catch (err) {
      // Ignore erro de subscription inválida
    }
  }
  res.json({ sent: success, total: subscriptions.length });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Push server rodando em http://localhost:${PORT}`);
});
