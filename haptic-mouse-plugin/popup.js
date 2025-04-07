// Check if current window is detached
let isDetachedWindow = window.location.search.includes('detached=true');

// Serial port variables
let port = null;
let portReader = null;
let keepReading = false;

// HID device variables
let hidDevice = null;
let keepReadingHID = false;

// Execute when popup page is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const eventsContainer = document.getElementById('events');
  const selectedTextContainer = document.getElementById('selected-text');
  const updateStatus = document.getElementById('update-status');
  const portList = document.getElementById('port-list');
  const connectButton = document.getElementById('connect-button');
  const connectionStatus = document.getElementById('connection-status');
  const hidList = document.getElementById('hid-list');
  const hidConnectButton = document.getElementById('hid-connect-button');
  const hidStatus = document.getElementById('hid-status');

  // Setup serial port controls
  setupSerialPort();
  
  // Setup HID device controls
  setupHIDDevice();
  
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

  // 设置串口连接功能
  async function setupSerialPort() {
    // 更新可用串口列表
    async function updatePortList() {
      const ports = await navigator.serial.getPorts();
      portList.innerHTML = '';
      
      if (ports.length === 0) {
        const option = document.createElement('option');
        option.textContent = 'No ports available';
        option.disabled = true;
        portList.appendChild(option);
        return;
      }

      ports.forEach(port => {
        const option = document.createElement('option');
        option.value = port.getInfo().usbVendorId;
        option.textContent = `Port ${port.getInfo().usbVendorId}`;
        portList.appendChild(option);
      });
    }

    // 初始化串口列表
    await updatePortList();

    // 连接/断开串口
    connectButton.addEventListener('click', async () => {
      if (!port) {
        try {
          // 请求串口访问权限
          port = await navigator.serial.requestPort();
          await port.open({ baudRate: 9600 });
          
          connectButton.textContent = 'Disconnect';
          connectButton.style.backgroundColor = '#db4437';
          connectionStatus.textContent = 'Connected';
          
          // 开始读取串口数据
          keepReading = true;
          portReader = port.readable.getReader();
          readSerialData();
        } catch (error) {
          console.error('Error opening serial port:', error);
          connectionStatus.textContent = `Error: ${error.message}`;
        }
      } else {
        // 断开连接
        try {
          keepReading = false;
          if (portReader) {
            await portReader.cancel();
            await portReader.releaseLock();
          }
          await port.close();
          port = null;
          
          connectButton.textContent = 'Connect';
          connectButton.style.backgroundColor = '#4285f4';
          connectionStatus.textContent = 'Disconnected';
        } catch (error) {
          console.error('Error closing serial port:', error);
          connectionStatus.textContent = `Error: ${error.message}`;
        }
      }
    });
  }

  // 设置HID设备连接功能
  async function setupHIDDevice() {
    // 更新可用HID设备列表
    async function updateHIDList() {
      const devices = await navigator.hid.getDevices();
      hidList.innerHTML = '';
      
      if (devices.length === 0) {
        const option = document.createElement('option');
        option.textContent = 'No HID devices available';
        option.disabled = true;
        hidList.appendChild(option);
        return;
      }

      devices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.productId;
        option.textContent = `${device.productName || 'Unknown Device'} (${device.productId})`;
        hidList.appendChild(option);
      });
    }

    // 初始化HID设备列表
    await updateHIDList();

    // 连接/断开HID设备
    hidConnectButton.addEventListener('click', async () => {
      if (!hidDevice) {
        try {
          // 请求HID设备访问权限
          const devices = await navigator.hid.requestDevice({
            filters: [] // 允许选择任何HID设备
          });
          
          if (devices.length > 0) {
            hidDevice = devices[0];
            await hidDevice.open();
            
            hidConnectButton.textContent = 'Disconnect';
            hidConnectButton.style.backgroundColor = '#db4437';
            hidStatus.textContent = 'Connected';
            
            // 开始读取HID数据
            keepReadingHID = true;
            readHIDData();
          }
        } catch (error) {
          console.error('Error opening HID device:', error);
          hidStatus.textContent = `Error: ${error.message}`;
        }
      } else {
        // 断开连接
        try {
          keepReadingHID = false;
          await hidDevice.close();
          hidDevice = null;
          
          hidConnectButton.textContent = 'Connect';
          hidConnectButton.style.backgroundColor = '#4285f4';
          hidStatus.textContent = 'Disconnected';
        } catch (error) {
          console.error('Error closing HID device:', error);
          hidStatus.textContent = `Error: ${error.message}`;
        }
      }
    });
  }

  // 读取HID数据
  async function readHIDData() {
    while (hidDevice && keepReadingHID) {
      try {
        hidDevice.addEventListener('inputreport', event => {
          const { data, reportId } = event;
          console.log('HID Input Report:', {
            reportId,
            data: new Uint8Array(data.buffer)
          });
        });
      } catch (error) {
        console.error('Error reading HID data:', error);
        break;
      }
    }
  }

  // 设置串口连接功能
  async function setupSerialPort() {
    // 更新可用串口列表
    async function updatePortList() {
      const ports = await navigator.serial.getPorts();
      portList.innerHTML = '';
      
      if (ports.length === 0) {
        const option = document.createElement('option');
        option.textContent = 'No ports available';
        option.disabled = true;
        portList.appendChild(option);
        return;
      }

      ports.forEach(port => {
        const option = document.createElement('option');
        option.value = port.getInfo().usbVendorId;
        option.textContent = `Port ${port.getInfo().usbVendorId}`;
        portList.appendChild(option);
      });
    }

    // 初始化串口列表
    await updatePortList();

    // 连接/断开串口
    connectButton.addEventListener('click', async () => {
      if (!port) {
        try {
          // 请求串口访问权限
          port = await navigator.serial.requestPort();
          await port.open({ baudRate: 9600 });
          
          connectButton.textContent = 'Disconnect';
          connectButton.style.backgroundColor = '#db4437';
          connectionStatus.textContent = 'Connected';
          
          // 开始读取串口数据
          keepReading = true;
          portReader = port.readable.getReader();
          readSerialData();
        } catch (error) {
          console.error('Error opening serial port:', error);
          connectionStatus.textContent = `Error: ${error.message}`;
        }
      } else {
        // 断开连接
        try {
          keepReading = false;
          if (portReader) {
            await portReader.cancel();
            await portReader.releaseLock();
          }
          await port.close();
          port = null;
          
          connectButton.textContent = 'Connect';
          connectButton.style.backgroundColor = '#4285f4';
          connectionStatus.textContent = 'Disconnected';
        } catch (error) {
          console.error('Error closing serial port:', error);
          connectionStatus.textContent = `Error: ${error.message}`;
        }
      }
    });
  }

  // 读取串口数据
  async function readSerialData() {
    while (port && keepReading) {
      try {
        const { value, done } = await portReader.read();
        if (done) {
          break;
        }
        // 处理接收到的数据
        console.log('Received:', new TextDecoder().decode(value));
      } catch (error) {
        console.error('Error reading serial data:', error);
        break;
      }
    }
  }
  
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