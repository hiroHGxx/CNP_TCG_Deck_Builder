import { v } from "convex/values"
import { mutation } from "./_generated/server"

/**
 * 一時ユーザー作成（認証実装前の仮機能）
 */
export const createTempUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // 既存ユーザーチェック
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()

    if (existingUser) {
      return existingUser._id
    }

    // 新規ユーザー作成
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    })

    return userId
  },
})

/**
 * デフォルトユーザー取得・作成
 */
export const getOrCreateDefaultUser = mutation({
  args: {},
  handler: async (ctx) => {
    const defaultEmail = "test@cnp-tcg.local"
    
    // デフォルトユーザー検索
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", defaultEmail))
      .first()

    if (existingUser) {
      return existingUser._id
    }

    // デフォルトユーザー作成
    const userId = await ctx.db.insert("users", {
      name: "テストユーザー",
      email: defaultEmail,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    })

    return userId
  },
})