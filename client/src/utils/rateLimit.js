
const rateLimitBlogger = (iterations) => {
    if (process.env.REACT_APP_RUNNING_LOCAL === "true") return true;
    const MAX_CALLS = 50;
    const CURRENT_DATE = new Date().toLocaleDateString();

    let apiCallsData = JSON.parse(localStorage.getItem('apiCallsBlogger') || '{}');

    // Check if a new day has started or this is the first API call
    if (!apiCallsData.date || apiCallsData.date !== CURRENT_DATE) {
        // New day or first API call - reset count and date
        apiCallsData = { date: CURRENT_DATE, count: iterations };
    } else {
        // Same day - increment count
        apiCallsData.count += iterations;
    }
    if (apiCallsData.count > MAX_CALLS) {
        // Limit reached for today
        return `You only can post ${MAX_CALLS - (apiCallsData.count - iterations)} more blogs to blogger today. Come back tomorrow or ask in Discord for a higher limit.`;
    }
    localStorage.setItem('apiCallsBlogger', JSON.stringify(apiCallsData));
    return true;
}

const rateLimitWordpress = (iterations) => {
    if (process.env.REACT_APP_RUNNING_LOCAL === "true") return true;
    const MAX_CALLS = 8;
    const CURRENT_DATE = new Date().toLocaleDateString(); 
    let apiCallsData = JSON.parse(localStorage.getItem('apiCallsWordpress') || '{}');
    console.log(apiCallsData);
    // Check if a new day has started or this is the first API call
    if (!apiCallsData.date || apiCallsData.date !== CURRENT_DATE) {
        console.log('new day')
        // New day or first API call - reset count and date
        apiCallsData = { date: CURRENT_DATE, count: Number(iterations) };
    } else {
        console.log('same day')
        // Same day - increment count
        apiCallsData.count += Number(iterations);
    }
    console.log(apiCallsData)
    if (apiCallsData.count > MAX_CALLS) {
        // Limit reached for today
        return `You only can post ${MAX_CALLS - (apiCallsData.count - iterations)} more blogs to Wordpress today. Come back tomorrow or ask in Discord for a higher limit.`;
    }
    localStorage.setItem('apiCallsWordpress', JSON.stringify(apiCallsData));
    return true;
}

export { rateLimitBlogger, rateLimitWordpress };