import React from 'react';
import { Card } from '../../types/card';
import { getRarityColor } from '../../utils/cardHelpers';

interface CardStackProps {
  cards: Card[];
  count: number;
  className?: string;
}

/**
 * CardStack - 同名カードの重ね表示コンポーネント
 * トレーディングカードゲームの一般的な表示方法に従い、
 * 複数枚のカードを重ねて枚数感を表現
 */
export const CardStack: React.FC<CardStackProps> = ({ 
  cards, 
  count, 
  className = '' 
}) => {
  if (cards.length === 0) return null;
  
  const card = cards[0]; // 代表カードを使用
  const hasMultiple = count > 1;

  return (
    <div className={`card-stack relative ${className}`}>
      {/* 複数枚の場合の背景カード表現 */}
      {hasMultiple && (
        <>
          {/* 4枚目の影 */}
          {count >= 4 && (
            <div 
              className="absolute w-full h-full bg-gray-200 rounded-lg shadow-lg border border-gray-300"
              style={{ 
                transform: 'translate(15px, 15px)',
                zIndex: 1
              }}
            />
          )}
          {/* 3枚目の影 */}
          {count >= 3 && (
            <div 
              className="absolute w-full h-full bg-gray-300 rounded-lg shadow-lg border border-gray-400"
              style={{ 
                transform: 'translate(10px, 10px)',
                zIndex: 2
              }}
            />
          )}
          {/* 2枚目の影 */}
          {count >= 2 && (
            <div 
              className="absolute w-full h-full bg-gray-400 rounded-lg shadow-lg border border-gray-500"
              style={{ 
                transform: 'translate(5px, 5px)',
                zIndex: 3
              }}
            />
          )}
        </>
      )}
      
      {/* メインカード */}
      <div 
        className="relative bg-white rounded-lg shadow-lg overflow-hidden border-2"
        style={{ 
          borderColor: getRarityColor(card.rarity),
          zIndex: 4,
          width: '140px',
          height: '190px'
        }}
      >
        {/* カード画像のみ */}
        <img
          src={card.imageUrl}
          alt={card.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* 枚数バッジ */}
        <div className="absolute top-2 right-2 bg-cnp-blue text-white text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg border-2 border-white">
          {count}
        </div>
      </div>
    </div>
  );
};

export default CardStack;