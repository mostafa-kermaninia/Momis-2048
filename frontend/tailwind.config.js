/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            // ✅ این بخش را اضافه می‌کنیم
            colors: {
                "momis-blue": "#0d1f3a",   // رنگ اصلی پس‌زمینه
                "momis-purple": "#4f3b78", // رنگ میانی
                "momis-teal": "#00f5d4",   // رنگ هایلایت و دکمه‌ها
            },
            fontFamily: {
                // فونت وزیرمتن را به عنوان فونت پیش‌فرض تعریف می‌کنیم
                sans: ["Vazirmatn", "sans-serif"],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: 0, transform: 'translateY(10px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
};