// 检查当前窗口是否是固定窗口
let isDetachedWindow = window.location.search.includes('detached=true');

// 当popup页面加载完成时执行
document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const eventsContainer = document.getElementById('events');
  const selectedTextContainer = document.getElementById('selected-text');
  const updateStatus = document.getElementById('update-status');
  
  // 如果是popup模式，添加固定按钮
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
        // 在新标签页中打开测试页面
        chrome.tabs.create({
          url: chrome.runtime.getURL('index.html')
        });
      });
    }
  }
  
  // 初始化页面数据
  function initializeData() {
    // 获取当前标签页
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length === 0) return;
      
      const activeTab = tabs[0];
      
      // 获取鼠标事件数据
      chrome.tabs.sendMessage(activeTab.id, {action: 'getMouseEvents'}, function(response) {
        if (response && response.events) {
          displayMouseEvents(response.events);
        }
      });
      
      // 获取选中的文本
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
    pinButton.textContent = '固定窗口';
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
      // 创建一个新的固定窗口
      chrome.windows.create({
        url: chrome.runtime.getURL('popup.html') + '?detached=true',
        type: 'popup',
        width: 420,
        height: 350
      }, function() {
        // 创建新窗口后关闭当前popup
        window.close();
      });
    });
    
    document.body.appendChild(pinButton);
  }
  
  // 设置实时更新
  function setupLiveUpdates() {
    // 监听来自content script的消息
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      // 更新鼠标事件
      if (message.action === 'updateMouseEvents') {
        displayMouseEvents(message.events);
      }
      
      // 更新选中的文本
      else if (message.action === 'updateSelectedText') {
        displaySelectedText(message.text);
      }
      
      // 必须返回true以保持消息端口开放，实现异步响应
      return true;
    });
    
    updateStatus.textContent = '实时更新已启用 - ' + new Date().toLocaleTimeString();
  }
  
  // 显示鼠标事件
  function displayMouseEvents(events) {
    if (!events || events.length === 0) {
      eventsContainer.innerHTML = '<div class="status">尚未捕获到鼠标事件</div>';
      return;
    }
    
    // 清空容器
    eventsContainer.innerHTML = '';
    
    // 显示最近的10个事件（倒序）
    const recentEvents = events.slice(-10).reverse();
    
    recentEvents.forEach(function(event) {
      const eventElement = document.createElement('div');
      eventElement.className = 'event-item';
      
      // 格式化时间
      const date = new Date(event.timestamp);
      const timeString = date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0');
      
      // 根据事件类型显示不同的信息
      let eventInfo = '';
      switch(event.type) {
        case 'mousemove':
          eventInfo = `移动: (${event.x}, ${event.y})`;
          break;
        case 'click':
          eventInfo = `点击: (${event.x}, ${event.y}) 按钮: ${getButtonName(event.button)}`;
          break;
        case 'mousedown':
          eventInfo = `按下: (${event.x}, ${event.y}) 按钮: ${getButtonName(event.button)}`;
          break;
        case 'mouseup':
          eventInfo = `释放: (${event.x}, ${event.y}) 按钮: ${getButtonName(event.button)}`;
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
      selectedTextContainer.innerHTML = '<div class="status">尚未选中任何文本</div>';
      return;
    }
    
    selectedTextContainer.textContent = text;
  }
  
  // 获取鼠标按钮名称
  function getButtonName(button) {
    switch(button) {
      case 0: return '左键';
      case 1: return '中键';
      case 2: return '右键';
      default: return button;
    }
  }
});