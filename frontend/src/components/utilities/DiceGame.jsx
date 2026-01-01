import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Pause, Play, Gamepad2, Flame, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Componente de Dado 3D realista
const Dice3D = ({ value, rolling, isOne }) => {
    // Posições dos pontos para cada valor do dado
    const dotPositions = {
        1: [{ top: '50%', left: '50%' }],
        2: [{ top: '25%', left: '25%' }, { top: '75%', left: '75%' }],
        3: [{ top: '25%', left: '25%' }, { top: '50%', left: '50%' }, { top: '75%', left: '75%' }],
        4: [{ top: '25%', left: '25%' }, { top: '25%', left: '75%' }, { top: '75%', left: '25%' }, { top: '75%', left: '75%' }],
        5: [{ top: '25%', left: '25%' }, { top: '25%', left: '75%' }, { top: '50%', left: '50%' }, { top: '75%', left: '25%' }, { top: '75%', left: '75%' }],
        6: [{ top: '25%', left: '30%' }, { top: '25%', left: '70%' }, { top: '50%', left: '30%' }, { top: '50%', left: '70%' }, { top: '75%', left: '30%' }, { top: '75%', left: '70%' }]
    };

    const dots = dotPositions[value] || [];

    return (
        <motion.div
            animate={rolling ? {
                rotateX: [0, 360, 720, 1080],
                rotateY: [0, 180, 360, 540],
                scale: [1, 1.1, 0.95, 1.05, 1]
            } : {
                rotateX: 0,
                rotateY: 0,
                scale: 1
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ perspective: '500px' }}
            className="relative"
        >
            {/* Sombra do dado */}
            <div
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-black/30 rounded-full blur-md"
                style={{ transform: 'translateX(-50%) rotateX(90deg)' }}
            />

            {/* Dado principal */}
            <div
                className={`
                    relative w-24 h-24 rounded-2xl
                    ${isOne && !rolling
                        ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 shadow-[0_8px_30px_rgba(239,68,68,0.5)]'
                        : 'bg-gradient-to-br from-white via-gray-100 to-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.3)]'
                    }
                `}
                style={{
                    boxShadow: isOne && !rolling
                        ? 'inset 2px 2px 8px rgba(255,255,255,0.3), inset -2px -2px 8px rgba(0,0,0,0.2), 0 8px 30px rgba(239,68,68,0.5)'
                        : 'inset 2px 2px 8px rgba(255,255,255,0.8), inset -2px -2px 8px rgba(0,0,0,0.1), 0 8px 30px rgba(0,0,0,0.3)',
                    transform: 'rotateX(5deg)'
                }}
            >
                {/* Borda superior iluminada */}
                <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-white/50 to-transparent rounded-t-2xl" />

                {/* Pontos do dado */}
                {dots.map((pos, idx) => (
                    <div
                        key={idx}
                        className={`
                            absolute w-5 h-5 rounded-full -translate-x-1/2 -translate-y-1/2
                            ${isOne && !rolling
                                ? 'bg-white shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]'
                                : 'bg-gradient-to-br from-gray-800 to-black shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2)]'
                            }
                        `}
                        style={{
                            top: pos.top,
                            left: pos.left,
                            boxShadow: isOne && !rolling
                                ? 'inset 1px 1px 2px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)'
                                : 'inset 1px 1px 2px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.3)'
                        }}
                    />
                ))}
            </div>
        </motion.div>
    );
};

