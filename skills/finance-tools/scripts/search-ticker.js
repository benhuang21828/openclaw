import yahooFinance from 'yahoo-finance2';

const query = process.argv[2];

if (!query) {
    console.error("Please provide a search query (e.g., 'Nvidia')");
    process.exit(1);
}

async function search() {
    try {
        const result = await yahooFinance.search(query);
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error(`Error searching for ${query}:`, error.message);
        process.exit(1);
    }
}

search();
