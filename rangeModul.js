// rangeModul.js
(function(window) {
    let gridContainer = null;
    let canvas = null;
    let ctx = null;

    const CANVAS_SIZE = 1000;
    let GRID_SIZE = 1;
    let CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

    let tiles = [];

    let towers = [];
    let userData = null;
    let hoveredTile = null;
    let pulseTime = 0;

    let reservedTiles = [];
    let possibleTowerData = [];
    let tempTower = null;

    let colors = {
        ownColor: [0, 150, 255],
        enemyColor: [255, 80, 80],
        tempColor: [255, 255, 0],
        ownHoverColor: [0, 0, 255],
        enemyHoverColor: [100, 0, 0],
        tempHoverColor: [0, 150, 255],
        groundHoverColor: [0, 100, 0]
    };

    let lastFrameTime = 0;
    const fpsLimit = 20;
    const frameDuration = 1000 / fpsLimit;
    let lastTimestamp = performance.now();

    function init(container, canvasElement, colorConfig = {}) {
        gridContainer = container;
        canvas = canvasElement;
        ctx = canvas.getContext('2d');

        gridContainer.addEventListener("mousemove", handleMouseMove);
        gridContainer.addEventListener("mouseleave", handleMouseLeave);

        animate();
    }

    function mapLoaded(data) {
        tiles = data.tiles;
        GRID_SIZE = data.map.sizeX;
        CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
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
    }

    function towerStatsValuesChanged(data) {
        const userID = data.user.uid;
        const tower = towers.find(item => item.id === userID);
        if (tower && tower.type === "normal") {
            const rangeData = data.statsData.find(item => item.name === "range");
            if (rangeData) {
                const range = calculateStats(rangeData);
                tower.range = range / 2.5;
            }
        }
    }

    function userTowerBeforeMove(data) {
        const userID = data.user.uid;
        const index = towers.findIndex(item => item.id === userID);
        if (index !== -1) towers.splice(index, 1);
    }

    function possibleTowers(data) {
        possibleTowerData = data.data;
    }
    
    function mapClosed(data) {
        tiles = [];
        towers = [];
        GRID_SIZE = 1
    }

    function userReservedTile(data) {
        const userID = data.user.uid;
        const own = userID === userData.uid;
        possibleTowerData = [];
        reservedTiles.push({x:data.posX,y:data.posY,own});
        tempTower = null;
    }

    function tileAbandoned(data) {
        possibleTowerData = [];
        const index = reservedTiles.findIndex(tile => tile.posX === data.posX && tile.posY === data.posY);
        if (index !== -1) reservedTiles.splice(index, 1);
        tempTower = null;
    }

    function removeTower(data) {
        const userID = data.user.uid;
        const index = towers.findIndex(item => item.id === userID);
        if (index !== -1) towers.splice(index, 1);
    }

    function selectTempTower(towerID) {
        const reservedTile = reservedTiles.find(tile => tile.own === true);
        if(reservedTile) {
            const tower = possibleTowerData.find(item => item.tower === towerID);
            if(tower) {
                let range = 0;
                const type = towerID === 101 ? "buff" : "normal";

                if (type === "buff") {
                    range = tower.skills.includes("supportDoubleRange") ? 2 : 1;
                }
                if (type === "normal") {
                    const rangeData = tower.userTowerStats.find(item => item.name === "range");
                    if (rangeData) {
                        const r = calculateStats(rangeData) || 2.5;
                        range = r / 2.5;
                    }
                }
                tempTower = { x: reservedTile.x, y: reservedTile.y, range, type };
            }
        }
    }

    function calculateStats(stat) {
        let total = 0;
        let base = (stat.basic || 2.5) + (stat.upg || 0);
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

    function animate(timestamp) {
        if (timestamp - lastFrameTime >= frameDuration) {
            const delta = (timestamp - lastTimestamp) / 1000;
            lastTimestamp = timestamp;

            pulseTime += delta * 1.2;

            drawAll();
            lastFrameTime = timestamp;
        }
        requestAnimationFrame(animate);
    }

    function rgba(color, alpha) {
        return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
    }

    function drawAll() {
        drawGrid();

        const pulse = 0.2 + Math.abs(Math.sin(pulseTime)) * 0.2;

        if(tempTower) {
            if (tempTower.type === 'normal') {
                drawTowerRange(tempTower.x, tempTower.y, tempTower.range,
                               rgba(colors.tempColor, pulse), rgba(colors.tempColor, pulse + 0.2));
            } else if (tempTower.type === 'buff') {
                drawBuffTiles(tempTower, rgba(colors.tempColor, pulse), rgba(colors.tempColor, pulse + 0.2));
            }
        }

        for (const tower of towers) {
            if (tower.own && tower.type === 'normal') {
                drawTowerRange(tower.x, tower.y, tower.range,
                               rgba(colors.ownColor, pulse), rgba(colors.ownColor, pulse + 0.2));
            } else if (tower.own && tower.type === 'buff') {
                drawBuffTiles(tower, rgba(colors.ownColor, pulse), rgba(colors.ownColor, pulse + 0.2));
            }
        }

        if (hoveredTile) {
            const tower = towers.find(t => t.x === hoveredTile.x && t.y === hoveredTile.y);
            if (tower && !tower.own) {
                if (tower.type === 'normal') {
                    drawTowerRange(tower.x, tower.y, tower.range,
                                   rgba(colors.enemyColor, pulse), rgba(colors.enemyColor, pulse + 0.2));
                } else if (tower.type === 'buff') {
                    drawBuffTiles(tower, rgba(colors.enemyColor, pulse), rgba(colors.enemyColor, pulse + 0.2));
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

    function drawBuffTiles(tower, fillColor, strokeColor) {
        const { x, y, range } = tower;
        ctx.fillStyle = fillColor;

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

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;

        const outerTopLeft = toCanvasCoord(x - range, y + range);
        const outerBottomRight = toCanvasCoord(x + range, y - range);
        ctx.strokeRect(
            outerTopLeft.x * CELL_SIZE,
            outerTopLeft.y * CELL_SIZE,
            (outerBottomRight.x - outerTopLeft.x + 1) * CELL_SIZE,
            (outerBottomRight.y - outerTopLeft.y + 1) * CELL_SIZE
        );

        const innerTopLeft = toCanvasCoord(x - (range - 1), y + (range - 1));
        const innerBottomRight = toCanvasCoord(x + (range - 1), y - (range - 1));
        ctx.strokeRect(
            innerTopLeft.x * CELL_SIZE,
            innerTopLeft.y * CELL_SIZE,
            (innerBottomRight.x - innerTopLeft.x + 1) * CELL_SIZE,
            (innerBottomRight.y - innerTopLeft.y + 1) * CELL_SIZE
        );
    }

    function drawHoveredTile() {
        if (!hoveredTile) return;
        const foundTile = tiles.find(tile => tile.tileX === hoveredTile.x && tile.tileY === hoveredTile.y);
        const foundTower = towers.find(t => t.x === hoveredTile.x && t.y === hoveredTile.y);
        const foundReserved = reservedTiles.find(t => t.x === hoveredTile.x && t.y === hoveredTile.y);
        if(foundTile && foundTile.type === "ground") {
            if(foundTower && foundTower.own) {
                const pos = toCanvasCoord(hoveredTile.x, hoveredTile.y);
                ctx.strokeStyle = rgba(color.ownHoverColor,1);
                ctx.lineWidth = 3;
                ctx.strokeRect(pos.x * CELL_SIZE, pos.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            } elseif(foundTower) {
                const pos = toCanvasCoord(hoveredTile.x, hoveredTile.y);
                ctx.strokeStyle = rgba(color.enemyHoverColor,1);
                ctx.lineWidth = 3;
                ctx.strokeRect(pos.x * CELL_SIZE, pos.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            } elseif(foundReserved) {
                const pos = toCanvasCoord(hoveredTile.x, hoveredTile.y);
                ctx.strokeStyle = rgba(color.tempHoverColor,1);
                ctx.lineWidth = 3;
                ctx.strokeRect(pos.x * CELL_SIZE, pos.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            } else {
                const pos = toCanvasCoord(hoveredTile.x, hoveredTile.y);
                ctx.strokeStyle = rgba(color.groundHoverColor,1);
                ctx.lineWidth = 3;
                ctx.strokeRect(pos.x * CELL_SIZE, pos.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
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
    }

    function handleMouseLeave() {
        hoveredTile = null;
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
        removeTower,
        possibleTowers,
        mapClosed,
        tileAbandoned,
        userReservedTile,
        selectTempTower
    };

})(window);