const DiceGame = () => {
    const [dice1, setDice1] = useState(1);
    const [dice2, setDice2] = useState(1);
    const [roundScore, setRoundScore] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [rolling, setRolling] = useState(false);
    const [message, setMessage] = useState("🎲 Role os dados!");
    const [messageType, setMessageType] = useState("info");
    const [showLostAnimation, setShowLostAnimation] = useState(false);
    const [bestScore, setBestScore] = useState(() => {
        const saved = localStorage.getItem('diceGameBestScore');
        return saved ? parseInt(saved) : 0;
    });

    const rollDice = () => {
        if (rolling) return;

        setRolling(true);
        setShowLostAnimation(false);

        // Animate through random values
        let count = 0;
        const interval = setInterval(() => {
            setDice1(Math.floor(Math.random() * 6) + 1);
            setDice2(Math.floor(Math.random() * 6) + 1);
            count++;

            if (count > 12) {
                clearInterval(interval);

                const d1 = Math.floor(Math.random() * 6) + 1;
                const d2 = Math.floor(Math.random() * 6) + 1;

                setDice1(d1);
                setDice2(d2);

                if (d1 === 1 || d2 === 1) {
                    setRoundScore(0);
                    setMessage("💥 Você tirou 1! Perdeu a rodada!");
                    setMessageType("danger");
                    setShowLostAnimation(true);
                } else {
                    const sum = d1 + d2;
                    setRoundScore(prev => prev + sum);
                    setMessage(`🔥 +${sum} pontos! Continue ou pare?`);
                    setMessageType("success");
                }

                setRolling(false);
            }
        }, 60);
    };

    const hold = () => {
        if (roundScore === 0) return;

        const newTotal = totalScore + roundScore;
        setTotalScore(newTotal);
        setRoundScore(0);
        setMessage("✅ Pontos salvos!");
        setMessageType("info");

        if (newTotal > bestScore) {
            setBestScore(newTotal);
            localStorage.setItem('diceGameBestScore', newTotal.toString());
        }
    };

    const resetGame = () => {
        setTotalScore(0);
        setRoundScore(0);
        setDice1(1);
        setDice2(1);
        setMessage("🔄 Novo jogo!");
        setMessageType("info");
        setShowLostAnimation(false);
    };

    const messageColors = {
        info: "bg-blue-500/20 border-blue-400/50 text-blue-200",
        success: "bg-emerald-500/20 border-emerald-400/50 text-emerald-200",
        danger: "bg-red-500/20 border-red-400/50 text-red-200"
    };

    return (
        <div className="p-6 h-full overflow-auto bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 25px 25px, white 2%, transparent 0%)',
                    backgroundSize: '50px 50px'
                }} />
            </div>

            <div className="max-w-2xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center mb-8"
                >
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <span className="text-4xl">🎲</span>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                            Desafio dos Dados
                        </h1>
                        <span className="text-4xl">🎲</span>
                    </div>
                    <p className="text-purple-300 text-lg">Acumule pontos, mas cuidado com o 1!</p>
                </motion.div>

                {/* Main Game Card */}
                <Card className="bg-black/30 border-white/10 backdrop-blur-xl shadow-2xl">
                    <CardContent className="p-8">
                        {/* Dice Display */}
                        <div className="flex justify-center items-center gap-12 mb-8 py-6">
                            <Dice3D value={dice1} rolling={rolling} isOne={dice1 === 1 && !rolling} />
                            <Dice3D value={dice2} rolling={rolling} isOne={dice2 === 1 && !rolling} />
                        </div>

                        {/* Lost Animation */}
                        <AnimatePresence>
                            {showLostAnimation && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                >
                                    <span className="text-9xl">💥</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Message */}
                        <motion.div
                            key={message}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className={`text-center mb-6 py-3 px-6 rounded-xl border ${messageColors[messageType]}`}
                        >
                            <p className="text-lg font-semibold">{message}</p>
                        </motion.div>

                        {/* Scores */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="text-center p-5 bg-gradient-to-br from-orange-600/40 to-amber-700/40 rounded-2xl border border-orange-400/30 shadow-lg"
                            >
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Flame className="w-5 h-5 text-orange-400" />
                                    <p className="text-orange-300 text-sm font-medium">Rodada</p>
                                </div>
                                <p className="text-5xl font-bold text-white">{roundScore}</p>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="text-center p-5 bg-gradient-to-br from-emerald-600/40 to-green-700/40 rounded-2xl border border-emerald-400/30 shadow-lg"
                            >
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                    <p className="text-emerald-300 text-sm font-medium">Total</p>
                                </div>
                                <p className="text-5xl font-bold text-white">{totalScore}</p>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="text-center p-5 bg-gradient-to-br from-yellow-600/40 to-amber-600/40 rounded-2xl border border-yellow-400/30 shadow-lg"
                            >
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Trophy className="w-5 h-5 text-yellow-400" />
                                    <p className="text-yellow-300 text-sm font-medium">Recorde</p>
                                </div>
                                <p className="text-5xl font-bold text-yellow-400">{bestScore}</p>
                            </motion.div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-center gap-4">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    onClick={rollDice}
                                    disabled={rolling}
                                    className="h-14 px-10 text-lg font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:via-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/40 border-0"
                                >
                                    {rolling ? (
                                        <span className="flex items-center gap-2">
                                            🎲 Rolando...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Play className="w-5 h-5" />
                                            Rolar Dados
                                        </span>
                                    )}
                                </Button>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    onClick={hold}
                                    disabled={roundScore === 0}
                                    className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-emerald-500/40 border-0 disabled:opacity-40"
                                >
                                    <span className="flex items-center gap-2">
                                        <Pause className="w-5 h-5" />
                                        Parar
                                    </span>
                                </Button>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    onClick={resetGame}
                                    variant="outline"
                                    className="h-14 px-5 border-2 border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                </Button>
                            </motion.div>
                        </div>

                        {/* Rules */}
                        <div className="mt-8 text-center space-y-1">
                            <p className="text-white/50 text-sm">
                                ⚠️ Tirar <span className="text-red-400 font-bold">1</span> = perde todos os pontos da rodada!
                            </p>
                            <p className="text-white/50 text-sm">
                                💡 "Parar" salva os pontos da rodada no total
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DiceGame;
