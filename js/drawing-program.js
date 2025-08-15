// Çizim Programı - Modüler Versiyon
class DrawingProgram {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isDrawing = false;
        this.currentTool = 'pen';
        this.currentColor = '#ff0000';
        this.currentThickness = 3;
        this.startX = 0;
        this.startY = 0;
        this.imageData = null; // Preview için
        
        this.init();
    }

    init() {
        this.resizeCanvas();
        this.setupEventListeners();
        this.setupTools();
        
        // Canvas context ayarları
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Pencere boyutu değiştiğinde canvas'ı yeniden boyutlandır
        window.addEventListener('resize', () => {
            setTimeout(() => this.resizeCanvas(), 100);
        });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Canvas boyutunu ayarla
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Canvas stil boyutunu da ayarla
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Context ayarlarını yeniden uygula
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    setupEventListeners() {
        // Mouse olayları
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', (e) => this.stopDrawing(e));
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch olayları
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.canvas.dispatchEvent(new MouseEvent('mouseup', {}));
        });
    }

    setupTools() {
        // Renk seçici
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) {
            colorPicker.addEventListener('change', (e) => {
                this.currentColor = e.target.value;
            });
        }

        // Kalınlık slider
        const thicknessSlider = document.getElementById('thicknessSlider');
        const thicknessValue = document.getElementById('thicknessValue');
        if (thicknessSlider && thicknessValue) {
            thicknessSlider.addEventListener('input', (e) => {
                this.currentThickness = parseInt(e.target.value);
                thicknessValue.textContent = e.target.value + 'px';
            });
        }
    }

    setTool(tool) {
        this.currentTool = tool;
        
        // Aktif tool butonunu güncelle
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        const activeButton = document.getElementById(tool + 'Tool');
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        // Cursor'u araç tipine göre ayarla
        this.canvas.className = this.canvas.className.replace(/\w+-cursor/g, '');
        switch(tool) {
            case 'text':
                this.canvas.classList.add('text-cursor');
                break;
            case 'pen':
                this.canvas.classList.add('pen-cursor');
                break;
            default:
                this.canvas.classList.add('shape-cursor');
        }
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.startX = pos.x;
        this.startY = pos.y;

        // Geometrik şekiller için başlangıç durumunu kaydet
        if (this.currentTool !== 'pen' && this.currentTool !== 'text') {
            this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        }

        if (this.currentTool === 'pen') {
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, this.startY);
        } else if (this.currentTool === 'text') {
            this.addText(this.startX, this.startY);
            this.isDrawing = false;
        }
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePos(e);
        
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.currentThickness;

        if (this.currentTool === 'pen') {
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.stroke();
        } else if (this.currentTool !== 'text') {
            // Preview için önceki durumu geri yükle
            this.ctx.putImageData(this.imageData, 0, 0);
            
            // Preview çiz
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.currentThickness;
            this.ctx.beginPath();
            
            switch(this.currentTool) {
                case 'line':
                    this.ctx.moveTo(this.startX, this.startY);
                    this.ctx.lineTo(pos.x, pos.y);
                    break;
                case 'arrow':
                    this.drawArrow(this.startX, this.startY, pos.x, pos.y);
                    break;
                case 'doublearrow':
                    this.drawDoubleArrow(this.startX, this.startY, pos.x, pos.y);
                    break;
                case 'rectangle':
                    this.ctx.rect(this.startX, this.startY, pos.x - this.startX, pos.y - this.startY);
                    break;
                case 'circle':
                    const centerX = (this.startX + pos.x) / 2;
                    const centerY = (this.startY + pos.y) / 2;
                    const radius = Math.sqrt(Math.pow(pos.x - this.startX, 2) + Math.pow(pos.y - this.startY, 2)) / 2;
                    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                    break;
            }
            if (this.currentTool !== 'arrow' && this.currentTool !== 'doublearrow') {
                this.ctx.stroke();
            }
        }
    }

    stopDrawing(e) {
        if (!this.isDrawing) return;
        this.isDrawing = false;
    }

    addText(x, y) {
        const text = prompt('Eklemek istediğiniz metni girin:');
        if (text) {
            this.ctx.fillStyle = this.currentColor;
            this.ctx.font = `${Math.max(this.currentThickness * 5, 16)}px Arial`;
            this.ctx.fillText(text, x, y);
        }
    }

    drawArrow(fromX, fromY, toX, toY) {
        const headLength = Math.max(this.currentThickness * 3, 10);
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);

        // Ana çizgi
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.stroke();

        // Ok başı
        this.ctx.beginPath();
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(
            toX - headLength * Math.cos(angle - Math.PI / 6),
            toY - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(
            toX - headLength * Math.cos(angle + Math.PI / 6),
            toY - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
    }

    drawDoubleArrow(fromX, fromY, toX, toY) {
        const headLength = Math.max(this.currentThickness * 3, 10);
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);

        // Ana çizgi
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.stroke();

        // İlk ok başı (sağ taraf)
        this.ctx.beginPath();
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(
            toX - headLength * Math.cos(angle - Math.PI / 6),
            toY - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(
            toX - headLength * Math.cos(angle + Math.PI / 6),
            toY - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();

        // İkinci ok başı (sol taraf)
        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(
            fromX + headLength * Math.cos(angle - Math.PI / 6),
            fromY + headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(
            fromX + headLength * Math.cos(angle + Math.PI / 6),
            fromY + headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    save() {
        const dataURL = this.canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `fizik-cizim-${new Date().getTime()}.png`;
        link.href = dataURL;
        link.click();
    }
}

// Drawing Manager - Çizim programını yöneten ana sınıf
class DrawingManager {
    constructor() {
        this.drawingProgram = null;
        this.isActive = false;
        this.init();
    }

    init() {
        this.createDrawingInterface();
        this.setupEventListeners();
        this.initializeDrawingProgram();
    }

    createDrawingInterface() {
        // Çizim overlay'ini oluştur
        const overlay = document.createElement('div');
        overlay.className = 'drawing-overlay';
        overlay.id = 'drawingOverlay';
        
        overlay.innerHTML = `
            <div class="drawing-toolbar">
                <div class="tool-group">
                    <button class="tool-btn active" onclick="drawingManager.setTool('pen')" id="penTool">
                        ✏️ Kalem
                    </button>
                    <button class="tool-btn" onclick="drawingManager.setTool('line')" id="lineTool">
                        📏 Çizgi
                    </button>
                    <button class="tool-btn" onclick="drawingManager.setTool('arrow')" id="arrowTool">
                        ➡️ Ok
                    </button>
                    <button class="tool-btn" onclick="drawingManager.setTool('doublearrow')" id="doublearrowTool">
                        ↔️ Çift Ok
                    </button>
                    <button class="tool-btn" onclick="drawingManager.setTool('rectangle')" id="rectangleTool">
                        ⬜ Dikdörtgen
                    </button>
                    <button class="tool-btn" onclick="drawingManager.setTool('circle')" id="circleTool">
                        ⭕ Daire
                    </button>
                    <button class="tool-btn" onclick="drawingManager.setTool('text')" id="textTool">
                        📝 Metin
                    </button>
                </div>
                
                <div class="tool-group">
                    <span class="tool-label">Renk:</span>
                    <input type="color" class="color-picker" id="colorPicker" value="#ff0000">
                </div>
                
                <div class="tool-group">
                    <span class="tool-label">Kalınlık:</span>
                    <input type="range" class="thickness-slider" id="thicknessSlider" min="1" max="20" value="3">
                    <span class="thickness-value" id="thicknessValue">3px</span>
                </div>
                
                <div class="tool-group">
                    <button class="tool-btn" onclick="drawingManager.clearCanvas()">
                        🗑️ Temizle
                    </button>
                    <button class="tool-btn" onclick="drawingManager.saveDrawing()">
                        💾 Kaydet
                    </button>
                </div>
                
                <div class="tool-group">
                    <span class="tool-label">📖 Çıkış: Ctrl+Space</span>
                </div>
            </div>
            
            <div class="canvas-container">
                <canvas id="drawingCanvas"></canvas>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }

    setupEventListeners() {
        // Klavye kısayolu: Ctrl + Space
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault();
                this.toggleDrawingMode();
            }
        });
    }

    initializeDrawingProgram() {
        const canvas = document.getElementById('drawingCanvas');
        if (canvas) {
            this.drawingProgram = new DrawingProgram(canvas);
        }
    }

    toggleDrawingMode() {
        const overlay = document.getElementById('drawingOverlay');
        
        if (this.isActive) {
            overlay.classList.remove('active');
            this.isActive = false;
        } else {
            overlay.classList.add('active');
            this.isActive = true;
            
            // Canvas boyutunu yeniden ayarla
            if (this.drawingProgram) {
                setTimeout(() => {
                    this.drawingProgram.resizeCanvas();
                }, 100);
            }
        }
    }

    setTool(tool) {
        if (this.drawingProgram) {
            this.drawingProgram.setTool(tool);
        }
    }

    clearCanvas() {
        if (this.drawingProgram) {
            this.drawingProgram.clear();
        }
    }

    saveDrawing() {
        if (this.drawingProgram) {
            this.drawingProgram.save();
        }
    }
}

// Global instance
let drawingManager;

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    drawingManager = new DrawingManager();
});