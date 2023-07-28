const trimStringToChars = (str, N) => {
    if (str.length > N) {
        return str.substring(0, N - 3) + "...";
    } else {
        return str;
    }
}

const hasNonDemoBlog = (blogs) => {
    var res = false;
    //cast object to array
    blogs = Object.values(blogs);
    blogs.forEach(blog => {
        if (!blog.demo) {
            res = true;
        }
    });
    return res;
}



export { trimStringToChars, hasNonDemoBlog }