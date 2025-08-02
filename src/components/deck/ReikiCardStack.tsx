import React from 'react';

interface ReikiCardStackProps {
  color: 'red' | 'blue' | 'green' | 'yellow';
  count: number;
  className?: string;
}

/**
 * ReikiCardStack - レイキカードの重ね表示コンポーネント
 * 色別にレイキカードを表示し、複数枚の場合は扇状に重ねて表示
 */
export const ReikiCardStack: React.FC<ReikiCardStackProps> = ({ 
  color, 
  count, 
  className = '' 
}) => {
  if (count === 0) return null;
  
  // レイキカード情報
  const reikiInfo = {
    red: { name: '赤レイキ', imagePath: '/images/reiki/reiki_red.png', backgroundColor: '#ef4444', borderColor: '#dc2626' },
    blue: { name: '青レイキ', imagePath: '/images/reiki/reiki_blue.png', backgroundColor: '#3b82f6', borderColor: '#2563eb' },
    green: { name: '緑レイキ', imagePath: '/images/reiki/reiki_green.png', backgroundColor: '#10b981', borderColor: '#059669' },
    yellow: { name: '黄レイキ', imagePath: '/images/reiki/reiki_yellow.png', backgroundColor: '#f59e0b', borderColor: '#d97706' }
  };
  
  const reikiCard = reikiInfo[color];
  const hasMultiple = count > 1;

  return (
    <div className={`reiki-card-stack relative ${className}`}>
      {/* 複数枚の場合の扇状表示 */}
      {hasMultiple && (
        <>
          {/* 4枚目 */}
          {count >= 4 && (
            <div 
              className="absolute rounded-lg shadow-md overflow-hidden"
              style={{ 
                transform: 'rotate(9deg) translate(6px, 3px)',
                zIndex: 1,
                width: '100px',
                height: '135px'
              }}
            >
              <img
                src={reikiCard.imagePath}
                alt={`${reikiCard.name}`}
                className="w-full h-full object-cover opacity-70"
              />
            </div>
          )}
          
          {/* 3枚目 */}
          {count >= 3 && (
            <div 
              className="absolute rounded-lg shadow-md overflow-hidden"
              style={{ 
                transform: 'rotate(6deg) translate(4px, 2px)',
                zIndex: 2,
                width: '100px',
                height: '135px'
              }}
            >
              <img
                src={reikiCard.imagePath}
                alt={`${reikiCard.name}`}
                className="w-full h-full object-cover opacity-80"
              />
            </div>
          )}
          
          {/* 2枚目 */}
          {count >= 2 && (
            <div 
              className="absolute rounded-lg shadow-md overflow-hidden"
              style={{ 
                transform: 'rotate(3deg) translate(2px, 1px)',
                zIndex: 3,
                width: '100px',
                height: '135px'
              }}
            >
              <img
                src={reikiCard.imagePath}
                alt={`${reikiCard.name}`}
                className="w-full h-full object-cover opacity-90"
              />
            </div>
          )}
        </>
      )}
      
      {/* メインカード */}
      <div 
        className="relative rounded-lg shadow-lg overflow-hidden border-2"
        style={{ 
          borderColor: reikiCard.borderColor,
          zIndex: 4,
          width: '100px',
          height: '135px'
        }}
      >
        <img
          src={reikiCard.imagePath}
          alt={`${reikiCard.name}`}
          className="w-full h-full object-cover"
        />
        
        {/* 枚数バッジ */}
        {hasMultiple && (
          <div 
            className="absolute top-1 right-1 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
            style={{ backgroundColor: reikiCard.backgroundColor }}
          >
            {count}
          </div>
        )}
      </div>
      
      {/* 色名ラベル */}
      <div className="mt-2 text-center">
        <div 
          className="text-xs font-semibold px-2 py-1 rounded"
          style={{ 
            backgroundColor: reikiCard.backgroundColor + '20',
            color: reikiCard.backgroundColor
          }}
        >
          {reikiCard.name}
        </div>
      </div>
    </div>
  );
};

export default ReikiCardStack;