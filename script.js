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

	// Form and UI elements
	const form = document.getElementById('date-form');
	const startInput = document.getElementById('start-date');
	const endInput = document.getElementById('end-date');
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

	// Helper: detect YouTube ID
	function parseYouTubeId(url) {
		const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
		return m ? m[1] : null;
	}

	// Helper: detect Vimeo ID
	function parseVimeoId(url) {
		const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
		return m ? m[1] : null;
	}

	// Helper: is direct video file
	function isDirectVideo(url) {
		return /\.(mp4|webm|ogg)(?:\?|$)/i.test(url);
	}

	// Helper: get best thumbnail for a video item / url
	function getVideoThumbnail(url, item) {
		// Prefer thumbnail_url from API if present
		if (item && item.thumbnail_url) return item.thumbnail_url;
		// YouTube: derive thumbnail
		const yt = parseYouTubeId(url);
		if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
		// Vimeo: no free CDN thumbnail without extra request; fallback to item.url or worm logo
		if (parseVimeoId(url)) return item && item.url ? item.url : 'img/nasa-worm-logo.png';
		// Direct video: no thumbnail in many cases — fallback to worm logo
		if (isDirectVideo(url)) return 'img/nasa-worm-logo.png';
		// Default fallback
		return 'img/nasa-worm-logo.png';
	}

	// Helper: create embed element for modal given a video url
	function createVideoEmbed(url) {
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
			// Use helper to create best embed element
			const mediaEl = createVideoEmbed(item.url || '');
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

	// Handle form submit
	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		const startDateValue = startInput.value;
		const endDateValue = endInput.value;
		if (!startDateValue || !endDateValue) {
			alert('Please choose both start and end dates.');
			return;
		}

		const start = new Date(startDateValue);
		const end = new Date(endDateValue);
		if (start > end) {
			alert('Start date must be the same as or before the end date.');
			return;
		}

		const startStr = formatDate(start);
		const endStr = formatDate(end);

		loading.hidden = false;
		loading.textContent = 'Loading gallery, please wait...';
		gallery.innerHTML = '';

		try {
			const result = await fetchApodRange(API_KEY, startStr, endStr);
			let items = result.items || [];

			// If fallback, filter the fallback dataset to the requested date range
			if (result.source === 'fallback') {
				const dateMapAll = buildDateMap(items);
				// Build an array for each date in the requested range if present
				items = [];
				for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
					const key = formatDate(d);
					if (dateMapAll.has(key)) items.push(dateMapAll.get(key));
				}
				loading.textContent = 'Using fallback dataset (NASA API unavailable). Showing available entries.';
			}

			// Sort items chronologically
			items.sort((a, b) => new Date(a.date) - new Date(b.date));

			// Build gallery from items array (one card per returned item)
			if (items.length === 0) {
				// If nothing available, show a single placeholder card
				const card = document.createElement('article');
				card.className = 'card';
				card.innerHTML = `
					<div style="padding:18px">
						<h3 class="card-title">No APOD available for the selected range</h3>
						<div class="card-date">${startStr} → ${endStr}</div>
					</div>
				`;
				gallery.appendChild(card);
			} else {
				items.forEach((item) => {
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
					title.textContent = item.title || 'No title';
					const date = document.createElement('div');
					date.className = 'card-date';
					date.textContent = item.date || '';

					if (item.media_type === 'image') {
						img.src = item.url;
						img.alt = item.title || 'APOD image';
					} else if (item.media_type === 'video') {
						// Use helper to pick a thumbnail for the video
						const thumb = getVideoThumbnail(item.url || '', item);
						img.src = thumb;
						img.alt = item.title || 'APOD video';
						const overlay = document.createElement('div');
						overlay.className = 'play-overlay';
						overlay.textContent = '▶ VIDEO';
						mediaWrap.appendChild(overlay);
					} else {
						img.src = 'img/nasa-worm-logo.png';
						img.alt = 'APOD media';
					}

					mediaWrap.appendChild(img);
					body.appendChild(title);
					body.appendChild(date);
					card.appendChild(mediaWrap);
					card.appendChild(body);

					card.addEventListener('click', () => openModal(item));
					card.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') openModal(item); });

					gallery.appendChild(card);
				});
			}

			// Hide loading after gallery is built
			loading.hidden = true;
		} catch (err) {
			console.error(err);
			loading.textContent = `Error loading data: ${err.message}`;
			// Keep loading visible so user sees the error
		}
	});
});
