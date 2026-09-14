/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#12141A",
        panel: "#1A1D25",
        panelLight: "#22252E",
        line: "#2C303A",
        ink: "#E7E4DC",
        inkMuted: "#9A9CA5",
        signal: "#E3A23C",
        signalDim: "#8A6A34",
        ok: "#4B9E7A",
        warn: "#C97A3D",
        err: "#B0523F",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'IBM Plex Sans'", "sans-serif"],
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "4px",
      },
    },
  },
  plugins: [],
};

