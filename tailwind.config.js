/** @type {iport('tailwindcss').Config} */
module.exports = {
  "content": [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  "theme": {
    "extend": {
      "colors": {
        "purple_darker": "#f5f5f7",
        "purple_dark": "#e8e8f0",
        "purple_light": "#6366f1",
        "purple_lighter": "#333333",
        "accent": "#8b5cf6",
        "accent_hover": "#7c3aed",
        "border_light": "#e2e2e7"
      },
      "width": {
        "p10": "10%"
      }
    }
  },
  "plugins": []
};
