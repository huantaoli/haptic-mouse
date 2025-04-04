// Check if current window is detached
let isDetachedWindow = window.location.search.includes('detached=true');

// Execute when popup page is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const eventsContainer = document.getElementById('events');
  const selectedTextContainer = document.getElementById('selected-text');
  const updateStatus = document.getElementById('update-status');
  
  // Add pin button if in popup mode
  if (!isDetachedWindow) {
    addPinButton();
  }
  
  // 初始化页面数据
  initializeData();
  
  // 设置实时更新
  setupLiveUpdates();
  
  // 设置打开测试页面按钮
  setupTestPageButton();
  
  // 设置测试页面按钮点击事件
  function setupTestPageButton() {
    const openTestPageButton = document.getElementById('open-test-page');
    if (openTestPageButton) {
      openTestPageButton.addEventListener('click', function() {
        // Open test page in new tab
        chrome.tabs.create({
          url: chrome.runtime.getURL('index.html')
        });
      });
    }
  }
  
  // 初始化页面数据
  function initializeData() {
    // Get current tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length === 0) return;
      
      const activeTab = tabs[0];
      
      // Get mouse event data
      chrome.tabs.sendMessage(activeTab.id, {action: 'getMouseEvents'}, function(response) {
        if (response && response.events) {
          displayMouseEvents(response.events);
        }
      });
      
      // Get selected text
      chrome.tabs.sendMessage(activeTab.id, {action: 'getSelectedText'}, function(response) {
        if (response && response.text) {
          displaySelectedText(response.text);
        }
      });
    });
  }
  
  // 添加固定按钮
  function addPinButton() {
    const pinButton = document.createElement('button');
    pinButton.textContent = 'Pin Window';
    pinButton.style.position = 'absolute';
    pinButton.style.top = '10px';
    pinButton.style.right = '10px';
    pinButton.style.padding = '5px 10px';
    pinButton.style.backgroundColor = '#4285f4';
    pinButton.style.color = 'white';
    pinButton.style.border = 'none';
    pinButton.style.borderRadius = '4px';
    pinButton.style.cursor = 'pointer';
    
    pinButton.addEventListener('click', function() {
      // Create a new detached window
      chrome.windows.create({
        url: chrome.runtime.getURL('popup.html') + '?detached=true',
        type: 'popup',
        width: 420,
        height: 350
      }, function() {
        // Close current popup after creating new window
        window.close();
      });
    });
    
    document.body.appendChild(pinButton);
  }
  
  // 设置实时更新
  function setupLiveUpdates() {
    // Listen for messages from content script
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      // Update mouse events
      if (message.action === 'updateMouseEvents') {
        displayMouseEvents(message.events);
      }
      
      // Update selected text
      else if (message.action === 'updateSelectedText') {
        displaySelectedText(message.text);
      }
      
      // Must return true to keep message port open for async response
      return true;
    });
    
    updateStatus.textContent = 'Live updates enabled - ' + new Date().toLocaleTimeString();
  }
  
  // 显示鼠标事件
  function displayMouseEvents(events) {
    if (!events || events.length === 0) {
      eventsContainer.innerHTML = '<div class="status">No mouse events captured yet</div>';
      return;
    }
    
    // Clear container
    eventsContainer.innerHTML = '';
    
    // Display last 10 events (in reverse order)
    const recentEvents = events.slice(-10).reverse();
    
    recentEvents.forEach(function(event) {
      const eventElement = document.createElement('div');
      eventElement.className = 'event-item';
      
      // Format time
      const date = new Date(event.timestamp);
      const timeString = date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0');
      
      // Display different information based on event type
      let eventInfo = '';
      switch(event.type) {
        case 'mousemove':
          eventInfo = `Move: (${event.x}, ${event.y})`;
          break;
        case 'click':
          eventInfo = `Click: (${event.x}, ${event.y}) Button: ${getButtonName(event.button)}`;
          break;
        case 'mousedown':
          eventInfo = `Down: (${event.x}, ${event.y}) Button: ${getButtonName(event.button)}`;
          break;
        case 'mouseup':
          eventInfo = `Up: (${event.x}, ${event.y}) Button: ${getButtonName(event.button)}`;
          break;
        default:
          eventInfo = `${event.type}: (${event.x}, ${event.y})`;
      }
      
      eventElement.textContent = `${timeString} - ${eventInfo}`;
      eventsContainer.appendChild(eventElement);
    });
  }
  
  // 显示选中的文本
  function displaySelectedText(text) {
    if (!text || text.trim() === '') {
      selectedTextContainer.innerHTML = '<div class="status">No text selected</div>';
      return;
    }
    
    selectedTextContainer.textContent = text;
  }
  
  // 获取鼠标按钮名称
  function getButtonName(button) {
    switch(button) {
      case 0: return 'Left';
      case 1: return 'Middle';
      case 2: return 'Right';
      default: return button;
    }
  }
});