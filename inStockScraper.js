import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import axios from 'axios';
import 'dotenv/config';

dotenv.config();

puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const main = async () => {
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ["--no-sandbox", '--disable-images', '--disable-css-animations'] 
    });

    const page = await browser.newPage();

    const customUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36';
    await page.setUserAgent(customUA);
    await page.setCacheEnabled(false); 
    await page.addStyleTag({ content: 'body { visibility: hidden !important; }' });

    await page.goto('https://app.im.skeepers.io/login');
    
    const containerSelector = 'form.signin-form';
    await page.waitForSelector(containerSelector);
    
    await page.click('#onetrust-reject-all-handler');

    const emailSelector = 'form.signin-form input[name="sign_in[email]"]';
    const passwordSelector = 'form.signin-form input[name="sign_in[password]"]';

    await page.type(emailSelector, process.env.EMAIL);

    await page.type(passwordSelector, process.env.PASSWORD);
        
    await delay(5000);

    await page.click('button[type="submit"]');
    await delay(5000);

    const linkSelector ='a[href="/creators/campaigns/search"]';
    //await page.waitForSelector(linkSelector);
    
    await page.click(linkSelector);
    await delay(10000);
    const processedProducts = new Set();

    while (true) {
        try {
            await page.waitForSelector('.InfoContainer-sc-kytkzc-5');
          
            const outOfStockElements = await page.evaluate(() => {
                const products = Array.from(document.querySelectorAll('.Campaign-sc-kytkzc-1'));
                const outOfStockProducts = [];
                const inStockProducts = [];
    
                products.forEach(product => {
                    const titleElement = product.querySelector('.Title-sc-kytkzc-6');
                    const availabilityElement = product.querySelector('.OutOfStock-sc-kytkzc-0');
                    const availabilityText = availabilityElement?.textContent?.trim().toLowerCase();

                    if (titleElement && availabilityText === 'sold out') {
                        outOfStockProducts.push({
                            title: titleElement.textContent.trim(),
                            availability: 'sold out',
                        });
                    } 
                    if (titleElement && !availabilityElement) {
                        inStockProducts.push({
                            title: titleElement.textContent.trim(),
                            availability: 'in stock',
                        });
                    }
                });
    
                return { outOfStockProducts, inStockProducts }

            });
    
            const newOutOfStockProducts = outOfStockElements.outOfStockProducts.filter(product => !processedProducts.has(product.title));
            const newInStockProducts = outOfStockElements.inStockProducts.filter(product => !processedProducts.has(product.title));
    
            if (newOutOfStockProducts.length > 0 || newInStockProducts.length > 0) {
                // Send a notification for out-of-stock products
                if (newOutOfStockProducts.length > 0) {
                    await sendNotificationToDiscord(newOutOfStockProducts);
                    
                    newOutOfStockProducts.forEach(product => {
                        processedProducts.add(product.title);
                    });
                }
                
                // Send a notification for in-stock products
                if (newInStockProducts.length > 0) {
                    await sendNotificationToDiscord(newInStockProducts);
                    
                    newInStockProducts.forEach(product => {
                        processedProducts.add(product.title);
                    });
                }
            }           
            await delay(15000);
            await page.reload();

        } catch (error) {
            if (error.name === 'TimeoutError') {
                console.error('Timeout error occurred. Reloading the page...');
                await page.reload();
            } else {
                console.error('An error occurred', error);
                break;
            }
        }
    }
};

async function sendNotificationToDiscord(updatedProducts) {
    const webhookUrl = process.env.WEBHOOK;

    try {
        // Construct the message content
        let message = '';
        updatedProducts.forEach(product => {
            message += `${product.title} - ${product.availability}\n`;
        });

        // Send the message to Discord webhook
        const response = await axios.post(webhookUrl, {
            content: message
        });

        if (response.status === 204) {
            console.log('Message sent successfully!');
        } else {
            console.log(`Error sending message: ${response.status} ${response.statusText}`); 
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
};

main();