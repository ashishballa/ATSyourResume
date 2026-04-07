Check the app is healthy in production.

1. Hit the health endpoint and confirm it returns `{"status": "ok"}`:
   ```
   curl https://atsyourresume-api.onrender.com/health
   ```

2. Check the latest git log to confirm what's deployed:
   ```bash
   git log --oneline -5
   ```

3. Remind the user of the two URLs:
   - Backend: https://atsyourresume-api.onrender.com
   - Frontend: https://ats-your-resume.vercel.app

4. If health check fails, check:
   - Is `GOOGLE_API_KEY` set on Render?
   - Is `FRONTEND_URL` set to `https://ats-your-resume.vercel.app`?
   - Did the last push trigger a Render redeploy?
