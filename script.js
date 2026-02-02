// Canvas setup
const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
const canvasWrapper = document.getElementById('canvasWrapper');
const placeholder = document.getElementById('placeholder');
let currentImage = null;
let memeHistory = JSON.parse(localStorage.getItem('memeHistory')) || [];

// Initialize canvas
canvas.width = 800;
canvas.height = 600;

// Load image
document.getElementById('imageUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                currentImage = img;
                resizeCanvas(img);
                placeholder.style.display = 'none';
                canvasWrapper.classList.add('has-image');
                drawMeme();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Real-time text update
['topText', 'bottomText', 'fontSize', 'textColor', 'strokeColor', 'fontFamily'].forEach(id => {
    document.getElementById(id).addEventListener('input', drawMeme);
});

function resizeCanvas(img) {
    const maxWidth = 800;
    const maxHeight = 800;
    let width = img.width;
    let height = img.height;

    if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
    }
    if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;
}

function drawMeme() {
    if (!currentImage) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

    // Get text settings
    const topText = document.getElementById('topText').value.toUpperCase();
    const bottomText = document.getElementById('bottomText').value.toUpperCase();
    const fontSize = parseInt(document.getElementById('fontSize').value);
    const textColor = document.getElementById('textColor').value;
    const strokeColor = document.getElementById('strokeColor').value;
    const fontFamily = document.getElementById('fontFamily').value;

    // Set text style
    ctx.font = `${fontSize}px "${fontFamily}"`;
    ctx.fillStyle = textColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = Math.max(2, fontSize / 15);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.lineJoin = 'round';

    // Draw top text
    if (topText) {
        const topY = fontSize / 2;
        ctx.strokeText(topText, canvas.width / 2, topY);
        ctx.fillText(topText, canvas.width / 2, topY);
    }

    // Draw bottom text
    if (bottomText) {
        const bottomY = canvas.height - fontSize * 1.5;
        ctx.strokeText(bottomText, canvas.width / 2, bottomY);
        ctx.fillText(bottomText, canvas.width / 2, bottomY);
    }
}

function downloadMeme() {
    if (!currentImage) {
        alert('Veuillez d\'abord charger une image.');
        return;
    }

    // Save to history
    const memeData = canvas.toDataURL('image/png');
    const meme = {
        data: memeData,
        date: new Date().toLocaleString('fr-FR', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    memeHistory.unshift(meme);
    
    if (memeHistory.length > 24) {
        memeHistory = memeHistory.slice(0, 24);
    }
    
    localStorage.setItem('memeHistory', JSON.stringify(memeHistory));
    updateGallery();

    // Download
    const link = document.createElement('a');
    link.download = `meme_${Date.now()}.png`;
    link.href = memeData;
    link.click();

    // Visual feedback
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Téléchargé';
    btn.style.background = '#10b981';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 2000);
}

function shareMeme() {
    if (!currentImage) {
        alert('Veuillez d\'abord charger une image.');
        return;
    }

    canvas.toBlob(async (blob) => {
        const file = new File([blob], 'meme.png', { type: 'image/png' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'Mon Mème',
                    text: 'Regardez ce mème que j\'ai créé !'
                });
            } catch (err) {
                console.log('Partage annulé');
            }
        } else {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = 'Copié';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            } catch (err) {
                alert('Impossible de partager. Utilisez le bouton Télécharger.');
            }
        }
    });
}

function clearCanvas() {
    if (confirm('Voulez-vous vraiment tout effacer ?')) {
        currentImage = null;
        document.getElementById('topText').value = '';
        document.getElementById('bottomText').value = '';
        document.getElementById('imageUpload').value = '';
        placeholder.style.display = 'block';
        canvasWrapper.classList.remove('has-image');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function updateGallery() {
    const gallery = document.getElementById('gallery');
    
    if (memeHistory.length === 0) {
        gallery.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3>Aucune création</h3>
                <p>Créez votre premier mème pour commencer</p>
            </div>
        `;
        return;
    }

    gallery.innerHTML = memeHistory.map((meme, index) => `
        <div class="meme-card" onclick="openModal(${index})">
            <img src="${meme.data}" alt="Meme ${index + 1}">
            <div class="meme-card-footer">
                <div class="meme-date">${meme.date}</div>
            </div>
        </div>
    `).join('');
}

function openModal(index) {
    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modalImage');
    modalImage.src = memeHistory[index].data;
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Theme toggle functionality
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update icons
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    
    if (newTheme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }
}

// Initialize theme from localStorage
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const html = document.documentElement;
    html.setAttribute('data-theme', savedTheme);
    
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    
    if (savedTheme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }
}

// Initialize theme and gallery
initTheme();
updateGallery();
