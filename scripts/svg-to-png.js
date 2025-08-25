#!/usr/bin/env node

/**
 * SVGをPNGに変換するスクリプト
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 簡易的なSVG→PNG変換（Canvas API使用）
function createPurpleReikiPNG() {
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
<canvas id="canvas" width="120" height="168"></canvas>
<script>
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// 紫レイキカードを描画
function drawPurpleReiki() {
  // 背景グラデーション
  const gradient = ctx.createLinearGradient(0, 0, 0, 168);
  gradient.addColorStop(0, '#9333ea');
  gradient.addColorStop(0.5, '#7c3aed');
  gradient.addColorStop(1, '#6b21a8');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 120, 168);
  
  // 外枠
  ctx.strokeStyle = '#4c1d95';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, 117, 165);
  
  // 内枠
  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, 104, 152);
  
  // 中央菱形
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(60, 40);
  ctx.lineTo(80, 60);
  ctx.lineTo(60, 80);
  ctx.lineTo(40, 60);
  ctx.closePath();
  ctx.fill();
  
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // テキスト
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('レイキ', 60, 105);
  
  ctx.font = 'bold 20px Arial';
  ctx.fillText('紫', 60, 130);
  
  // 星の描画
  function drawStar(x, y) {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(x, y-8);
    ctx.lineTo(x+2, y-2);
    ctx.lineTo(x+8, y-2);
    ctx.lineTo(x+3, y+2);
    ctx.lineTo(x+5, y+8);
    ctx.lineTo(x, y+4);
    ctx.lineTo(x-5, y+8);
    ctx.lineTo(x-3, y+2);
    ctx.lineTo(x-8, y-2);
    ctx.lineTo(x-2, y-2);
    ctx.closePath();
    ctx.fill();
  }
  
  drawStar(25, 25);
  drawStar(95, 25);
  drawStar(25, 143);
  drawStar(95, 143);
}

drawPurpleReiki();

// PNG形式でダウンロード
const link = document.createElement('a');
link.download = 'reiki_purple.png';
link.href = canvas.toDataURL('image/png');
console.log('PNG生成完了 - ダウンロードリンクを作成しました');
document.body.appendChild(link);
link.click();
</script>
</body>
</html>
  `;

  const outputPath = path.join(__dirname, '..', 'public', 'images', 'reiki', 'reiki_purple_generator.html');
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log('紫レイキカード生成用HTMLファイルを作成:', outputPath);
  console.log('ブラウザで開いてPNG画像をダウンロードしてください。');
}

createPurpleReikiPNG();