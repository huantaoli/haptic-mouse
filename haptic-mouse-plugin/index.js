// Store mouse events and selected text data
let mouseEvents = [];
let selectedText = '';

// Maximum number of stored mouse events
const MAX_EVENTS = 50;

// Execute when page is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const eventsContainer = document.getElementById('events');
  const selectedTextContainer = document.getElementById('selected-text');
  const updateStatus = document.getElementById('update-status');
  
  // Listen for mouse events
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleMouseClick);
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('dblclick', handleDblClick);
  document.addEventListener('mouseenter', handleMouseEnter);
  document.addEventListener('mouseleave', handleMouseLeave);
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('contextmenu', handleContextMenu);
  
  // Listen for text selection events
  document.addEventListener('selectionchange', handleSelectionChange);
  
  // Update status information
  updateStatus.textContent = 'Real-time update enabled - ' + new Date().toLocaleTimeString();
  
  // Handle mouse move events
  function handleMouseMove(event) {
    addMouseEvent({
      type: 'mousemove',
      x: event.clientX,
      y: event.clientY,
      timestamp: new Date().getTime()
    });
  }
  
  // Handle mouse click events
  function handleMouseClick(event) {
    addMouseEvent({
      type: 'click',
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      timestamp: new Date().getTime()
    });
  }
  
  // Handle mouse down events
  function handleMouseDown(event) {
    addMouseEvent({
      type: 'mousedown',
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      timestamp: new Date().getTime()
    });
  }
  
  // Handle mouse up events
  function handleMouseUp(event) {
    addMouseEvent({
      type: 'mouseup',
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      timestamp: new Date().getTime()
    });
  }

  // Handle double click events
  function handleDblClick(event) {
    addMouseEvent({
      type: 'dblclick',
      x: event.clientX,
      y: event.clientY,
      timestamp: new Date().getTime()
    });
  }

  // Handle mouse enter events
  function handleMouseEnter(event) {
    addMouseEvent({
      type: 'mouseenter',
      x: event.clientX,
      y: event.clientY,
      target: event.target.tagName,
      timestamp: new Date().getTime()
    });
  }

  // Handle mouse leave events
  function handleMouseLeave(event) {
    addMouseEvent({
      type: 'mouseleave',
      x: event.clientX,
      y: event.clientY,
      target: event.target.tagName,
      timestamp: new Date().getTime()
    });
  }

  // Handle mouse over events
  function handleMouseOver(event) {
    addMouseEvent({
      type: 'mouseover',
      x: event.clientX,
      y: event.clientY,
      target: event.target.tagName,
      relatedTarget: event.relatedTarget ? event.relatedTarget.tagName : null,
      timestamp: new Date().getTime()
    });
  }

  // Handle mouse out events
  function handleMouseOut(event) {
    addMouseEvent({
      type: 'mouseout',
      x: event.clientX,
      y: event.clientY,
      target: event.target.tagName,
      relatedTarget: event.relatedTarget ? event.relatedTarget.tagName : null,
      timestamp: new Date().getTime()
    });
  }

  // Handle context menu events
  function handleContextMenu(event) {
    event.preventDefault(); // Prevent default context menu
    addMouseEvent({
      type: 'contextmenu',
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      timestamp: new Date().getTime()
    });
  }
  
  // Handle text selection events
  function handleSelectionChange() {
    const selection = window.getSelection();
    selectedText = selection.toString();
    displaySelectedText(selectedText);
  }
  
  // Add mouse event to array and display
  function addMouseEvent(event) {
    mouseEvents.push(event);
    
    // Limit number of stored events
    if (mouseEvents.length > MAX_EVENTS) {
      mouseEvents.shift();
    }
    
    // Display mouse events
    displayMouseEvents(mouseEvents);
  }
  
  // Display mouse events
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
        case 'dblclick':
          eventInfo = `Double Click: (${event.x}, ${event.y})`;
          break;
        case 'mouseenter':
          eventInfo = `Enter Element: (${event.x}, ${event.y}) Target: ${event.target}`;
          break;
        case 'mouseleave':
          eventInfo = `Leave Element: (${event.x}, ${event.y}) Target: ${event.target}`;
          break;
        case 'mouseover':
          eventInfo = `Over: (${event.x}, ${event.y}) Target: ${event.target} From: ${event.relatedTarget || 'None'}`;
          break;
        case 'mouseout':
          eventInfo = `Out: (${event.x}, ${event.y}) Target: ${event.target} To: ${event.relatedTarget || 'None'}`;
          break;
        case 'contextmenu':
          eventInfo = `Context Menu: (${event.x}, ${event.y})`;
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