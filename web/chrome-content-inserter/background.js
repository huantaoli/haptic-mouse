// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateIcon') {
    const iconPath = {
      16: `images/icon16${request.connected ? '_g' : ''}.png`,
      48: `images/icon48${request.connected ? '_g' : ''}.png`,
      128: `images/icon128${request.connected ? '_g' : ''}.png`
    };
    chrome.action.setIcon({ path: iconPath });
  }
});