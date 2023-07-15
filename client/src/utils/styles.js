const setColorScheme = (colorScheme) => {
    if (colorScheme === "light") {
        document.documentElement.style.setProperty('--brandColor', '#625df4');
        document.documentElement.style.setProperty('--brandOffColor', '#e0e1f7');
        document.documentElement.style.setProperty('--mainDark', '#212121');
        document.documentElement.style.setProperty('--lightDark', '#212121');
        document.documentElement.style.setProperty('--darkerBackground', '#f7f7f8');
        document.documentElement.style.setProperty('--lighterBackground', '#fff');
        document.documentElement.style.setProperty('--blackFiler', 'invert(0%) sepia(1%) saturate(7438%) hue-rotate(123deg) brightness(107%) contrast(100%)');
      } else {
        document.documentElement.style.setProperty('--brandColor', '#625df4');
        document.documentElement.style.setProperty('--brandOffColor', '#fff');
        document.documentElement.style.setProperty('--mainDark', '#fff');
        document.documentElement.style.setProperty('--lightDark', '#f7f7f8');
        document.documentElement.style.setProperty('--darkerBackground', '#0e0e0e');
        document.documentElement.style.setProperty('--lighterBackground', '#212121');
        document.documentElement.style.setProperty('--blackFiler', 'invert(100%) sepia(100%) saturate(0%) hue-rotate(83deg) brightness(108%) contrast(101%)');
      }
}

const scrollToBottom = (element) => {
    const totalHeight = element.scrollHeight;
    const stepTime = Math.abs(Math.floor(8000 / totalHeight));
    let currentPos = element.scrollTop;
    const scrollInterval = setInterval(() => {
      currentPos += 5;
      element.scrollTop = currentPos;
      if (currentPos >= totalHeight){
        clearInterval(scrollInterval);
      }
    }, stepTime);
  };

export { setColorScheme, scrollToBottom };