import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';

const generateCandlestickData = (numPoints) => {
  const data = [];
  let price = 100;
  for (let i = 0; i < numPoints; i++) {
    const open = price + Math.random() * 10 - 5;
    const close = open + Math.random() * 10 - 5;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;
    data.push({ date: `Day ${i + 1}`, open, close, high, low });
    price = close;
  }
  return data;
};

const calculateSupportResistance = (data) => {
  const prices = data.flatMap(d => [d.high, d.low]);
  const support = Math.min(...prices);
  const resistance = Math.max(...prices);
  return { support, resistance };
};

const Game = () => {
  const [charts] = useState(() => Array(10).fill(null).map(() => generateCandlestickData(30)));
  const [currentChartIndex, setCurrentChartIndex] = useState(0);
  const [userLines, setUserLines] = useState({ support: [], resistance: [] });
  const [correctLines, setCorrectLines] = useState({ support: null, resistance: null });
  const [selectedLine, setSelectedLine] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const [scores, setScores] = useState([]);
  const [feedback, setFeedback] = useState('');
  const chartRef = useRef(null);

  useEffect(() => {
    const { support, resistance } = calculateSupportResistance(charts[currentChartIndex]);
    setCorrectLines({ support, resistance });
  }, [currentChartIndex, charts]);

  const handleChartClick = (e) => {
    if (!chartRef.current || !selectedLine || gameState !== 'playing') return;
    const chartElement = chartRef.current;
    const rect = chartElement.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const chartHeight = rect.height;
    const minY = Math.min(...charts[currentChartIndex].map(d => d.low));
    const maxY = Math.max(...charts[currentChartIndex].map(d => d.high));
    const clickedPrice = maxY - (y / chartHeight) * (maxY - minY);

    setUserLines(prev => ({
      ...prev,
      [selectedLine]: [...prev[selectedLine].slice(0, 1), clickedPrice]
    }));

    checkLineAccuracy(selectedLine, clickedPrice);
  };

  const checkLineAccuracy = (lineType, value) => {
    const correctValue = correctLines[lineType];
    const diff = Math.abs(value - correctValue);
    const maxDiff = correctLines.resistance - correctLines.support;
    const accuracy = 1 - (diff / maxDiff);
    
    let feedbackMessage = '';
    if (accuracy > 0.9) {
      feedbackMessage = 'Excellent! Very close to the correct line.';
    } else if (accuracy > 0.7) {
      feedbackMessage = 'Good job! You\'re getting close.';
    } else if (accuracy > 0.5) {
      feedbackMessage = 'Not bad, but there\'s room for improvement.';
    } else {
      feedbackMessage = 'Try again. Look closely at the price movements.';
    }

    setFeedback(feedbackMessage);
  };

  const moveToNextChart = () => {
    const chartScore = calculateScore();
    setScores(prev => [...prev, chartScore]);

    if (currentChartIndex === 9) {
      setGameState('finished');
    } else {
      setCurrentChartIndex(prev => prev + 1);
      setUserLines({ support: [], resistance: [] });
      setFeedback('');
    }
  };

  const calculateScore = () => {
    const supportDiff = Math.min(...userLines.support.map(line => Math.abs(line - correctLines.support)));
    const resistanceDiff = Math.min(...userLines.resistance.map(line => Math.abs(line - correctLines.resistance)));
    const totalDiff = supportDiff + resistanceDiff;
    const maxDiff = correctLines.resistance - correctLines.support;
    const accuracy = 1 - (totalDiff / maxDiff);
    return Math.round(accuracy * 100);
  };

  const resetGame = () => {
    setCurrentChartIndex(0);
    setUserLines({ support: [], resistance: [] });
    setSelectedLine(null);
    setGameState('playing');
    setScores([]);
    setFeedback('');
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Support and Resistance Line Drawing Game</h1>
      <div style={{ marginBottom: '1rem' }}>Chart {currentChartIndex + 1} of 10</div>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setSelectedLine('support')} style={{ marginRight: '0.5rem' }}>
          Select Support Line
        </button>
        <button onClick={() => setSelectedLine('resistance')}>
          Select Resistance Line
        </button>
      </div>
      <div ref={chartRef} onClick={handleChartClick}>
        <LineChart width={600} height={400} data={charts[currentChartIndex]}>
          <XAxis dataKey="date" />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip />
          <Line type="monotone" dataKey="high" stroke="#8884d8" dot={false} />
          <Line type="monotone" dataKey="low" stroke="#82ca9d" dot={false} />
          {userLines.support.map((line, index) => (
            <ReferenceLine key={`support-${index}`} y={line} stroke="blue" />
          ))}
          {userLines.resistance.map((line, index) => (
            <ReferenceLine key={`resistance-${index}`} y={line} stroke="red" />
          ))}
        </LineChart>
      </div>
      {feedback && (
        <div style={{ marginTop: '1rem', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
          <strong>Feedback:</strong> {feedback}
        </div>
      )}
      <button 
        onClick={moveToNextChart} 
        style={{ marginTop: '1rem' }}
        disabled={userLines.support.length < 2 || userLines.resistance.length < 2}
      >
        Next Chart
      </button>
      {gameState === 'finished' && (
        <div style={{ marginTop: '1rem', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
          <h2>Game Over!</h2>
          <p>Your average score: {(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)}</p>
          <p>Scores per chart: {scores.join(', ')}</p>
          <button onClick={resetGame}>Play Again</button>
        </div>
      )}
    </div>
  );
};

export default Game;
