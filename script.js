// Simple, commented JavaScript for beginners

// Wait until DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	// Short list of fun "Did You Know?" facts
	const facts = [
		"Did you know? A day on Venus is longer than a year on Venus.",
		"Did you know? Neutron stars can spin hundreds of times per second.",
		"Did you know? The footprints on the Moon will likely remain for millions of years.",
		"Did you know? Jupiter's Great Red Spot is a gigantic storm larger than Earth.",
		"Did you know? Light from the Sun takes about 8 minutes to reach Earth."
	];

	// Pick a random fact and show it
	const didEl = document.getElementById('did-you-know');
	const randomFact = facts[Math.floor(Math.random() * facts.length)];
	didEl.textContent = randomFact;

	// Form and UI elements — use only a start date (we fetch 9 consecutive days)
	const form = document.getElementById('date-form');
	const startInput = document.getElementById('start-date');
	const gallery = document.getElementById('gallery');
	const loading = document.getElementById('loading');

	// Modal elements
	const modal = document.getElementById('modal');
	const modalBackdrop = document.getElementById('modal-backdrop');
	const modalClose = document.getElementById('modal-close');
	const modalTitle = document.getElementById('modal-title');
	const modalDate = document.getElementById('modal-date');
	const modalMedia = document.getElementById('modal-media');
	const modalExplanation = document.getElementById('modal-explanation');

	// Use provided API key from global window (set in js/script.js)
	const API_KEY = window.NASA_API_KEY || 'DEMO_KEY';
	// Fallback CDN URL (may be set by /js/script.js as window.APOD_FALLBACK_URL)
	const FALLBACK_URL = window.APOD_FALLBACK_URL || 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

	// Helper: format a Date to YYYY-MM-DD
	function formatDate(d) {
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	}

	// Helper: add days to a Date
	function addDays(d, days) {
		const copy = new Date(d.valueOf());
		copy.setDate(copy.getDate() + days);
		return copy;
	}

	// Helper: detect YouTube ID from many URL forms
	function parseYouTubeId(url) {
		if (!url) return null;
		const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
		return m ? m[1] : null;
	}

	// Helper: detect Vimeo ID (more tolerant)
	function parseVimeoId(url) {
		if (!url) return null;
		const m = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/) || url.match(/player\.vimeo\.com\/video\/([0-9]+)/);
		return m ? m[1] : null;
	}

	// Helper: is direct video file
	function isDirectVideo(url) {
		return !!url && /\.(mp4|webm|ogg)(?:\?|$)/i.test(url);
	}

	// Helper: get best thumbnail for a video item / url
	function getVideoThumbnail(url, item) {
		// Prefer explicit thumbnail from API when available
		if (item && item.thumbnail_url) return item.thumbnail_url;
		// Prefer embed_url if it's a YouTube URL
		const candidate = (item && (item.embed_url || item.url)) || url || '';
		const yt = parseYouTubeId(candidate);
		if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
		// Vimeo thumbnails require an API call; fall back to item.url or worm logo
		if (parseVimeoId(candidate)) return (item && item.url) ? item.url : 'img/nasa-worm-logo.png';
		// Direct video: no thumbnail -> fallback
		if (isDirectVideo(candidate)) return 'img/nasa-worm-logo.png';
		return 'img/nasa-worm-logo.png';
	}

	// Helper: create embed element for modal given the APOD item
	function createVideoEmbed(item) {
		const url = (item && (item.embed_url || item.url)) || '';
		// YouTube embed
		const yt = parseYouTubeId(url);
		if (yt) {
			const iframe = document.createElement('iframe');
			iframe.src = `https://www.youtube.com/embed/${yt}`;
			iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
			iframe.allowFullscreen = true;
			iframe.title = 'YouTube video player';
			return iframe;
		}
		// Vimeo embed
		const vimeo = parseVimeoId(url);
		if (vimeo) {
			const iframe = document.createElement('iframe');
			iframe.src = `https://player.vimeo.com/video/${vimeo}`;
			iframe.allow = 'autoplay; fullscreen; picture-in-picture';
			iframe.allowFullscreen = true;
			iframe.title = 'Vimeo video player';
			return iframe;
		}
		// Direct video file -> use <video> tag with controls
		if (isDirectVideo(url)) {
			const video = document.createElement('video');
			video.controls = true;
			video.src = url;
			video.style.maxWidth = '100%';
			video.setAttribute('playsinline', '');
			return video;
		}
		// Last resort: link element
		const p = document.createElement('p');
		p.innerHTML = `Video: <a href="${url}" target="_blank" rel="noopener">Open video</a>`;
		return p;
	}

	// Show modal with provided APOD item (improved video handling)
	function openModal(item) {
		modalTitle.textContent = item.title || 'Untitled';
		modalDate.textContent = item.date || '';
		modalExplanation.textContent = item.explanation || '';

		// Clear previous media
		modalMedia.innerHTML = '';

		if (item.media_type === 'image') {
			// Show full-size image
			const img = document.createElement('img');
			img.src = item.hdurl || item.url;
			img.alt = item.title || 'APOD image';
			modalMedia.appendChild(img);
		} else if (item.media_type === 'video') {
			// Use helper to create best embed element using the full item
			const mediaEl = createVideoEmbed(item);
			modalMedia.appendChild(mediaEl);
		} else {
			// Unknown media type
			modalMedia.textContent = 'Media not available.';
		}

		modal.setAttribute('aria-hidden', 'false');
	}

	// Close modal
	function closeModal() {
		modal.setAttribute('aria-hidden', 'true');
		modalMedia.innerHTML = '';
	}

	// Close when clicking backdrop or close button
	modalBackdrop.addEventListener('click', closeModal);
	modalClose.addEventListener('click', closeModal);
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') closeModal();
	});

	// Helper: fetch a single APOD item for a specific date (returns item or null)
	async function fetchApodForDate(baseUrl, dateStr) {
		// Use date query parameter for single-day request
		const url = `${baseUrl}&date=${dateStr}`;
		try {
			const res = await fetch(url);
			if (!res.ok) {
				// non-ok for single date — skip this date
				return null;
			}
			const data = await res.json();
			// If API returns an error object structure, treat as null
			if (!data || data.error) return null;
			return data;
		} catch (err) {
			// network error — treat as missing
			return null;
		}
	}

	// Helper: fetch APOD data from NASA or fallback on 403 / network errors
	async function fetchApodRange(apiKey, startStr, endStr) {
		// Determine base URL: prefer the exact full URL provided on window, else build from key
		const baseUrl = window.NASA_API_FULL_URL || `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(apiKey)}`;

		// Try bulk request first (start_date & end_date)
		const bulkUrl = `${baseUrl}&start_date=${startStr}&end_date=${endStr}`;
		try {
			const res = await fetch(bulkUrl);
			if (res.ok) {
				const data = await res.json();
				// If API returned items, and array has length, return it
				const items = Array.isArray(data) ? data : [data];
				// filter out invalid entries
				const valid = items.filter((it) => it && it.date);
				if (valid.length > 0) {
					return { source: 'nasa', items: valid };
				}
				// If bulk returned no valid items (often because range includes future dates), fall through to per-day
				console.warn('Bulk request returned no valid items — will try per-day requests');
			} else {
				// Non-ok bulk response (403/4xx/5xx)
				console.warn(`NASA API bulk returned ${res.status} — will try per-day requests`);
			}
		} catch (err) {
			console.warn('Bulk NASA API request failed — will try per-day requests', err);
		}

		// Bulk didn't yield usable data — attempt per-day requests for the requested range,
		// skipping future dates to avoid predictable "no data yet" responses.
		const start = new Date(startStr);
		const end = new Date(endStr);
		const today = new Date();
		const items = [];
		for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
			// skip dates in the future
			if (d > today) continue;
			const dayKey = formatDate(d);
			/* eslint-disable no-await-in-loop */
			const item = await fetchApodForDate(baseUrl, dayKey);
			/* eslint-enable no-await-in-loop */
			if (item && item.date) items.push(item);
		}

		if (items.length > 0) {
			// Return whatever NASA had for the individual dates
			return { source: 'nasa', items };
		}

		// If we get here, no NASA data found — fall back to CDN dataset
		console.warn('No NASA data found for range; falling back to CDN dataset');
		const fbRes = await fetch(FALLBACK_URL);
		if (!fbRes.ok) throw new Error(`Fallback fetch failed: ${fbRes.status}`);
		const fbData = await fbRes.json();
		return { source: 'fallback', items: Array.isArray(fbData) ? fbData : [fbData] };
	}

	// Build a map by date for fast lookup
	function buildDateMap(items) {
		const map = new Map();
		items.forEach((it) => {
			if (it && it.date) map.set(it.date, it);
		});
		return map;
	}

	// Handle form submit — compute start + 8 days (9-day window) and render exactly 9 cards
	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		const startDateValue = startInput.value;
		if (!startDateValue) {
			alert('Please choose a start date.');
			return;
		}

		const start = new Date(startDateValue);
		const end = addDays(start, 8); // 9 consecutive days: start + 8
		const startStr = formatDate(start);
		const endStr = formatDate(end);

		loading.hidden = false;
		loading.textContent = 'Loading gallery, please wait...';
		gallery.innerHTML = '';

		try {
			// fetchApodRange already tries bulk then per-day fallback; pass the 9-day window
			const result = await fetchApodRange(API_KEY, startStr, endStr);
			const items = result.items || [];
			const dateMap = buildDateMap(items);

			// If using fallback dataset, show short notice
			if (result.source === 'fallback') {
				loading.textContent = 'Using fallback dataset (NASA API unavailable). Showing available entries.';
			}

			// Render exactly 9 cards for start + 0..8
			for (let i = 0; i < 9; i++) {
				const day = addDays(start, i);
				const dayKey = formatDate(day);
				const item = dateMap.get(dayKey);

				const card = document.createElement('article');
				card.className = 'card';
				card.tabIndex = 0;

				const mediaWrap = document.createElement('div');
				mediaWrap.style.position = 'relative';

				const img = document.createElement('img');
				img.className = 'card-media';

				const body = document.createElement('div');
				body.className = 'card-body';
				const title = document.createElement('h3');
				title.className = 'card-title';
				const date = document.createElement('div');
				date.className = 'card-date';
				date.textContent = dayKey;

				if (item) {
					title.textContent = item.title || 'No title';
					if (item.media_type === 'image') {
						img.src = item.url;
						img.alt = item.title || 'APOD image';
					} else if (item.media_type === 'video') {
						// Use helper to pick a thumbnail for the video (prefer embed_url/thumbnail_url)
						const thumbSource = getVideoThumbnail(item.embed_url || item.url || '', item);
						img.src = thumbSource;
						img.alt = item.title || 'APOD video';
						const overlay = document.createElement('div');
						overlay.className = 'play-overlay';
						overlay.textContent = '▶ VIDEO';
						overlay.style.zIndex = '2';
						mediaWrap.appendChild(overlay);
					} else {
						img.src = 'img/nasa-worm-logo.png';
						img.alt = 'APOD media';
					}

					card.addEventListener('click', () => openModal(item));
					card.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') openModal(item); });
				} else {
					// Placeholder for missing day
					title.textContent = 'No APOD available';
					img.src = 'img/nasa-worm-logo.png';
					img.alt = 'No APOD';
					card.addEventListener('click', () => {
						modalTitle.textContent = 'No APOD available';
						modalDate.textContent = dayKey;
						modalExplanation.textContent = 'No Astronomy Picture of the Day is available for this date in the dataset.';
						modalMedia.innerHTML = `<img src="img/nasa-worm-logo.png" alt="No APOD">`;
						modal.setAttribute('aria-hidden', 'false');
					});
					card.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') card.click(); });
				}

				mediaWrap.appendChild(img);
				body.appendChild(title);
				body.appendChild(date);
				card.appendChild(mediaWrap);
				card.appendChild(body);
				gallery.appendChild(card);
			}

			// Hide loading after gallery is built
			loading.hidden = true;
		} catch (err) {
			console.error(err);
			loading.textContent = `Error loading data: ${err.message}`;
			// Keep message visible
		}
	});
});
