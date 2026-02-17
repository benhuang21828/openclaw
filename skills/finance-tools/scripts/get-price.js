import yahooFinance from 'yahoo-finance2';

const symbol = process.argv[2];

if (!symbol) {
    console.error("Please provide a ticker symbol (e.g., AAPL)");
    process.exit(1);
}

async function getPrice() {
    try {
        let yi = yahooFinance;

        // Check if it's a class and instantiate if needed
        if (typeof yahooFinance === 'function' && /^class\s/.test(Function.prototype.toString.call(yahooFinance))) {
            try {
                yi = new yahooFinance();
            } catch (e) {
                // ignore
            }
        }

        // Check if default export is the instance
        if (yahooFinance.default) {
            yi = yahooFinance.default;
        }

        if (typeof yi.quote === 'function') {
            const quote = await yi.quote(symbol);
            console.log(JSON.stringify(quote, null, 2));
        } else {
            console.error("yi.quote is not a function. Export:", yi);
            console.error("Keys:", Object.keys(yi));
            // Fallback: try to import the named export dynamically? 
            // No, let's just fail strictly.
            process.exit(1);
        }

    } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error.message);
        process.exit(1);
    }
}

getPrice();
