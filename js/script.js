// Expose fallback dataset URL and provided NASA API key to the app.
// Also expose a full NASA APOD URL template that will be used as the base for requests.
window.APOD_FALLBACK_URL = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';
window.NASA_API_KEY = '7Z7EtxHoPRtWQja3TgtWmEkt0crC6Vh0T3bddk3y';
// Full URL including API key — the app will append &start_date=...&end_date=...
window.NASA_API_FULL_URL = 'https://api.nasa.gov/planetary/apod?api_key=7Z7EtxHoPRtWQja3TgtWmEkt0crC6Vh0T3bddk3y';