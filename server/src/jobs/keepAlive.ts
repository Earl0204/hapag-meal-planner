import cron from 'node-cron';
import axios from 'axios';

/**
 * Keeps the Render free-tier server warm by pinging itself every 14 minutes.
 * Render spins down free instances after 15 minutes of inactivity,
 * causing a 30-60 second cold start for the next user request.
 */
export function startKeepAlive() {
  const serverUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3001}`;

  // Ping every 14 minutes
  cron.schedule('*/14 * * * *', async () => {
    try {
      await axios.get(`${serverUrl}/health`, { timeout: 10000 });
      console.log(`[KeepAlive] Server pinged at ${new Date().toISOString()}`);
    } catch (err: any) {
      console.warn('[KeepAlive] Ping failed:', err.message);
    }
  });

  console.log('[KeepAlive] CRON scheduled — every 14 minutes');
}
