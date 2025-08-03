# WebGL Carousel

日本語 | [English](README.md)

<p align="center">
  <a href="https://www.npmjs.com/package/webgl-carousel"><img src="https://img.shields.io/npm/v/webgl-carousel.svg" alt="npm version"></a>
  <a href="https://github.com/northprint/webgl-carousel/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/webgl-carousel.svg" alt="license"></a>
  <a href="https://www.npmjs.com/package/webgl-carousel"><img src="https://img.shields.io/npm/dm/webgl-carousel.svg" alt="downloads"></a>
  <a href="https://github.com/northprint/webgl-carousel/actions/workflows/ci.yml"><img src="https://github.com/northprint/webgl-carousel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/northprint/webgl-carousel"><img src="https://codecov.io/gh/northprint/webgl-carousel/branch/main/graph/badge.svg" alt="codecov"></a>
</p>

高性能なWebGLベースの画像カルーセルライブラリ。GPU加速による滑らかなアニメーションと美しいトランジションエフェクトを提供します。

[ドキュメント](https://northprint.github.io/webgl-carousel/) | [デモ](https://northprint.github.io/webgl-carousel/demo.html) | [NPM](https://www.npmjs.com/package/webgl-carousel)

## 特徴

- **高速パフォーマンス** - WebGL/WebGL2によるGPU加速
- **豊富なエフェクト** - 20種類以上のビルトインエフェクト
- **レスポンシブ対応** - モバイルフレンドリー、タッチジェスチャー対応
- **フレームワーク対応** - React、Vue、Svelte向けコンポーネント
- **カスタマイズ可能** - 独自のGLSLシェーダーでカスタムエフェクト作成
- **フォールバック** - WebGL非対応環境でCanvas 2D自動切り替え
- **軽量** - 最小構成で約30KB（gzip圧縮時）

## インストール

### npm
```bash
npm install webgl-carousel
```

### yarn
```bash
yarn add webgl-carousel
```

### CDN
```html
<script src="https://unpkg.com/webgl-carousel/dist/webgl-carousel.umd.js"></script>
```

## クイックスタート

### 基本的な使い方

```javascript
import { WebGLCarousel } from 'webgl-carousel';

const carousel = new WebGLCarousel({
  container: '#carousel',
  images: [
    'path/to/image1.jpg',
    'path/to/image2.jpg',
    'path/to/image3.jpg'
  ],
  effect: 'fade',
  autoplay: true,
  transitionDuration: 2000
});
```

### HTML
```html
<div id="carousel" style="width: 100%; height: 400px;"></div>
```

## 🛠️ フレームワーク統合

### React

```jsx
import { ReactCarousel } from 'webgl-carousel/react';

function App() {
  const images = [
    'path/to/image1.jpg',
    'path/to/image2.jpg',
    'path/to/image3.jpg'
  ];

  return (
    <ReactCarousel
      images={images}
      effect="slideLeft"
      autoplay
      transitionDuration={1500}
      style={{ width: '100%', height: '400px' }}
    />
  );
}
```

### Vue

```vue
<template>
  <VueCarousel
    :images="images"
    effect="wave"
    :autoplay="true"
    :transition-duration="2000"
    style="width: 100%; height: 400px;"
  />
</template>

<script setup>
import { VueCarousel } from 'webgl-carousel/vue';

const images = [
  'path/to/image1.jpg',
  'path/to/image2.jpg',
  'path/to/image3.jpg'
];
</script>
```

### Svelte

```svelte
<script>
  import { SvelteCarousel } from 'webgl-carousel/svelte';
  
  const images = [
    'path/to/image1.jpg',
    'path/to/image2.jpg',
    'path/to/image3.jpg'
  ];
</script>

<SvelteCarousel
  {images}
  effect="flip"
  autoplay={true}
  transitionDuration={1800}
  style="width: 100%; height: 400px;"
/>
```

## 利用可能なエフェクト

### 基本エフェクト
- `fade` - フェード効果
- `slideLeft` / `slideRight` - 左右スライド
- `slideUp` / `slideDown` - 上下スライド

### 3Dエフェクト
- `flipHorizontal` / `flipVertical` - 3D回転

### クリエイティブエフェクト
- `wave` / `gentleWave` / `intenseWave` - 波形アニメーション
- `distortion` / `subtleDistortion` / `extremeDistortion` - 歪み効果
- `dissolve` / `pixelDissolve` / `smoothDissolve` - ディゾルブ
- `circle` / `circleFromCenter` / `circleFromCorner` - 円形トランジション
- `morph` - モーフィング
- `glitch` - グリッチエフェクト

## APIリファレンス

### オプション

| オプション | 型 | デフォルト | 説明 |
|----------|------|----------|------|
| `container` | string \| HTMLElement | 必須 | カルーセルコンテナ |
| `images` | string[] | `[]` | 画像URLの配列 |
| `effect` | string | `'fade'` | トランジションエフェクト |
| `autoplay` | boolean | `false` | 自動再生 |
| `interval` | number | `3000` | 自動再生間隔（ms） |
| `transitionDuration` | number | `1000` | トランジション時間（ms） |
| `loop` | boolean | `true` | ループ再生 |
| `showControls` | boolean | `true` | コントロール表示 |
| `showIndicators` | boolean | `true` | インジケーター表示 |

### メソッド

```javascript
carousel.next();                 // 次の画像へ
carousel.previous();             // 前の画像へ
carousel.goTo(index);           // 特定のインデックスへ
carousel.play();                // 自動再生開始
carousel.pause();               // 自動再生停止
carousel.setEffect(effectName); // エフェクト変更
carousel.dispose();             // リソース解放
```

### イベント

```javascript
carousel.on('change', (index) => {
  console.log('Current image:', index);
});

carousel.on('transitionStart', (from, to) => {
  console.log(`Transitioning from ${from} to ${to}`);
});

carousel.on('transitionEnd', (index) => {
  console.log('Transition completed:', index);
});
```

## カスタムエフェクト

独自のGLSLシェーダーを使用してカスタムエフェクトを作成できます：

```javascript
import { createCustomEffect } from 'webgl-carousel';

const myEffect = createCustomEffect(
  'myCustomEffect',
  vertexShaderCode,   // optional
  fragmentShaderCode
);

carousel.registerEffect(myEffect);
carousel.setEffect('myCustomEffect');
```

外部ファイルからシェーダーを読み込む：

```javascript
const effect = await createCustomEffectFromFiles(
  'ripple',
  'shaders/ripple.vert',
  'shaders/ripple.frag'
);
```

## ブラウザサポート

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

WebGL 2.0が利用可能な場合は自動的に使用され、そうでない場合はWebGL 1.0またはCanvas 2Dにフォールバックします。

## 📁 プロジェクト構造

```
webgl-carousel/
├── src/                # ソースコード
│   ├── core/          # コア機能
│   ├── effects/       # トランジションエフェクト
│   ├── adapters/      # フレームワークアダプター
│   └── index.ts       # メインエントリー
├── demos/             # デモページ
├── docs/              # ドキュメント（GitHub Pages）
├── dist/              # ビルド済みファイル
└── e2e/               # E2Eテスト
```

## 🧪 開発

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# テスト実行
npm test

# E2Eテスト
npm run test:e2e

# ドキュメントサーバー
npm run demo
```

## コントリビュート

コントリビューションは大歓迎です！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルをご覧ください。

## 🙏 謝辞

このプロジェクトは以下のオープンソースプロジェクトを参考にしています：
- Three.js
- GSAP
- Swiper.js

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/northprint">NorthPrint</a>
</p>