// rangeModul.js
(function(window) {
    let gridContainer = null;
    let canvas = null;
    let ctx = null;

    const CANVAS_SIZE = 1000;
    let GRID_SIZE = 1;
    let CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

    const towers = [];
    let userData = null;
    let hoveredTile = null;
    let pulseTime = 0;

    function init(container, canvasElement) {
        gridContainer = container;
        canvas = canvasElement;
        ctx = canvas.getContext('2d');

        gridContainer.addEventListener("mousemove", handleMouseMove);
        gridContainer.addEventListener("mouseleave", handleMouseLeave);

        animate();
    }

    function mapLoaded(data) {
        GRID_SIZE = data.map.sizeX;
        CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
        drawAll();
    }

    function updateUserDetails(data) {
        userData = data.user;
    }

    function userTowerPlaced(data) {
        const userID = data.user.uid;
        const index = towers.findIndex(item => item.id === userID);
        if (index !== -1) towers.splice(index, 1);

        let range = 0;
        const type = data.data.tower === 101 ? "buff" : "normal";
        const own = userID === userData.uid;

        if (type === "buff") {
            range = data.data.skills.includes("supportDoubleRange") ? 2 : 1;
        }

        towers.push({ id: userID, x: data.data.posX, y: data.data.posY, range, type, own });
        drawAll();
    }

    function towerMainValuesChanged(data) {
        const userID = data.user.uid;
        const tower = towers.find(item => item.id === userID);
        if (tower) {
            tower.x = data.data.posX;
            tower.y = data.data.posY;
            tower.type = data.data.tower === 101 ? "buff" : "normal";
            tower.own = userID === userData.uid;
        }
        drawAll();
    }

    function towerStatsValuesChanged(data) {
        const userID = data.user.uid;
        const tower = towers.find(item => item.id === userID);
        if (tower && tower.type === "normal") {
            const rangeData = data.statsData.find(item => item.name === "range");
            if (rangeData) {
                const range = calculateStats(rangeData) || 2.5;
                tower.range = range / 2.5;
            }
        }
        drawAll();
    }

    function userTowerBeforeMove(data) {
        const userID = data.user.uid;
        const index = towers.findIndex(item => item.id === userID);
        if (index !== -1) towers.splice(index, 1);
        drawAll();
    }

    function removeTower(data) {
        const userID = data.user.uid;
        const index = towers.findIndex(item => item.id === userID);
        if (index !== -1) towers.splice(index, 1);
        drawAll();
    }

    function calculateStats(stat) {
        let total = 0;
        let base = stat.basic + stat.upg;
        total += base;
        total += (base * stat.boost * 0.01) || 0;
        total += (base * stat.skill * 0.01) || 0;
        total += (base * stat.buff * 0.01) || 0;
        total += (base * stat.item * 0.01) || 0;
        total += (base * stat.team * 0.01) || 0;
        total += (base * stat.res1 * 0.01) || 0;
        total += (base * stat.res2 * 0.01) || 0;
        total += (base * stat.res3 * 0.01) || 0;
        return total;
    }

    function animate() {
        pulseTime += 0.02;
        drawAll();
        requestAnimationFrame(animate);
    }

    function drawAll() {
        drawGrid();

        const pulse = 0.2 + Math.abs(Math.sin(pulseTime)) * 0.2;

        for (const tower of towers) {
            if (tower.own && tower.type === 'normal') {
                drawTowerRange(tower.x, tower.y, tower.range,
                    `rgba(0, 150, 255, ${pulse})`, `rgba(0, 150, 255, ${pulse + 0.2})`);
            } else if (tower.own && tower.type === 'buff') {
                drawBuffTiles(tower, `rgba(0, 150, 255, ${pulse})`);
            }
        }

        if (hoveredTile) {
            const tower = towers.find(t => t.x === hoveredTile.x && t.y === hoveredTile.y);
            if (tower && !tower.own) {
                if (tower.type === 'normal') {
                    drawTowerRange(tower.x, tower.y, tower.range,
                        `rgba(255, 80, 80, ${pulse})`, `rgba(255, 80, 80, ${pulse + 0.2})`);
                } else if (tower.type === 'buff') {
                    drawBuffTiles(tower, `rgba(255, 80, 80, ${pulse})`);
                }
            }
            drawHoveredTile();
        }
    }

    function drawGrid() {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.strokeStyle = "#ccc";
        ctx.lineWidth = 1;

        for (let i = 0; i <= GRID_SIZE; i++) {
            const pos = i * CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, CANVAS_SIZE);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(CANVAS_SIZE, pos);
            ctx.stroke();
        }
    }

    function drawTowerRange(x, y, range, fill, stroke) {
        const pos = toCanvasCoord(x, y);
        const centerX = pos.x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = pos.y * CELL_SIZE + CELL_SIZE / 2;
        const radius = range * CELL_SIZE;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = fill;
        ctx.fill();

        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function drawBuffTiles(tower, color) {
        const { x, y, range } = tower;
        ctx.fillStyle = color;
        for (let dx = -range; dx <= range; dx++) {
            for (let dy = -range; dy <= range; dy++) {
                if (dx === 0 && dy === 0) continue;
                if (Math.abs(dx) === range || Math.abs(dy) === range) {
                    const tx = x + dx;
                    const ty = y + dy;
                    if (tx >= 0 && ty >= 0 && tx < GRID_SIZE && ty < GRID_SIZE) {
                        const pos = toCanvasCoord(tx, ty);
                        ctx.fillRect(pos.x * CELL_SIZE, pos.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                    }
                }
            }
        }
    }

    function drawHoveredTile() {
        if (!hoveredTile) return;
        const pos = toCanvasCoord(hoveredTile.x, hoveredTile.y);
        ctx.strokeStyle = "rgba(50, 50, 50, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pos.x * CELL_SIZE, pos.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }

    function toCanvasCoord(x, y) {
        return {
            x: x,
            y: GRID_SIZE - 1 - y
        };
    }

    function handleMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        const x = Math.floor(offsetX / (rect.width / GRID_SIZE));
        const y = GRID_SIZE - 1 - Math.floor(offsetY / (rect.height / GRID_SIZE));
        hoveredTile = { x, y };
        drawAll();
    }

    function handleMouseLeave() {
        hoveredTile = null;
        drawAll();
    }

    // Public API
    window.rangeModul = {
        init,
        mapLoaded,
        updateUserDetails,
        userTowerPlaced,
        towerMainValuesChanged,
        towerStatsValuesChanged,
        userTowerBeforeMove,
        removeTower
    };

})(window);
