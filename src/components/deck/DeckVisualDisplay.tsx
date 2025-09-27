import React from 'react';
import { Card } from '../../types/card';
import { CardStack } from './CardStack';
import { ReikiCardStack } from './ReikiCardStack';
import { useDeckStore } from '../../stores/deckStore';
import { useReikiStore } from '../../stores/reikiStore';

interface DeckVisualDisplayProps {
  className?: string;
}

/**
 * DeckVisualDisplay - デッキの視覚的表示コンポーネント
 * トレーディングカードゲームの一般的な表示方法で、
 * メインデッキとレイキデッキを統合表示
 */
export const DeckVisualDisplay: React.FC<DeckVisualDisplayProps> = ({ 
  className = '' 
}) => {
  const { currentDeck, allCards } = useDeckStore();
  const { cards: reikiCards } = useReikiStore();

  // メインデッキのカードをグループ化（同名カードをまとめる）
  const groupedMainCards = React.useMemo(() => {
    const cardGroups = new Map<string, { cards: Card[], count: number }>();
    
    // currentDeck.cardsは Record<string, number> 形式
    Object.entries(currentDeck.cards).forEach(([cardId, count]) => {
      const card = allCards.find(c => c.cardId === cardId);
      if (card && count > 0) {
        cardGroups.set(cardId, { cards: [card], count });
      }
    });
    
    return Array.from(cardGroups.values())
      .sort((a, b) => {
        // コスト順でソート、同コストの場合は名前順
        const costDiff = a.cards[0].cost - b.cards[0].cost;
        if (costDiff !== 0) return costDiff;
        return a.cards[0].name.localeCompare(b.cards[0].name);
      });
  }, [currentDeck.cards, allCards]);

  // レイキデッキの色別集計
  const reikiGroups = React.useMemo(() => {
    const colorCounts = {
      red: 0,
      blue: 0,
      green: 0,
      yellow: 0,
      purple: 0
    };
    
    reikiCards.forEach((reiki) => {
      if (reiki.color && colorCounts[reiki.color as keyof typeof colorCounts] !== undefined) {
        colorCounts[reiki.color as keyof typeof colorCounts] += reiki.count;
      }
    });
    
    return [
      { color: 'red' as const, count: colorCounts.red },
      { color: 'blue' as const, count: colorCounts.blue },
      { color: 'green' as const, count: colorCounts.green },
      { color: 'yellow' as const, count: colorCounts.yellow },
      { color: 'purple' as const, count: colorCounts.purple }
    ].filter(group => group.count > 0);
  }, [reikiCards]);

  const mainDeckCount = Object.values(currentDeck.cards).reduce((sum, count) => sum + count, 0);
  const reikiTotalCount = reikiCards.reduce((sum, card) => sum + card.count, 0);
  const hasCards = mainDeckCount > 0 || reikiTotalCount > 0;

  if (!hasCards) {
    return (
      <div className={`deck-visual-display-empty ${className}`}>
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">🃏</div>
            <div className="text-gray-500 text-lg font-medium">デッキが空です</div>
            <div className="text-gray-400 text-sm mt-2">
              カードを追加してデッキを構築してください
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`deck-visual-display ${className}`}>
      {/* ヘッダー */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">デッキビジュアル表示</h2>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>メインデッキ: {mainDeckCount}/50枚</span>
          <span>レイキデッキ: {reikiTotalCount}/15枚</span>
        </div>
      </div>

      {/* メインデッキエリア */}
      {mainDeckCount > 0 && (
        <div className="main-deck-area mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <span className="w-4 h-4 bg-cnp-blue rounded mr-2"></span>
            メインデッキ ({mainDeckCount}枚)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {groupedMainCards.map((cardGroup, index) => (
              <CardStack
                key={`${cardGroup.cards[0].cardId}-${index}`}
                cards={cardGroup.cards}
                count={cardGroup.count}
                className="justify-self-center"
              />
            ))}
          </div>
        </div>
      )}

      {/* レイキデッキエリア */}
      {reikiTotalCount > 0 && (
        <div className="reiki-deck-area">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <span className="w-4 h-4 bg-gradient-to-r from-cnp-red via-cnp-blue via-cnp-green to-cnp-yellow rounded mr-2"></span>
            レイキデッキ ({reikiTotalCount}枚)
          </h3>
          <div className="flex justify-center items-end space-x-6">
            {reikiGroups.map(group => (
              <ReikiCardStack
                key={group.color}
                color={group.color}
                count={group.count}
                className="flex-shrink-0"
              />
            ))}
          </div>
        </div>
      )}

      {/* デッキ統計 */}
      <div className="deck-stats mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-md font-semibold text-gray-700 mb-3">デッキ統計</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-cnp-blue">{mainDeckCount}</div>
            <div className="text-gray-600">メインカード</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-cnp-green">{reikiTotalCount}</div>
            <div className="text-gray-600">レイキカード</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-cnp-yellow">{groupedMainCards.length}</div>
            <div className="text-gray-600">ユニーク種類</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-cnp-red">
              {mainDeckCount > 0 ? Math.round(
                Object.entries(currentDeck.cards).reduce((sum: number, [cardId, count]) => {
                  const card = allCards.find(c => c.cardId === cardId);
                  return sum + (card ? card.cost * count : 0);
                }, 0) / mainDeckCount * 10
              ) / 10 : 0}
            </div>
            <div className="text-gray-600">平均コスト</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckVisualDisplay;