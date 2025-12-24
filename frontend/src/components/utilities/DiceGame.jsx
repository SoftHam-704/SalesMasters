import React, { useState } from "react";
// Removed import "./DiceGame.css"; to prevent global style leaks
import { useTabs } from '../../contexts/TabContext';

export default function DiceGame() {
    const { closeTab } = useTabs();
    const [dice1, setDice1] = useState(1);
    const [dice2, setDice2] = useState(1);
    const [roundScore, setRoundScore] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [bestScore, setBestScore] = useState(
        Number(localStorage.getItem("bestScore")) || 0
    );
    const [message, setMessage] = useState("Role os dados!");

    function rollDice() {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;

        setDice1(d1);
        setDice2(d2);

        if (d1 === 1 || d2 === 1) {
            setRoundScore(0);
            setMessage("💥 Você perdeu a rodada!");
        } else {
            const sum = d1 + d2;
            setRoundScore(roundScore + sum);
            setMessage("🔥 Continue ou pare?");
        }
    }

    function hold() {
        const newTotal = totalScore + roundScore;
        setTotalScore(newTotal);
        setRoundScore(0);
        setMessage("✅ Pontos salvos!");

        if (newTotal > bestScore) {
            setBestScore(newTotal);
            localStorage.setItem("bestScore", newTotal);
        }
    }

    function resetGame() {
        setTotalScore(0);
        setRoundScore(0);
        setMessage("🔄 Novo jogo!");
    }

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-slate-800 text-white rounded-xl max-w-md mx-auto mt-10 shadow-xl">
            <h1 className="text-2xl font-bold mb-6">🎲 Desafio dos Dados</h1>

            <div className="flex gap-8 text-4xl mb-6">
                <span>🎲 {dice1}</span>
                <span>🎲 {dice2}</span>
            </div>

            <p className="text-lg font-medium mb-6 text-yellow-400">{message}</p>

            <div className="grid grid-cols-3 gap-6 mb-6 text-center w-full">
                <div className="bg-slate-700/50 p-3 rounded-lg">
                    <p className="text-xs uppercase text-slate-400 mb-1">Rodada</p>
                    <strong className="text-xl">{roundScore}</strong>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg">
                    <p className="text-xs uppercase text-slate-400 mb-1">Total</p>
                    <strong className="text-xl">{totalScore}</strong>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg border border-yellow-500/20">
                    <p className="text-xs uppercase text-yellow-500/80 mb-1">Recorde</p>
                    <strong className="text-xl text-yellow-400">{bestScore}</strong>
                </div>
            </div>

            <div className="flex gap-3 w-full">
                <button
                    onClick={rollDice}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
                >
                    Rolar
                </button>
                <button
                    onClick={hold}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
                >
                    Parar
                </button>
                <button
                    onClick={resetGame}
                    className="flex-1 py-2.5 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-lg transition-colors"
                >
                    Resetar
                </button>
            </div>

            <button
                onClick={() => closeTab('/utilitarios/jogo-dados')}
                className="mt-6 text-slate-400 hover:text-white underline text-sm transition-colors"
            >
                Sair e Fechar Jogo
            </button>
        </div>
    );
}
