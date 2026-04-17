/**
 * 迷宫游戏主类 (ES6 Class requirement met)
 * 负责管理关卡、碰撞检测和事件状态
 */
class MazeGame {
    constructor() {
        // DOM 元素获取 (使用 querySelector，符合要求)
        this.body = document.querySelector('body');
        this.startScreen = document.querySelector('#start-screen');
        this.gameScreen = document.querySelector('#game-screen');
        this.scareScreen = document.querySelector('#scare-screen');
        this.container = document.querySelector('#game-container');
        this.playerEl = document.querySelector('#player');
        this.levelText = document.querySelector('#level-text');
        
        // 游戏状态变量 (使用 let/const，不使用 var)
        this.currentLevel = 0;
        this.isPlaying = false;
        this.isGlitching = false;
        this.playerRect = { x: 0, y: 0, w: 20, h: 20 };
        this.walls = [];
        this.goal = null;

        // 绑定事件 (使用箭头函数保留 this 上下文)
        document.querySelector('#start-btn').addEventListener('click', () => this.startGame());
        this.container.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // 关卡数据 (以百分比定位，适应容器大小)
        this.levels = [
            // Level 1: 简单的 S 型迷宫
            {
                startPos: { x: 20, y: 20 },
                goalPos: { x: 740, y: 540, w: 40, h: 40 },
                walls: [
                    { x: 0, y: 100, w: 600, h: 50 },
                    { x: 200, y: 300, w: 600, h: 50 }
                ]
            },
            // Level 2: 稍微复杂一点的回字形
            {
                startPos: { x: 20, y: 20 },
                goalPos: { x: 400, y: 300, w: 40, h: 40 },
                walls: [
                    { x: 100, y: 0, w: 50, h: 400 },
                    { x: 100, y: 400, w: 600, h: 50 },
                    { x: 650, y: 100, w: 50, h: 300 },
                    { x: 250, y: 100, w: 450, h: 50 },
                    { x: 250, y: 100, w: 50, h: 200 }
                ]
            },
            // Level 3: 恐怖主题长廊，带触发器
            {
                startPos: { x: 20, y: 280 },
                goalPos: { x: 740, y: 280, w: 40, h: 40 },
                walls: [
                    { x: 0, y: 0, w: 800, h: 250 },
                    { x: 0, y: 350, w: 800, h: 250 }
                ],
                triggerX: 400 // 走到 x=400 触发灵异事件
            }
        ];
    }

    /**
     * 初始化并开始游戏
     */
    startGame() {
        this.startScreen.classList.remove('active');
        this.gameScreen.classList.active = true;
        this.gameScreen.style.display = 'flex'; // 手动覆盖以防 flex 冲突
        this.loadLevel(0);
    }

    /**
     * 加载指定关卡并生成 DOM 元素
     * @param {number} levelIndex 
     */
    loadLevel(levelIndex) {
        this.currentLevel = levelIndex;
        this.levelText.innerText = levelIndex + 1;
        const levelData = this.levels[levelIndex];

        // 清空之前的墙壁和终点
        this.container.querySelectorAll('.wall, .goal, #enemy').forEach(el => el.remove());
        this.walls = [];
        this.isPlaying = true;
        this.isGlitching = false;

        // 设置玩家初始位置
        this.updatePlayerPosition(levelData.startPos.x, levelData.startPos.y);

        // 生成墙壁 (D.R.Y - 抽取了创建 DOM 元素的逻辑)
        levelData.walls.forEach(w => {
            const wallEl = this.createDOMElement('div', 'wall', w.x, w.y, w.w, w.h);
            this.container.appendChild(wallEl);
            this.walls.push(w);
        });

        // 生成终点
        const g = levelData.goalPos;
        this.goal = g;
        const goalEl = this.createDOMElement('div', 'goal', g.x, g.y, g.w, g.h);
        this.container.appendChild(goalEl);
    }

