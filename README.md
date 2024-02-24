# Freebie Website Scraper

This project is a web scraping tool that monitors a freebie website Skeepers for new items and sends notifications to a Discord channel when new items become available or go out of stock. It is built using Node.js, Puppeteer, Axios, and Discord webhook.

## Setup

1. **Clone the repository:**
   
   ```bash
   git clone https://github.com/fruittypie/FreebieNotifier.git

2. **Install dependencies:**

   ```bash
   cd FreebieNotifier
   npm install
3. **Set up environment variables:**
   
   ```bash
   EMAIL=your_email@example.com
   PASSWORD=your_password from Skeepers
   WEBHOOK=your_discord_webhook_url
   
4. **Run the scraper:**

   ```bash
   npm start

## How it Works
The scraper uses Puppeteer to navigate the freebie website, log in with the provided credentials, and monitor the availability of items. It sends notifications to the Discord webhook when new items become available or go out of stock.

## Dependencies
* puppeteer — For web scraping and browser automation.
* puppeteer-extra — Additional features for Puppeteer.
* puppeteer-extra-plugin-stealth — Stealth mode plugin for Puppeteer.
* axios — For making HTTP requests.
* dotenv  — For loading environment variables from a .env file.

