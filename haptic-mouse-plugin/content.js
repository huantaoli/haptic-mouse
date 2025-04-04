// Store mouse events and selected text data
let mouseEvents = [];
let selectedText = '';

// Maximum number of stored mouse events
const MAX_EVENTS = 50;

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

// Handle mouse move event
function handleMouseMove(event) {
  addMouseEvent({
    type: 'mousemove',
    x: event.clientX,
    y: event.clientY,
    timestamp: new Date().getTime()
  });
}

// Handle mouse click event
function handleMouseClick(event) {
  addMouseEvent({
    type: 'click',
    x: event.clientX,
    y: event.clientY,
    button: event.button,
    timestamp: new Date().getTime()
  });
}

// Handle mouse down event
function handleMouseDown(event) {
  addMouseEvent({
    type: 'mousedown',
    x: event.clientX,
    y: event.clientY,
    button: event.button,
    timestamp: new Date().getTime()
  });
}

// Handle mouse up event
function handleMouseUp(event) {
  addMouseEvent({
    type: 'mouseup',
    x: event.clientX,
    y: event.clientY,
    button: event.button,
    timestamp: new Date().getTime()
  });
}

// Handle double click event
function handleDblClick(event) {
  addMouseEvent({
    type: 'dblclick',
    x: event.clientX,
    y: event.clientY,
    timestamp: new Date().getTime()
  });
}

// Handle mouse enter event
function handleMouseEnter(event) {
  addMouseEvent({
    type: 'mouseenter',
    x: event.clientX,
    y: event.clientY,
    target: event.target.tagName,
    timestamp: new Date().getTime()
  });
}

// Handle mouse leave event
function handleMouseLeave(event) {
  addMouseEvent({
    type: 'mouseleave',
    x: event.clientX,
    y: event.clientY,
    target: event.target.tagName,
    timestamp: new Date().getTime()
  });
}

// Handle mouse over event
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

// Handle mouse out event
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

// Handle context menu event
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

// Handle text selection event
function handleSelectionChange() {
  const selection = window.getSelection();
  selectedText = selection.toString();
  
  // Send selected text to popup
  chrome.runtime.sendMessage({
    action: 'updateSelectedText',
    text: selectedText
  });
}

// Add mouse event to array
function addMouseEvent(event) {
  mouseEvents.push(event);
  
  // Limit the number of stored events
  if (mouseEvents.length > MAX_EVENTS) {
    mouseEvents.shift();
  }
  
  // Send latest mouse events to popup
  chrome.runtime.sendMessage({
    action: 'updateMouseEvents',
    events: mouseEvents
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getMouseEvents') {
    sendResponse({ events: mouseEvents });
  } else if (message.action === 'getSelectedText') {
    sendResponse({ text: selectedText });
  }
});