    /**
     * 工具函数：创建一个定位好的 DOM 元素
     */
    createDOMElement(tag, className, x, y, w, h) {
        const el = document.createElement(tag);
        el.className = className;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        return el;
    }

    /**
     * 处理鼠标在容器内的移动
     * @param {MouseEvent} e 
     */
    handleMouseMove(e) {
        if (!this.isPlaying || this.isGlitching) return;

        // 计算鼠标在容器内的相对坐标
        const rect = this.container.getBoundingClientRect();
        let mouseX = e.clientX - rect.left - (this.playerRect.w / 2);
        let mouseY = e.clientY - rect.top - (this.playerRect.h / 2);

        this.updatePlayerPosition(mouseX, mouseY);

        // 检测是否撞墙
        if (this.checkCollisionWithWalls()) {
            this.handleDeath();
            return;
        }

        // 检测是否到达终点
        if (this.checkOverlap(this.playerRect, this.goal)) {
            this.levelComplete();
            return;
        }

        // 第三关特殊事件检测
        if (this.currentLevel === 2 && this.playerRect.x > this.levels[2].triggerX && !this.body.classList.contains('horror-theme')) {
            this.triggerHorrorEvent();
        }
    }

    /**
     * 更新玩家 DOM 及逻辑位置
     */
    updatePlayerPosition(x, y) {
        this.playerRect.x = x;
        this.playerRect.y = y;
        this.playerEl.style.left = `${x}px`;
        this.playerEl.style.top = `${y}px`;
    }

