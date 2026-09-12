export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,mdx,stories.tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 汎用デザイントークン。UIコンポーネント側のハードコードされたTailwind標準色
        // （gray-500, blue-500 等）を意味のある名前に置き換えるためのもの。
        // マルチテーマ切り替えは行わないため、CSS変数を介さず固定値で定義する。
        canvas: "#F8FAFC",
        surface: "#FFFFFF",
        accent: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
        },
        ink: {
          DEFAULT: "#1E293B",
          sub: "#64748B",
        },
        line: "#E2E8F0",
        danger: "#DC2626",
      },
      borderColor: {
        // 色指定のない `border` / `border-b` 等（Tailwindの既定では固定のgray-200相当）を
        // line トークンに揃える
        DEFAULT: "#E2E8F0",
      },
      ringColor: {
        DEFAULT: "#2563EB",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-from-top": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-in-from-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-from-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out",
        "slide-in-from-left": "slide-in-from-left 0.3s ease-out",
        "slide-in-from-right": "slide-in-from-right 0.3s ease-out",
      },
    },
  },
  plugins: [],
}

