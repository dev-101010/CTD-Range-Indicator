// ==UserScript==
// @name         CTD Range Indicator
// @namespace    https://github.com/dev-101010/CTD-Range-Indicator
// @version      0.1
// @description  Adds new range indicators for CTD
// @author       dev-101010
// @match        https://www.c-td.de/member/battlefield
// @icon         https://www.google.com/s2/favicons?sz=64&domain=c-td.de
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    //SOCKET START (from original script)

    const serverURI = "wss://ctd.drochmann.de:8125";

    let userData = null;

    const socket = io(serverURI, {
        reconnection: true,
        reconnectionDelayMax: 1000,
        reconnectionAttempts: 0,
        pingTimeout: 20000,
        pingInterval: 25000,

        auth: {
            authToken: authToken
        }
    });
    window.addEventListener('beforeunload', () => {
        socket.disconnect();
    });

    socket.on("connect", () => {
        socket.emit("authUser", {
            token: userToken
        });
        console.log("Connected");
    });
    socket.on("authSuccess", (data) => {
        console.log("Auth success");
    });

    socket.on("mapLoaded", (data) => {
        rangeIndicatorMapLoaded(data);
    });

    socket.on("updateUserDetails", (data) => {
        rangeIndicatorUpdateUserDetails(data);
    });

    socket.on("userTowerPlaced", (data) => {
        rangeIndicatorUserTowerPlaced(data);
    });

    socket.on("towerMainValuesChanged", (data) => {
        rangeIndicatorTowerMainValuesChanged(data);
    });

    socket.on("towerStatsValuesChanged", (data) => {
        rangeIndicatorTowerStatsValuesChanged(data);
    });

    socket.on("userTowerBeforeMove", (data) => {
        rangeIndicatorUserTowerBeforeMove(data);
    });

    socket.on("removeTower", (data) => {
        rangeIndicatorRemoveTower(data);
    });

    //SOCKEND END

    // CALC STATS FROM ORIGINAL SCRIPT START

    function calculateStats (basic, upgrade, boost, skill, buff, team) {
        let total = 0;
        let base = basic + upgrade;
        total += base;
        total += base * boost * 0.01;
        total += base * skill * 0.01;
        total += base * buff * 0.01;
        total += base * team * 0.01;

        return total;
    }

    // CALC STATS FROM ORIGINAL SCRIPT END

    // ADD CANVAS START

    const gridContainer = document.getElementById("gridContainer");

    // Get the parent of the target element
    const parent = gridContainer.parentElement;

    // Wrapper-Div erstellen
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.top = "0";
    wrapper.style.left = "0";
    wrapper.style.right = "0";
    wrapper.style.bottom = "0";
    wrapper.style.padding = "16px";
    wrapper.style.pointerEvents = "none";
    wrapper.style.zIndex = "10";
    wrapper.style.boxSizing = "border-box";

    // Canvas erstellen
    const canEl = document.createElement("canvas");
    canEl.id = "rangeCanvas";
    canEl.style.width = "100%";
    canEl.style.height = "100%";
    canEl.style.display = "block";
    canEl.style.pointerEvents = "none";

    // Optionale physikalische Auflösung setzen
    canEl.width = 1000;
    canEl.height = 1000;

    // Canvas ins Wrapper-Div
    wrapper.appendChild(canEl);
    // Wrapper ins Parent
    parent.appendChild(wrapper);

    // ADD CANVAS END

    //TRANSFER FUNKTIONS START

    function rangeIndicatorMapLoaded(data) {
        data.map.sizeX
        GRID_SIZE = data.map.sizeX;
        CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
        drawAll();
    }

    function rangeIndicatorUpdateUserDetails(data) {
        userData = data.user;
    }

    function rangeIndicatorUserTowerPlaced(data) {
        const userID = data.user.uid;

        const index = towers.findIndex((item) => item.id === userID);
        if(index !== -1) {
            towers.splice(index, 1);
        }

        let range = 0;
        const type = data.data.tower === 101 ? "buff" : "normal";
        const own = userID === userData.uid ? true : false;

        if(type === "buff") {
            range = data.data.skills.includes("supportDoubleRange") ? 2 : 1;
        }

        towers.push({ id: userID, x: data.data.posX, y: data.data.posY, range: range, type: type, own: own });

        drawAll();
    }

    function rangeIndicatorTowerMainValuesChanged(data) {
        const userID = data.user.uid;
        const tower = towers.find((item) => item.id === userID);
        if(tower) {
            const type = data.data.tower === 101 ? "buff" : "normal";
            const own = userID === userData.uid ? true : false;

            tower.x = data.data.posX;
            tower.y = data.data.posY;
            tower.type = type;
            tower.own = own;
        }

        drawAll();
    }

    function rangeIndicatorTowerStatsValuesChanged(data) {
        const userID = data.user.uid;
        const tower = towers.find((item) => item.id === userID);
        if(tower) {
            if(tower.type === "normal") {
                const rangeData = data.statsData.find((item) => item.name === "range");
                if(rangeData) {
                    const range = calculateStats(rangeData.basic, rangeData.upg, rangeData.boost, rangeData.skill, rangeData.buff, rangeData.team);
                    const tower = towers.find((item) => item.id === userID);
                    if(tower) {
                        tower.range = range / 2.5;
                    }
                }
            }
        }

        drawAll();
    }
    function rangeIndicatorUserTowerBeforeMove(data){
        const userID = data.user.uid;

        const index = towers.findIndex((item) => item.id === userID);
        if(index !== -1) {
            towers.splice(index, 1);
        }
        drawAll();
    }

    function rangeIndicatorRemoveTower(data) {
        const userID = data.user.uid;

        const index = towers.findIndex((item) => item.id === userID);
        if(index !== -1) {
            towers.splice(index, 1);
        }
        drawAll();
    }

    //TRANSFER FUNKTIONS END

    // DRAWING START

    const canvas = document.getElementById('rangeCanvas');
    const ctx = canvas.getContext('2d');

    const CANVAS_SIZE = 1000;

    let GRID_SIZE = 1;
    let CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

    const towers = [];

    let hoveredTile = null;

    function toCanvasCoord(x, y) {
        return {
            x: x,
            y: GRID_SIZE - 1 - y
        };
    }

    let pulseTime = 0;
    function animate() {
        pulseTime += 0.02; // kleinere Schrittweite = sanftere Animation
        drawAll();
        requestAnimationFrame(animate);
    }
    animate();

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

    function drawTowerRange(gridX, gridY, range, fill, stroke) {
        const pos = toCanvasCoord(gridX, gridY);
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

    function drawAll() {
        drawGrid();

        const pulse = 0.2 + Math.abs(Math.sin(pulseTime)) * 0.2; // 0.2 - 0.4

        for (const tower of towers) {
            if (tower.own && tower.type === 'normal') {
                drawTowerRange(
                    tower.x,
                    tower.y,
                    tower.range,
                    `rgba(0, 150, 255, ${pulse})`,
                    `rgba(0, 150, 255, ${pulse + 0.2})`
                );
            } else if (tower.own && tower.type === 'buff') {
                drawBuffTiles(tower, `rgba(0, 150, 255, ${pulse})`);
            }
        }

        if (hoveredTile) {
            const tower = towers.find(t => t.x === hoveredTile.x && t.y === hoveredTile.y);
            if (tower && !tower.own && tower.x === hoveredTile.x && tower.y === hoveredTile.y) {
                if (tower.type === 'normal') {
                    drawTowerRange(
                        tower.x,
                        tower.y,
                        tower.range,
                        `rgba(255, 80, 80, ${pulse})`,
                        `rgba(255, 80, 80, ${pulse + 0.2})`
                    );
                } else if (tower.type === 'buff') {
                    drawBuffTiles(tower, `rgba(255, 80, 80, ${pulse})`);
                }
            }
            drawHoveredTile();
        }
    }

    drawAll();

    // DRAWING END

    // MOUSE HANDLING START (on gridcontainer because rangeIndicator has no pointerEvents)

    gridContainer.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        const x = Math.floor(offsetX / (rect.width / GRID_SIZE));
        const y = GRID_SIZE - 1 - Math.floor(offsetY / (rect.height / GRID_SIZE));

        hoveredTile = { x, y };
        drawAll();
    });

    gridContainer.addEventListener("mouseleave", () => {
        hoveredTile = null;
        drawAll();
    });

    // MOUSE HANDLING END

})();
