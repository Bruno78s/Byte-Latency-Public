
// Endpoint para envio de email usando Gmail SMTP
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();

const app = express();
app.use(cors({ origin: '*', methods: ['POST'] }));
app.use(bodyParser.json());

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const FROM_EMAIL = GMAIL_USER;

if (!GMAIL_USER || !GMAIL_PASS) {
  console.error('Defina GMAIL_USER e GMAIL_PASS no .env');
  process.exit(1);
}


app.post('/api/send-email', async (req, res) => {
  const { to, subject, message } = req.body;
  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'to, subject e message são obrigatórios' });
  }
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS,
      },
    });
    await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html: `<p>${message}</p>`
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Só inicia se chamado diretamente
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log('Servidor de email ouvindo na porta', PORT);
  });
}
