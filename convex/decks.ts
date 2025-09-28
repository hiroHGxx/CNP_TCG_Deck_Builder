import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Doc, Id } from "./_generated/dataModel"

/**
 * デッキ保存（新規作成・更新）
 */
export const saveDeck = mutation({
  args: {
    deckId: v.optional(v.id("decks")), // 更新時に指定
    name: v.string(),
    description: v.optional(v.string()),
    mainCards: v.any(), // Record<string, number> - 動的キー対応
    reikiCards: v.array(v.object({
      color: v.string(),
      count: v.number()
    })),
    tags: v.optional(v.array(v.string())),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<Id<"decks">> => {
    // 一時的にデフォルトユーザーを取得・作成
    let userId: Id<"users">
    const defaultEmail = "test@cnp-tcg.local"
    
    // デフォルトユーザー検索
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", defaultEmail))
      .first()

    if (existingUser) {
      userId = existingUser._id
    } else {
      // デフォルトユーザー作成
      userId = await ctx.db.insert("users", {
        name: "テストユーザー",
        email: defaultEmail,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      })
    }
    
    // デッキ統計計算
    const totalMainCards = Object.values(args.mainCards as Record<string, number>)
      .reduce((sum, count) => sum + count, 0)
    
    const totalReikiCards = args.reikiCards
      .reduce((sum, reiki) => sum + reiki.count, 0)
    
    // 主要色抽出（メインカードから）
    const mainColors = extractMainColors()
    
    // 平均コスト計算（簡易版）
    const avgCost = calculateAverageCost()
    
    // 色分布計算
    const colorDistribution = calculateColorDistribution()
    
    const deckData = {
      userId,
      name: args.name,
      description: args.description,
      mainCards: args.mainCards,
      reikiCards: args.reikiCards,
      totalMainCards,
      totalReikiCards,
      mainColors,
      avgCost,
      colorDistribution,
      tags: args.tags || [],
      isPublic: args.isPublic || false,
      shareCode: undefined, // 公開時に生成
      wins: 0,
      losses: 0,
      updatedAt: Date.now(),
    }
    
    if (args.deckId) {
      // 更新
      await ctx.db.patch(args.deckId, deckData)
      return args.deckId
    } else {
      // 新規作成
      const deckId = await ctx.db.insert("decks", {
        ...deckData,
        createdAt: Date.now(),
      })
      return deckId
    }
  },
})

/**
 * ユーザーのデッキ一覧取得
 */
export const getUserDecks = query({
  args: {
    userId: v.optional(v.string()), // TODO: 認証後に必須化
  },
  handler: async (ctx): Promise<Doc<"decks">[]> => {
    // 一時的にデフォルトユーザーを取得
    const defaultEmail = "test@cnp-tcg.local"
    
    // デフォルトユーザー検索
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", defaultEmail))
      .first()

    if (!existingUser) {
      return [] // ユーザーが存在しない場合は空配列
    }

    const userId = existingUser._id
    
    return await ctx.db
      .query("decks")
      .withIndex("by_user", (q) => q.eq("userId", userId as Id<"users">))
      .order("desc")
      .collect()
  },
})

/**
 * デッキ詳細取得
 */
export const getDeck = query({
  args: { deckId: v.id("decks") },
  handler: async (ctx, args): Promise<Doc<"decks"> | null> => {
    return await ctx.db.get(args.deckId)
  },
})

/**
 * デッキ削除
 */
export const deleteDeck = mutation({
  args: { deckId: v.id("decks") },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    // TODO: 認証後に所有者チェック追加
    await ctx.db.delete(args.deckId)
    return { success: true }
  },
})

/**
 * 公開デッキ一覧取得
 */
export const getPublicDecks = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Doc<"decks">[]> => {
    return await ctx.db
      .query("decks")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(args.limit || 20)
  },
})

// ヘルパー関数

/**
 * 主要色抽出（簡易版）
 */
function extractMainColors(): string[] {
  // TODO: 実際のカードデータから色情報を取得
  // 現在は仮実装
  return ["red", "blue"] // プレースホルダー
}

/**
 * 平均コスト計算（簡易版）
 */
function calculateAverageCost(): number {
  // TODO: 実際のカードデータからコスト情報を取得
  // 現在は仮実装
  return 3.5 // プレースホルダー
}

/**
 * 色分布計算（簡易版）
 */
function calculateColorDistribution() {
  // TODO: 実際のカードデータから色分布を計算
  // 現在は仮実装
  return {
    red: 20,
    blue: 15,
    green: 10,
    yellow: 5,
    purple: 0,
  }
}