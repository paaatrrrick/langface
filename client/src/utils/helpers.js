const trimStringToChars = (str, N) => {
    if (str.length > N) {
        return str.substring(0, N - 3) + "...";
    } else {
        return str;
    }
}



export { trimStringToChars }