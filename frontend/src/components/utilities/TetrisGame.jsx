import { useEffect, useState, useCallback } from "react";
import { motion } from 'framer-motion';
import { RotateCcw, Trophy, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const COLS = 10;
const ROWS = 20;
const EMPTY = 0;

const SHAPES = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    L: [[1, 0, 0], [1, 1, 1]],
    J: [[0, 0, 1], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]]
};

const COLORS = {
    I: 'from-cyan-400 to-cyan-600',
    O: 'from-yellow-400 to-yellow-600',
    T: 'from-purple-400 to-purple-600',
    L: 'from-orange-400 to-orange-600',
    J: 'from-blue-400 to-blue-600',
    S: 'from-green-400 to-green-600',
    Z: 'from-red-400 to-red-600'
};

const PIECE_NAMES = Object.keys(SHAPES);

const createBoard = () =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));

const randomPiece = () => {
    const name = PIECE_NAMES[Math.floor(Math.random() * PIECE_NAMES.length)];
    const shape = SHAPES[name];
    return {
        shape,
        name,
        x: Math.floor((COLS - shape[0].length) / 2),
        y: 0
    };
};

const TetrisGame = () => {
    const [board, setBoard] = useState(createBoard());
    const [piece, setPiece] = useState(randomPiece());
    const [score, setScore] = useState(0);
    const [lines, setLines] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [bestScore, setBestScore] = useState(() => {
        const saved = localStorage.getItem('tetrisBestScore');
        return saved ? parseInt(saved) : 0;
    });

    const collide = useCallback((px, py, shape) => {
        return shape.some((row, y) =>
            row.some((value, x) => {
                if (!value) return false;
                const newX = px + x;
                const newY = py + y;
                return (
                    newX < 0 ||
                    newX >= COLS ||
                    newY >= ROWS ||
                    board[newY]?.[newX]
                );
            })
        );
    }, [board]);

    const clearLines = useCallback((b) => {
        let linesCleared = 0;
        for (let y = ROWS - 1; y >= 0; y--) {
            if (b[y].every(v => v !== 0)) {
                b.splice(y, 1);
                b.unshift(Array(COLS).fill(0));
                linesCleared++;
                y++;
            }
        }
        if (linesCleared) {
            const points = linesCleared * 100 * linesCleared; // Bonus for multiple lines
            setScore(s => s + points);
            setLines(l => l + linesCleared);
        }
    }, []);

    const merge = useCallback(() => {
        const newBoard = board.map(r => [...r]);
        piece.shape.forEach((row, y) =>
            row.forEach((value, x) => {
                if (value) newBoard[piece.y + y][piece.x + x] = piece.name;
            })
        );
        clearLines(newBoard);
        setBoard(newBoard);
        const next = randomPiece();
        if (collide(next.x, next.y, next.shape)) {
            setGameOver(true);
            if (score > bestScore) {
                setBestScore(score);
                localStorage.setItem('tetrisBestScore', score.toString());
            }
        } else {
            setPiece(next);
        }
    }, [board, piece, collide, clearLines, score, bestScore]);

    const move = useCallback((dx, dy) => {
        if (gameOver) return;
        if (!collide(piece.x + dx, piece.y + dy, piece.shape)) {
            setPiece(p => ({ ...p, x: p.x + dx, y: p.y + dy }));
        } else if (dy === 1) {
            merge();
        }
    }, [piece, collide, merge, gameOver]);

    const rotate = useCallback(() => {
        if (gameOver) return;
        const rotated = piece.shape[0].map((_, i) =>
            piece.shape.map(row => row[i]).reverse()
        );
        if (!collide(piece.x, piece.y, rotated)) {
            setPiece(p => ({ ...p, shape: rotated }));
        }
    }, [piece, collide, gameOver]);

    const restart = () => {
        setBoard(createBoard());
        setPiece(randomPiece());
        setScore(0);
        setLines(0);
        setGameOver(false);
    };

    useEffect(() => {
        if (gameOver) return;
        const drop = setInterval(() => move(0, 1), 700);
        return () => clearInterval(drop);
    }, [move, gameOver]);

    useEffect(() => {
        const handleKey = (e) => {
            if (gameOver) return;
            if (e.key === "ArrowLeft") move(-1, 0);
            if (e.key === "ArrowRight") move(1, 0);
            if (e.key === "ArrowDown") move(0, 1);
            if (e.key === "ArrowUp") rotate();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [move, rotate, gameOver]);

    const getCellClass = (x, y) => {
        // Check if current piece occupies this cell
        const pieceY = y - piece.y;
        const pieceX = x - piece.x;
        if (piece.shape[pieceY]?.[pieceX]) {
            return COLORS[piece.name] || 'from-gray-400 to-gray-600';
        }
        // Check if board has a filled cell
        const cell = board[y][x];
        if (cell) {
            return COLORS[cell] || 'from-gray-400 to-gray-600';
        }
        return null;
    };

    return (
        <div className="p-6 h-full overflow-auto bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center mb-6"
                >
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Gamepad2 className="w-8 h-8 text-cyan-400" />
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            TETRIS
                        </h1>
                        <Gamepad2 className="w-8 h-8 text-pink-400" />
                    </div>
                    <p className="text-gray-400">Use as setas ← → ↓ para mover, ↑ para girar</p>
                </motion.div>

                <div className="flex gap-6 justify-center">
                    {/* Game Board */}
                    <Card className="bg-black/50 border-gray-700 p-4">
                        <div
                            className="grid gap-[1px] bg-gray-800 p-1 rounded"
                            style={{
                                gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                                width: `${COLS * 24 + 10}px`
                            }}
                        >
                            {board.map((row, y) =>
                                row.map((_, x) => {
                                    const colorClass = getCellClass(x, y);
                                    return (
                                        <div
                                            key={`${y}-${x}`}
                                            className={`
                                                w-[22px] h-[22px] rounded-sm transition-all duration-75
                                                ${colorClass
                                                    ? `bg-gradient-to-br ${colorClass} shadow-inner border border-white/20`
                                                    : 'bg-gray-900/80'
                                                }
                                            `}
                                        />
                                    );
                                })
                            )}
                        </div>
                    </Card>

                    {/* Score Panel */}
                    <div className="space-y-4">
                        <Card className="bg-black/50 border-gray-700 p-4 w-40">
                            <CardContent className="p-0 space-y-4">
                                <div className="text-center">
                                    <p className="text-gray-400 text-sm">Pontos</p>
                                    <p className="text-3xl font-bold text-white">{score}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-gray-400 text-sm">Linhas</p>
                                    <p className="text-2xl font-bold text-cyan-400">{lines}</p>
                                </div>
                                <div className="text-center border-t border-gray-700 pt-4">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                        <p className="text-gray-400 text-sm">Recorde</p>
                                    </div>
                                    <p className="text-2xl font-bold text-yellow-400">{bestScore}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Button
                            onClick={restart}
                            variant="outline"
                            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reiniciar
                        </Button>
                    </div>
                </div>

                {/* Game Over Overlay */}
                {gameOver && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
                    >
                        <Card className="bg-gray-900 border-red-500 p-8 text-center">
                            <h2 className="text-4xl font-bold text-red-500 mb-4">💀 Game Over</h2>
                            <p className="text-gray-300 mb-2">Pontuação Final: <span className="text-white font-bold">{score}</span></p>
                            <p className="text-gray-300 mb-6">Linhas: <span className="text-cyan-400 font-bold">{lines}</span></p>
                            <Button onClick={restart} className="bg-cyan-600 hover:bg-cyan-500">
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Jogar Novamente
                            </Button>
                        </Card>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default TetrisGame;
