// 存储鼠标事件和选中文本的数据
let mouseEvents = [];
let selectedText = '';

// 最大存储的鼠标事件数量
const MAX_EVENTS = 50;

// 监听鼠标事件
document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('click', handleMouseClick);
document.addEventListener('mousedown', handleMouseDown);
document.addEventListener('mouseup', handleMouseUp);

// 监听文本选择事件
document.addEventListener('selectionchange', handleSelectionChange);

// 处理鼠标移动事件
function handleMouseMove(event) {
  addMouseEvent({
    type: 'mousemove',
    x: event.clientX,
    y: event.clientY,
    timestamp: new Date().getTime()
  });
}

// 处理鼠标点击事件
function handleMouseClick(event) {
  addMouseEvent({
    type: 'click',
    x: event.clientX,
    y: event.clientY,
    button: event.button,
    timestamp: new Date().getTime()
  });
}

// 处理鼠标按下事件
function handleMouseDown(event) {
  addMouseEvent({
    type: 'mousedown',
    x: event.clientX,
    y: event.clientY,
    button: event.button,
    timestamp: new Date().getTime()
  });
}

// 处理鼠标释放事件
function handleMouseUp(event) {
  addMouseEvent({
    type: 'mouseup',
    x: event.clientX,
    y: event.clientY,
    button: event.button,
    timestamp: new Date().getTime()
  });
}

// 处理文本选择事件
function handleSelectionChange() {
  const selection = window.getSelection();
  selectedText = selection.toString();
  
  // 将选中的文本发送到popup
  chrome.runtime.sendMessage({
    action: 'updateSelectedText',
    text: selectedText
  });
}

// 添加鼠标事件到数组
function addMouseEvent(event) {
  mouseEvents.push(event);
  
  // 限制存储的事件数量
  if (mouseEvents.length > MAX_EVENTS) {
    mouseEvents.shift();
  }
  
  // 将最新的鼠标事件发送到popup
  chrome.runtime.sendMessage({
    action: 'updateMouseEvents',
    events: mouseEvents
  });
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getMouseEvents') {
    sendResponse({ events: mouseEvents });
  } else if (message.action === 'getSelectedText') {
    sendResponse({ text: selectedText });
  }
});