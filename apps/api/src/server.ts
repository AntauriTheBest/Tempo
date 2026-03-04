import 'dotenv/config';
import { app } from './app';
import { env } from './config';
import { initWhatsApp } from './modules/whatsapp/whatsapp.service';

app.listen(env.PORT, () => {
  console.log(`API server running on http://localhost:${env.PORT}`);
  initWhatsApp().catch((err) => console.error('[WhatsApp] Error al iniciar:', err));
});
