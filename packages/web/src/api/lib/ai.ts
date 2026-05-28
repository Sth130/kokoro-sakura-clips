import { generateText } from "ai";
import { gateway } from "../agent/gateway";

const MODEL = "openai/gpt-5.4-mini";

const SYSTEM_PROMPT = `あなたはDead or Alive（DOA）シリーズのキャラクター「こころ」の大ファンです。
こころについての魅力的なツイートを日本語で作成してください。

こころの特徴：
- 日本の芸者を目指す大和撫子
- 優雅で礼儀正しい性格
- 母親はDOAファイターの美夜子
- 格闘スタイルは八極拳
- 趣味は日本舞踊と茶道
- DOA4から登場
- 黒髪のロングヘア
- 和服姿が印象的
- DOA5LRでの衣装が特に人気

ルール：
- 140文字以内で書く
- ハッシュタグは1〜2個（#DOA #こころ #DOA5LR など）
- 絵文字は控えめに（0〜2個）
- ファンが共感できる内容にする
- ゲームプレイ、キャラの魅力、名シーン、衣装など多様なトピック
- 自然な日本語で書く
- ツイート本文のみ出力（前置きや説明は不要）`;

const REPLY_SYSTEM_PROMPT = `あなたはDead or Alive（DOA）シリーズのキャラクター「こころ」の大ファンです。
メンション（リプライ）に対して、こころファンとして丁寧に返信してください。

ルール：
- 100文字以内で返信
- 優しく丁寧な口調（こころのキャラクターに合わせて）
- こころやDOAに関連する話題なら詳しく語る
- 関係ない話題でも礼儀正しく対応
- ハッシュタグは不要
- 絵文字は0〜1個
- 返信本文のみ出力（前置きや説明は不要）`;

export async function generateTweet(userPrompt?: string): Promise<string> {
  const prompt = userPrompt
    ? `以下のテーマでこころについてのツイートを1つ作成してください：${userPrompt}`
    : "こころについての魅力的なツイートを1つ作成してください。毎回違うトピックで。";

  const { text } = await generateText({
    model: gateway(MODEL),
    system: SYSTEM_PROMPT,
    prompt,
    maxTokens: 200,
    temperature: 0.9,
  });

  return text.trim() || "こころは最高のキャラクターです！ #DOA #こころ";
}

export async function generateMultipleTweets(
  count: number,
  userPrompt?: string
): Promise<string[]> {
  const prompt = userPrompt
    ? `以下のテーマでこころについてのツイートを${count}個作成してください。各ツイートは「---」で区切ってください：${userPrompt}`
    : `こころについての魅力的なツイートを${count}個作成してください。各ツイートは「---」で区切ってください。毎回違うトピックで。`;

  const { text } = await generateText({
    model: gateway(MODEL),
    system: SYSTEM_PROMPT,
    prompt,
    maxTokens: 200 * count,
    temperature: 0.9,
  });

  return text
    .split("---")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export async function generateReply(mentionText: string): Promise<string> {
  const { text } = await generateText({
    model: gateway(MODEL),
    system: REPLY_SYSTEM_PROMPT,
    prompt: `以下のメンションに返信してください：\n「${mentionText}」`,
    maxTokens: 150,
    temperature: 0.8,
  });

  return text.trim() || "ありがとうございます！こころは最高ですよね！";
}
