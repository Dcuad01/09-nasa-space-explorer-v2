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

	// Initialize start date defaults so the app is responsive on first load
	// - max: Oct 1 of the current year
	// - default value: Oct 1 minus 8 days (so we have a full 9-day window)
	const now = new Date();
	const currentYear = now.getFullYear();
	const oct1 = new Date(currentYear, 9, 1); // month 9 = October
	const defaultStart = new Date(oct1);
	defaultStart.setDate(oct1.getDate() - 8);
	// Apply to the input
	if (startInput) {
		startInput.max = `${oct1.getFullYear()}-${String(oct1.getMonth() + 1).padStart(2, '0')}-${String(oct1.getDate()).padStart(2, '0')}`;
		if (!startInput.value) {
			startInput.value = `${defaultStart.getFullYear()}-${String(defaultStart.getMonth() + 1).padStart(2, '0')}-${String(defaultStart.getDate()).padStart(2, '0')}`;
		}
	}

	// Optionally auto-load once so users see content right away
	if (form && startInput && startInput.value) {
		// Use requestSubmit for broad browser support
		setTimeout(() => form.requestSubmit(), 0);
	}

	// Modal elements
	const modal = document.getElementById('modal');
	const modalBackdrop = document.getElementById('modal-backdrop');
	const modalClose = document.getElementById('modal-close');
	const modalTitle = document.getElementById('modal-title');
	const modalDate = document.getElementById('modal-date');
	const modalMedia = document.getElementById('modal-media');
	const modalExplanation = document.getElementById('modal-explanation');

	// Data source: Classroom CDN feed (array of APOD-like entries)
	const DATA_URL = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

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

	// Helper: (simplified) choose a thumbnail for video; prefer provided thumbnail_url
	function getVideoThumbnail(url, item) {
		if (item && item.thumbnail_url) return item.thumbnail_url;
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

	// Fetch from CDN, verify array, filter inclusive by [start..end], sort ascending
	async function fetchFromCDN(startStr, endStr) {
		const url = `${DATA_URL}?v=${Date.now()}`; // cache-bust
		const res = await fetch(url);
		if (!res.ok) throw new Error(`CDN fetch failed: ${res.status} ${res.statusText} (${url})`);
		const data = await res.json();
		if (!Array.isArray(data)) throw new Error('CDN response is not an array');
		// Inclusive range filter
		const start = new Date(startStr);
		const end = new Date(endStr);
		const filtered = data.filter((it) => {
			if (!it || !it.date) return false;
			const d = new Date(it.date);
			return d >= start && d <= end;
		});
		filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
		return filtered;
	}

	// Build a map by date for fast lookup
	function buildDateMap(items) {
		const map = new Map();
		items.forEach((it) => {
			if (it && it.date) map.set(it.date, it);
		});
		return map;
	}

	// (Removed Oct 1 cutoff logic) — we use a simple 9-day inclusive window

	// Handle form submit — compute start + 8 days (9-day window) and render exactly 9 cards
	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		const startDateValue = startInput.value;
		if (!startDateValue) {
			alert('Please choose a start date.');
			return;
		}

		const start = new Date(startDateValue);
		// Compute the 9-day window (inclusive): start + 8 days = 9 total
		const fetchEnd = addDays(start, 8);

		const startStr = formatDate(start);
		const fetchEndStr = formatDate(fetchEnd);

		loading.hidden = false;
		loading.textContent = `Loading gallery for ${startStr} → ${fetchEndStr}...`;
		gallery.innerHTML = '';

		try {
			// Load and filter data for the 9-day window
			const itemsInRange = await fetchFromCDN(startStr, fetchEndStr);

			// Render 0..9 items sorted ascending by date
			itemsInRange.forEach((item) => {
				const card = document.createElement('article');
				card.className = 'card';
				card.tabIndex = 0;

				const mediaWrap = document.createElement('div');
				mediaWrap.style.position = 'relative';

				const body = document.createElement('div');
				body.className = 'card-body';
				const title = document.createElement('h3');
				title.className = 'card-title';
				title.textContent = item.title || 'Untitled';
				const date = document.createElement('div');
				date.className = 'card-date';
				date.textContent = item.date || '';

				if (item.media_type === 'image') {
					const img = document.createElement('img');
					img.className = 'card-media';
					img.src = item.url || item.hdurl;
					img.alt = item.title || 'APOD image';
					mediaWrap.appendChild(img);
				} else if (item.media_type === 'video') {
					if (item.thumbnail_url) {
						const a = document.createElement('a');
						a.href = item.url;
						a.target = '_blank';
						a.rel = 'noopener';
						a.addEventListener('click', (ev) => ev.stopPropagation());
						const img = document.createElement('img');
						img.className = 'card-media';
						img.src = item.thumbnail_url;
						img.alt = item.title || 'APOD video';
						a.appendChild(img);
						mediaWrap.appendChild(a);
						const overlay = document.createElement('div');
						overlay.className = 'play-overlay';
						overlay.textContent = '▶ VIDEO';
						overlay.style.zIndex = '2';
						mediaWrap.appendChild(overlay);
					} else {
						const iframe = document.createElement('iframe');
						iframe.src = item.url;
						iframe.title = item.title || 'APOD video';
						iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
						iframe.allowFullscreen = true;
						iframe.style.width = '100%';
						iframe.style.aspectRatio = '16 / 9';
						iframe.style.border = '0';
						iframe.className = 'card-media';
						mediaWrap.appendChild(iframe);
					}
				} else {
					const img = document.createElement('img');
					img.className = 'card-media';
					img.src = 'img/nasa-worm-logo.png';
					img.alt = 'APOD media';
					mediaWrap.appendChild(img);
				}

				card.addEventListener('click', () => openModal(item));
				card.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') openModal(item); });

				body.appendChild(title);
				body.appendChild(date);
				card.appendChild(mediaWrap);
				card.appendChild(body);
				gallery.appendChild(card);
			});

			// Hide loading after gallery is built
			loading.hidden = true;
		} catch (err) {
			console.error(err);
			loading.hidden = true;
			gallery.innerHTML = `<div class="loading" role="alert" style="border-left-color:#c00;color:#b91c1c"><strong>Error:</strong> ${err.message}</div>`;
		}
	});
});
