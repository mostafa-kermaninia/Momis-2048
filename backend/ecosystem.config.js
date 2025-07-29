module.exports = {
  apps : [{
    name   : "2048-api",
    script : "npm", // به PM2 می‌گوییم که از npm استفاده کن
    args   : "start"  // و اسکریپت "start" را اجرا کن
  }, {
    name   : "2048-bot",
    script : "dotenv -- ./run-bot.js" // برای ربات هم مستقیم از dotenv استفاده می‌کنیم
  }]
}