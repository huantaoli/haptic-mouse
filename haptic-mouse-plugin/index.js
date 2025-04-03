// 存储鼠标事件和选中文本的数据
let mouseEvents = [];
let selectedText = '';

// 最大存储的鼠标事件数量
const MAX_EVENTS = 50;

// 当页面加载完成时执行
document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const eventsContainer = document.getElementById('events');
  const selectedTextContainer = document.getElementById('selected-text');
  const updateStatus = document.getElementById('update-status');
  
  // 监听鼠标事件
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleMouseClick);
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mouseup', handleMouseUp);
  
  // 监听文本选择事件
  document.addEventListener('selectionchange', handleSelectionChange);
  
  // 更新状态信息
  updateStatus.textContent = '实时更新已启用 - ' + new Date().toLocaleTimeString();
  
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
    displaySelectedText(selectedText);
  }
  
  // 添加鼠标事件到数组并显示
  function addMouseEvent(event) {
    mouseEvents.push(event);
    
    // 限制存储的事件数量
    if (mouseEvents.length > MAX_EVENTS) {
      mouseEvents.shift();
    }
    
    // 显示鼠标事件
    displayMouseEvents(mouseEvents);
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