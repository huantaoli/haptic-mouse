// 存储当前连接的设备
let currentDevice = null;

// 断开设备连接
async function disconnectDevice() {
  if (currentDevice && currentDevice.opened) {
    await currentDevice.close();
  }
  currentDevice = null;
  chrome.storage.local.remove('connectedHIDDevices');
  updateExtensionIcon(false);
  floatingButton.textContent = '连接HID设备';
  floatingButton.style.backgroundColor = '#2196F3';
}

// 更新扩展图标
function updateExtensionIcon(connected) {
  chrome.runtime.sendMessage({
    action: 'updateIcon',
    connected: connected
  });
}

// 创建浮动按钮
const floatingButton = document.createElement('button');
floatingButton.textContent = '连接HID设备';
floatingButton.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 20px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  z-index: 9999;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  transition: background-color 0.3s ease;
`;

// 添加点击事件处理HID设备请求
floatingButton.addEventListener('click', async () => {
  try {
    // 如果已经有连接的设备，先断开它
    if (currentDevice) {
      await disconnectDevice();
      return;
    }

    const devices = await navigator.hid.requestDevice({
      filters: [] // 空数组表示接受所有HID设备
    });
    
    if (devices.length > 0) {
      // 只取第一个设备
      const device = devices[0];
      
      // 尝试打开设备连接
      await device.open();
      currentDevice = device;

      const deviceInfo = {
        productName: device.productName,
        vendorId: device.vendorId,
        productId: device.productId,
        manufacturerName: device.manufacturerName || '未知制造商'
      };
      
      // 存储设备信息到chrome.storage
      chrome.storage.local.set({ 'connectedHIDDevices': [deviceInfo] });
      console.log('已连接HID设备:', deviceInfo);
      
      // 更新图标为已连接状态
      updateExtensionIcon(true);
      
      // 更新按钮文本
      floatingButton.textContent = '断开HID设备';
      floatingButton.style.backgroundColor = '#45a049';
    }
  } catch (error) {
    console.error('HID设备操作出错:', error);
    await disconnectDevice();
  }
});

// 检查是否已有连接的设备并设置初始状态
chrome.storage.local.get(['connectedHIDDevices'], function(result) {
  const hasConnectedDevices = result.connectedHIDDevices && result.connectedHIDDevices.length > 0;
  updateExtensionIcon(hasConnectedDevices);
  
  if (hasConnectedDevices) {
    floatingButton.textContent = '断开HID设备';
    floatingButton.style.backgroundColor = '#45a049';
  }
});

// 将按钮添加到页面
document.body.appendChild(floatingButton);

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'insertHTML') {
    const div = document.createElement('div');
    div.innerHTML = request.content;
    document.body.appendChild(div);
  }
});