var Local = function (socket) {
    //游戏对象
    var game;
    //timer&move
    var INTERVAL = 2000;
    var timer = null;
    //时间计数器
    var time = 0;
    var timeCount = 0;
    //绑定键盘事件
    var bindKeyEvent = function () {
        document.onkeydown = function (e) {
            if (e.keyCode == 38) { //up
                game.rotate();
                socket.emit('rotate');
            } else if (e.keyCode == 39) { //right
                game.right();
                socket.emit('right');
            } else if (e.keyCode == 40) { //down
                game.down();
                socket.emit('down');
            } else if (e.keyCode == 37) { //left
                game.left();
                socket.emit('left');
            } else if (e.keyCode == 32) { //space
                game.fall();
                socket.emit('fall');
            }
        }
    }
    //随机生成下一个方块种类
    var generateType = function () {
        return Math.ceil(Math.random() * 7) - 1;
    }
    //随机生产下一个方块旋转方向
    var generateDir = function () {
        return Math.ceil(Math.random() * 4) - 1;
    }
    //开始
    var move = function () {
        timeFunc();
        if (!game.down()) {
            game.fixed();
            socket.emit('fixed');
            var line = game.checkClear();
            if (line) {
                game.addScore(line);
                socket.emit('line', line);
                if (line > 1) {
                    bottomlines = generateBottomLine(1);
                    socket.emit('bottomlines', bottomlines);
                }
            }
            var gameOver = game.checkGameOver();
            if (gameOver) {
                game.gameover(false);
                document.getElementById('remote_gameover').innerHTML = '你赢了';
                socket.emit('lose');
                stop();
            } else {
                var t = generateType();
                var d = generateDir();
                game.performNext(t, d);
                socket.emit('next', {
                    type: t,
                    dir: d
                })
            }
        } else {
            socket.emit('down');
        }
    }
    //随机生成干扰行
    var generateBottomLine = function (lineNum) {
        var lines = [];
        for (var i = 0; i < lineNum; i++) {
            var line = [];
            for (var j = 0; j < 10; j++) {
                line.push(Math.ceil(Math.random() * 2) - 1);
            }
            lines.push(line);
        }
        return lines;
    }
    //时间计数器
    var timeFunc = function () {
        timeCount = timeCount + 1;
        if (timeCount == 5) {
            timeCount = 0;
            time = time + 1;
            game.setTime(time);
            socket.emit('time', time);
            if (time % 10 == 0) {
                lines = generateBottomLine(1);
                game.addTailLines(lines);
                socket.emit('addTailLines', lines);
            }
        }
    }
    var start = function () {
        var doms = {
            gameDiv: document.getElementById('local_game'),
            nextDiv: document.getElementById('local_next'),
            timeDiv: document.getElementById('local_time'),
            scoreDiv: document.getElementById('local_score'),
            resultDiv: document.getElementById('local_gameover')
        }
        game = new Game();
        var type = generateType();
        var dir = generateDir()
        game.init(doms, type, dir);
        socket.emit('init', {
            type: type,
            dir: dir
        })
        bindKeyEvent();
        var t = generateType();
        var d = generateDir();
        game.performNext(t, d);
        socket.emit('next', {
            type: t,
            dir: d
        })
        timer = setInterval(move, INTERVAL);
    }
    var stop = function () {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        document.onkeydown = null;
    }
    socket.on('start', function () {
        document.getElementById('waiting').innerHTML = '';
        start();
    })
    socket.on('lose', function () {
        game.gameover(true);
        stop();
    })
    socket.on('leave', function () {
        document.getElementById('local_gameover').innerHTML = '对方掉线';
        document.getElementById('remote_gameover').innerHTML = '已掉线';
        stop();
    })
    socket.on('bottomlines', function (data) {
        game.addTailLines(data);
        socket.emit('addTailLines', data);
    })
}
