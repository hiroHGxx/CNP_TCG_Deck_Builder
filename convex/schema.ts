import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

/**
 * CNP TCG Deck Builder 専用スキーマ
 * TCGアプリケーションに特化したデータベース設計
 */
export default defineSchema({
  // ユーザー管理
  users: defineTable({
    name: v.string(),
    email: v.string(),
    createdAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  }).index("by_email", ["email"]),

  // メインデッキ保存（CNP TCG特化）
  decks: defineTable({
    // 基本情報
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    
    // CNP TCG特化データ
    mainCards: v.any(), // Record<string, number> - カードID: 枚数（動的キー対応）
    reikiCards: v.array(v.object({
      color: v.string(), // 'red' | 'blue' | 'green' | 'yellow' | 'purple'
      count: v.number()
    })),
    
    // デッキ統計（自動計算）
    totalMainCards: v.number(), // メインデッキ枚数
    totalReikiCards: v.number(), // レイキデッキ枚数
    mainColors: v.array(v.string()), // 主要色配列
    avgCost: v.number(), // 平均コスト
    colorDistribution: v.object({
      red: v.number(),
      blue: v.number(),
      green: v.number(),
      yellow: v.number(),
      purple: v.number(),
    }),
    
    // メタデータ
    tags: v.array(v.string()), // ["アグロ", "赤単", "ナルカミ軸"]
    isPublic: v.boolean(),
    shareCode: v.optional(v.string()), // 共有用ランダムコード
    
    // 戦績データ
    wins: v.optional(v.number()),
    losses: v.optional(v.number()),
    
    // 日付管理
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_public", ["isPublic"])
  .index("by_colors", ["mainColors"])
  .index("by_share_code", ["shareCode"])
  .index("by_tags", ["tags"]),

  // デッキ評価・コメント
  deck_ratings: defineTable({
    deckId: v.id("decks"),
    userId: v.id("users"),
    rating: v.number(), // 1-5星評価
    comment: v.optional(v.string()),
    createdAt: v.number(),
  })
  .index("by_deck", ["deckId"])
  .index("by_user", ["userId"])
  .index("by_rating", ["rating"]),

  // お気に入りデッキ
  deck_favorites: defineTable({
    deckId: v.id("decks"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_deck", ["deckId"])
  .index("by_user_deck", ["userId", "deckId"]),

  // 大会・イベント記録（将来拡張用）
  tournaments: defineTable({
    name: v.string(),
    description: v.string(),
    format: v.string(), // "スタンダード", "リミテッド" etc
    startDate: v.number(),
    endDate: v.number(),
    createdBy: v.id("users"),
    participants: v.array(v.id("users")),
    isActive: v.boolean(),
  })
  .index("by_active", ["isActive"])
  .index("by_date", ["startDate"])
  .index("by_creator", ["createdBy"]),
})