    /**
     * AABB 矩形碰撞检测核心逻辑
     */
    checkOverlap(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.w &&
            rect1.x + rect1.w > rect2.x &&
            rect1.y < rect2.y + rect2.h &&
            rect1.y + rect1.h > rect2.y
        );
    }

    /**
     * 遍历检测是否撞到了任意一堵墙
     */
    checkCollisionWithWalls() {
        for (let i = 0; i < this.walls.length; i++) {
            if (this.checkOverlap(this.playerRect, this.walls[i])) {
                return true;
            }
        }
        return false;
    }

    /**
     * 触碰墙壁：重置位置 (这里你可以后期加入提示音效)
     */
    handleDeath() {
        // [作业提示：这里可以加上 "哎呀" 的音效]
        const startPos = this.levels[this.currentLevel].startPos;
        this.updatePlayerPosition(startPos.x, startPos.y);
    }

    /**
     * 过关逻辑
     */
    levelComplete() {
        this.isPlaying = false;
        // [作业提示：这里可以加上过关的欢快音效]
        if (this.currentLevel < this.levels.length - 1) {
            alert(`Level ${this.currentLevel + 1} Cleared!`);
            this.loadLevel(this.currentLevel + 1);
        } else {
            // 如果第三关不知为何走到了最后，可以直接进惊吓（防止 bug 漏网）
            this.triggerJumpScare();
        }
    }

    /**
     * 第三关剧变事件：失控、闪烁、主题切换、追逐战
     */
    triggerHorrorEvent() {
        this.isGlitching = true; // 冻结玩家鼠标操作
        this.body.classList.add('glitch-effect'); // 添加闪烁动画
        
        // [作业提示：这里立刻停止欢快 BGM，播放刺耳音效]

        setTimeout(() => {
            // 恢复后，世界变样了
            this.body.classList.remove('glitch-effect');
            this.body.classList.remove('cute-theme');
            this.body.classList.add('horror-theme');
            
            // [作业提示：这里开始播放恐怖心跳/低频 BGM]

            this.isGlitching = false; // 玩家恢复控制
            this.spawnEnemy(); // 生成大红方块开始追击
        }, 1500); // 失控 1.5 秒
    }

    /**
     * 生成追逐者
     */
    spawnEnemy() {
        const enemyEl = document.createElement('div');
        enemyEl.id = 'enemy';
        this.container.appendChild(enemyEl);
        
        // 敌人从起点出现
        let enemyRect = { x: 20, y: 280, w: 30, h: 30 };
        const speed = 4; // 设置比玩家鼠标稍慢但紧追不舍的速度

        // 使用箭头函数维持 this，实现游戏循环
        const chase = () => {
            if (!this.isPlaying) return;

            // 简单的追踪 AI：向玩家当前位置靠近
            if (enemyRect.x < this.playerRect.x) enemyRect.x += speed;
            if (enemyRect.x > this.playerRect.x) enemyRect.x -= speed;
            if (enemyRect.y < this.playerRect.y) enemyRect.y += speed;
            if (enemyRect.y > this.playerRect.y) enemyRect.y -= speed;

            enemyEl.style.left = `${enemyRect.x}px`;
            enemyEl.style.top = `${enemyRect.y}px`;

            // 如果敌人吃到了玩家
            if (this.checkOverlap(enemyRect, this.playerRect)) {
                this.triggerJumpScare();
                return;
            }
/**
 * 迷宫游戏主类
 */
class MazeGame {
    constructor() {
        // DOM 元素
        this.body = document.querySelector('body');
        this.startScreen = document.querySelector('#start-screen');
        this.gameScreen = document.querySelector('#game-screen');
        this.container = document.querySelector('#game-container');
        this.playerEl = document.querySelector('#player');
        this.levelText = document.querySelector('#level-text');
        this.gameOverMessage = document.querySelector('#game-over-message');
        this.bloodOverlay = document.querySelector('#blood-overlay');
        
        // 游戏状态
        this.currentLevel = 0;
        this.isPlaying = false;
        this.isGlitching = false;
        this.playerRect = { x: 0, y: 0, w: 20, h: 20 };
        // 用于修复闪现问题的鼠标偏移量
        this.mouseOffset = { x: 0, y: 0 };
        this.walls = [];
        this.goal = null;

        // 绑定事件
        document.querySelector('#start-btn').addEventListener('click', () => this.startGame());
        
        // 监听鼠标进入容器事件，计算偏移量
        this.container.addEventListener('mouseenter', (e) => this.handleMouseEnter(e));
        // 监听鼠标移动
        this.container.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // 关卡数据 (保持不变)
        this.levels = [
            // Level 1: 简单的 S 型迷宫
            { startPos: { x: 20, y: 20 }, goalPos: { x: 740, y: 540, w: 40, h: 40 }, walls: [{ x: 0, y: 100, w: 600, h: 50 }, { x: 200, y: 300, w: 600, h: 50 }] },
            // Level 2: 稍微复杂一点的回字形
            { startPos: { x: 20, y: 20 }, goalPos: { x: 400, y: 300, w: 40, h: 40 }, walls: [{ x: 100, y: 0, w: 50, h: 400 }, { x: 100, y: 400, w: 600, h: 50 }, { x: 650, y: 100, w: 50, h: 300 }, { x: 250, y: 100, w: 450, h: 50 }, { x: 250, y: 100, w: 50, h: 200 }] },
            // Level 3: 恐怖主题长廊
            { startPos: { x: 20, y: 280 }, goalPos: { x: 740, y: 280, w: 40, h: 40 }, walls: [{ x: 0, y: 0, w: 800, h: 250 }, { x: 0, y: 350, w: 800, h: 250 }], triggerX: 400 }
        ];
    }

    // ... 其他代码保持不变 ...

    startGame() {
        this.startScreen.classList.remove('active');
        this.gameScreen.classList.add('active'); // 修复布局问题
        this.loadLevel(0);
    }

    loadLevel(levelIndex) {
        // ... 前面的清空逻辑 ...
        this.goalEl = null; // 记录当前的终点元素
        
        // ... 生成墙壁逻辑 ...

        // 生成终点并记录引用
        const g = levelData.goalPos;
        this.goal = g;
        this.goalEl = this.createDOMElement('div', 'goal', g.x, g.y, g.w, g.h);
        this.container.appendChild(this.goalEl);
    }

    handleMouseMove(e) {
        if (!this.isPlaying || this.isGlitching) return;

        // ... 坐标计算和玩家位置更新 ...

        // 碰撞检测
        if (this.checkCollisionWithWalls()) {
            this.handleDeath();
            return;
        }

        // 正常终点检测 (仅在前两关或第三关闪烁前有效)
        if (this.goalEl && this.goalEl.style.display !== 'none') {
            if (this.checkOverlap(this.playerRect, this.goal)) {
                this.levelComplete();
                return;
            }
        }

        // 第三关特殊逻辑
        if (this.currentLevel === 2) {
            // 事件 A: 走到中间触发极速闪烁和终点消失
            if (this.playerRect.x > this.levels[2].triggerX && !this.body.classList.contains('horror-theme')) {
                this.triggerHorrorEvent();
            }

            // 事件 B: 闪烁过后，走到原终点附近，红方块突袭
            if (this.body.classList.contains('horror-theme') && !document.querySelector('#enemy')) {
                const distToGoal = Math.hypot(this.playerRect.x - this.goal.x, this.playerRect.y - this.goal.y);
                if (distToGoal < 60) { // 距离原终点60px内触发
                    this.spawnEnemy();
                }
            }
        }
    }

    triggerHorrorEvent() {
        this.isGlitching = true;
        this.body.classList.add('glitch-effect');
        
        // 极短的失控时间 (300ms)
        setTimeout(() => {
            this.body.classList.remove('glitch-effect');
            this.body.classList.remove('cute-theme');
            this.body.classList.add('horror-theme');
            
            // 关键：小绿球消失
            if (this.goalEl) this.goalEl.style.display = 'none';

            this.isGlitching = false;
        }, 300); 
    }

    spawnEnemy() {
        if (!this.isPlaying) return;
        
        const enemyEl = document.createElement('div');
        enemyEl.id = 'enemy';
        this.container.appendChild(enemyEl);
        
        // 敌人从屏幕左侧边缘或上方“瞬移”进入
        let enemyRect = { x: -50, y: 280, w: 40, h: 40 };
        const speed = 500; // 极速：大约 15-20 帧内就能跨越半个屏幕

        const chase = () => {
            if (!this.isPlaying) return;

            // 直线极速冲向玩家
            const dx = this.playerRect.x - enemyRect.x;
            const dy = this.playerRect.y - enemyRect.y;
            const angle = Math.atan2(dy, dx);
            
            enemyRect.x += Math.cos(angle) * speed;
            enemyRect.y += Math.sin(angle) * speed;

            enemyEl.style.left = `${enemyRect.x}px`;
            enemyEl.style.top = `${enemyRect.y}px`;

            if (this.checkOverlap(enemyRect, this.playerRect)) {
                this.triggerGameOver();
                return;
            }
            requestAnimationFrame(chase);
        };
        chase();
    }

    /**
     * 新的游戏结束逻辑：闪血 -> 结束 -> 慢慢浮现文字
     */
    triggerGameOver() {
        this.isPlaying = false; // 停止游戏循环和玩家控制
        
        // [作业提示：这里播放极具爆破力的尖叫/撞击音效！！！]

        // 1. 瞬间闪烁大片血红
        this.bloodOverlay.classList.add('flash');

        // 2. 慢慢浮现“GAME OVER”文字
        this.gameOverMessage.classList.add('fade-in');

        // (可选：几秒后回到主菜单)
        // setTimeout(() => {
        //     this.currentLevel = 0;
        //     this.loadLevel(0);
        // }, 6000); 
    }
}

// 初始化
window.onload = () => {
    new MazeGame();
};
            requestAnimationFrame(chase); // 循环调用
        };
        
        chase();
    }

    /**
     * 最终结局：Jump Scare
     */
    triggerJumpScare() {
        this.isPlaying = false;
        this.gameScreen.style.display = 'none';
        this.scareScreen.classList.add('active');
        
        // [作业提示：这里播放极具爆破力的尖叫/撞击音效！！！]
    }
}

// 当页面加载完成后，实例化游戏类 (初始化入口)
window.onload = () => {
    const myGame = new MazeGame();
};