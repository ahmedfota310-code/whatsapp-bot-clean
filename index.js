cat << 'EOF' > index.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { attachAllCommands } = require('./commands_handler');

const phoneNumber = process.env.PHONE_NUMBER || '201119815662';

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'clean-bot-session' }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  }
});

client.on('qr', (qr) => {
  console.log('امسح كود QR ده أو استخدم رقم الربط:', phoneNumber);
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('BOT IS READY!');
});

attachAllCommands(client);
client.initialize();
EOF

node -c commands_handler.js && node -c index.js && PHONE_NUMBER=201119815662 node index.js
